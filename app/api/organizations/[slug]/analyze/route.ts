import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireMembership } from '@/lib/enterprise/auth';
import { getAIProvider } from '@/lib/ai/providers';
import { saveOrganizationIdea } from '@/lib/db';
import Organization from '@/lib/models/Organization';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const session = await auth();

    let membership: Awaited<ReturnType<typeof requireMembership>>;
    try {
        membership = await requireMembership(slug, session);
    } catch (e: any) {
        if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const ip = getIp(request);
        const rateLimit = await checkRateLimit(ip, `org-analyze-${slug}`, 15, 60);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en un minuto.' }, { status: 429 });
        }

        const { action, idea, history } = await request.json();

        if (!action || !['save', 'similar', 'analysis', 'chat'].includes(action)) {
            return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
        }
        if (!idea && action !== 'chat') {
            return NextResponse.json({ error: 'El campo "idea" es requerido' }, { status: 400 });
        }

        const orgId = membership.organization._id;
        const userId = session?.user?.id;

        // save action: just persist the idea
        if (action === 'save') {
            if (idea) {
                await saveOrganizationIdea(idea, 'user', orgId, userId);
            }
            return NextResponse.json({ result: 'Idea guardada' });
        }

        // For AI actions, fetch full org (knowledge base + AI config)
        const fullOrg = await Organization.findById(orgId).lean();
        if (!fullOrg) return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });

        const context = (fullOrg.knowledgeBase ?? [])
            .map((doc: any) => `DOCUMENTO: ${doc.filename}\nCONTENIDO: ${doc.content}`)
            .join('\n\n---\n\n');

        const provider = getAIProvider({ aiProvider: fullOrg.aiProvider, aiModel: fullOrg.aiModel });

        // Build message history
        const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    messages.push({
                        role: msg.role,
                        content: msg.plainText || (typeof msg.content === 'string' ? msg.content : '')
                    });
                }
            }
        }

        if (action === 'similar') {
            const userMessages = [
                ...messages,
                { role: 'user' as const, content: `La idea es: "${idea}". Dame 3 ideas similares o conexiones creativas en formato JSON array con campos: id, title, summary.` }
            ];
            const responseText = await provider.chat(userMessages, context);

            let result = [];
            try {
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (jsonMatch) result = JSON.parse(jsonMatch[0]);
            } catch { /* malformed JSON: return empty */ }

            // Save bisociations to org scope
            if (result.length > 0) {
                for (const item of result) {
                    const text = item.summary || item.title || '';
                    if (text) {
                        await saveOrganizationIdea(text, 'bisociation', orgId, userId).catch(() => {});
                    }
                }
                return NextResponse.json({
                    result: result.map((item: any, i: number) => ({
                        id: item.id || `temp-${Date.now()}-${i}`,
                        title: item.title || item.summary?.substring(0, 50) || 'Idea',
                        summary: item.summary || item.title || ''
                    }))
                });
            }
            return NextResponse.json({ result: [] });
        }

        if (action === 'analysis') {
            const userMessages = [
                ...messages,
                { role: 'user' as const, content: `Analiza esta idea en el contexto de la organización: "${idea}"` }
            ];
            const responseText = await provider.chat(userMessages, context);
            return NextResponse.json({ result: responseText });
        }

        if (action === 'chat') {
            const userMessages = [
                ...messages,
                { role: 'user' as const, content: idea }
            ];
            const responseText = await provider.chat(userMessages, context);
            return NextResponse.json({ result: responseText });
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

    } catch (error: any) {
        logger.error('Error in org analyze:', error);
        return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
    }
}
