import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireMembership } from '@/lib/enterprise/auth';
import { getAIProvider } from '@/lib/ai/providers';
import Organization from '@/lib/models/Organization';
import { logger } from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const session = await auth();
        
        // requireMembership throws if unauthorized or forbidden
        const membership = await requireMembership(slug, session);
        const orgId = membership.organization._id;

        // Fetch full organization to get knowledge base
        const fullOrg = await Organization.findById(orgId).lean();
        if (!fullOrg) {
            return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
        }

        const { messages } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Mensajes requeridos' }, { status: 400 });
        }

        // Prepare context from knowledge base
        const context = fullOrg.knowledgeBase
            ?.map((doc: any) => `DOCUMENTO: ${doc.filename}\nCONTENIDO: ${doc.content}`)
            .join('\n\n---\n\n') || '';

        // Get AI provider
        const provider = getAIProvider({
            aiProvider: fullOrg.aiProvider,
            aiModel: fullOrg.aiModel
        });

        // Generate response
        const responseText = await provider.chat(messages, context);

        return NextResponse.json({
            role: 'assistant',
            content: responseText
        });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (error.message === 'FORBIDDEN') {
            return NextResponse.json({ error: 'Acceso denegado a esta organización' }, { status: 403 });
        }
        
        logger.error('Error in enterprise chat:', error);
        
        // Handle specific AI configuration errors
        if (error.message.includes('API_KEY')) {
            return NextResponse.json({ error: 'Servicio de IA no configurado para esta organización' }, { status: 503 });
        }

        return NextResponse.json({ error: 'Error al procesar el chat' }, { status: 500 });
    }
}
