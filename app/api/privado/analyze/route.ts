import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import { requireAuth } from '@/lib/auth-utils';
import { savePrivateIdea, saveIdeas } from '@/lib/db';
import { logger } from '@/lib/logger';
import { PROMPTS, API } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';

type SuggestedIdea = {
    id?: string;
    title?: string;
    summary?: string;
    text?: string;
};

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    plainText?: string;
};

export async function POST(request: Request) {
    let userId: string;
    let userEmail: string | null | undefined;
    try {
        userId = await requireAuth();
        const session = await auth();
        userEmail = session?.user?.email;
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const OWNER_MODEL = 'claude-opus-4-8';
    const DEFAULT_MODEL = 'claude-opus-4-6';
    const claudeModel = userEmail === 'damianlafferranderie@gmail.com' ? OWNER_MODEL : DEFAULT_MODEL;

    try {
        const ip = getIp(request);
        const rateLimit = await checkRateLimit(ip, 'privado-analyze', 15, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
                { status: 429 }
            );
        }

        const { action, idea, history } = await request.json();

        if (!action || typeof action !== 'string') {
            return NextResponse.json({ error: 'Acción requerida' }, { status: 400 });
        }

        const validActions = ['save', 'similar', 'analysis', 'chat'];
        if (!validActions.includes(action)) {
            return NextResponse.json({ error: `Acción inválida: "${action}"` }, { status: 400 });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
        }

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        if (!idea && action !== 'chat') {
            return NextResponse.json({ error: 'El campo "idea" es requerido' }, { status: 400 });
        }

        if (idea && typeof idea === 'string' && idea.trim().length > API.MAX_IDEA_LENGTH) {
            return NextResponse.json({ error: 'La idea no puede exceder 2000 caracteres' }, { status: 400 });
        }

        // Build message history (Anthropic only accepts user/assistant roles)
        let messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        if (history && Array.isArray(history)) {
            messages = history
                .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant'))
                .map((msg: ChatMessage) => ({
                    role: msg.role,
                    content: msg.plainText || (typeof msg.content === 'string' ? msg.content : 'Contenido visual')
                }));
        }

        if (action === 'save') {
            if (idea) {
                try {
                    await savePrivateIdea(idea, 'user', userId);
                    return NextResponse.json({ result: 'Idea guardada exitosamente' });
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
                    logger.error('Error saving private idea:', errorMessage);
                    return NextResponse.json({ result: 'Idea recibida (error al persistir)', error: errorMessage });
                }
            }
        }

        if (action === 'similar') {
            try {
                const userMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
                    ...messages,
                    { role: 'user', content: `La idea es: "${idea}". Dame 3 ideas similares en formato JSON.` }
                ];

                const completion = await anthropic.messages.create({
                    model: claudeModel,
                    max_tokens: 1024,
                    system: PROMPTS.SIMILAR,
                    messages: userMessages,
                });

                const content = completion.content[0]?.type === 'text' ? completion.content[0].text : null;
                if (!content) return NextResponse.json({ result: [] });

                let result = [];
                try {
                    // Extract JSON from response (Claude may wrap it in markdown)
                    const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                    const jsonStr = jsonMatch ? jsonMatch[0] : content;
                    const parsed = JSON.parse(jsonStr);
                    if (Array.isArray(parsed)) {
                        result = parsed;
                    } else {
                        result = parsed.ideas || parsed.result || parsed.bisociations || [];
                    }
                } catch (parseErr) {
                    logger.error('Error parsing Claude JSON:', parseErr);
                }

                if (result.length > 0) {
                    const ideasToSave = result.map((item: SuggestedIdea) => ({
                        text: item.summary || item.title || item.text || JSON.stringify(item),
                        category: 'bisociation' as const
                    }));
                    try {
                        await saveIdeas(ideasToSave);
                    } catch (err: unknown) {
                        logger.error('Error guardando bisociaciones privadas:', err);
                    }

                    return NextResponse.json({
                        result: result.map((item: SuggestedIdea, i: number) => ({
                            id: item.id || `temp-${Date.now()}-${i}`,
                            title: item.title || item.text?.substring(0, 50) || 'Idea Sugerida',
                            summary: item.summary || item.text || JSON.stringify(item)
                        }))
                    });
                }

                return NextResponse.json({ result: [] });
            } catch (llmErr: unknown) {
                logger.error('Claude Error in similar action:', llmErr);
                return NextResponse.json({ error: 'Error de IA' }, { status: 500 });
            }

        } else if (action === 'analysis') {
            const userMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
                ...messages,
                { role: 'user', content: `Analiza esta idea: "${idea}"` }
            ];

            const completion = await anthropic.messages.create({
                model: claudeModel,
                max_tokens: 2048,
                system: PROMPTS.ANALYSIS,
                messages: userMessages,
            });

            const analysisContent = completion.content[0]?.type === 'text' ? completion.content[0].text : null;
            if (!analysisContent) {
                return NextResponse.json({ error: 'La IA no pudo generar un análisis' }, { status: 500 });
            }
            return NextResponse.json({ result: analysisContent });

        } else if (action === 'chat') {
            const userMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
                ...messages,
                { role: 'user', content: idea }
            ];

            const completion = await anthropic.messages.create({
                model: claudeModel,
                max_tokens: 1024,
                system: PROMPTS.CHAT,
                messages: userMessages,
            });

            const chatContent = completion.content[0]?.type === 'text' ? completion.content[0].text : null;
            if (!chatContent) {
                return NextResponse.json({ error: 'La IA no pudo generar una respuesta' }, { status: 500 });
            }
            return NextResponse.json({ result: chatContent });
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        logger.error('Private API Error:', errorMsg);
        return NextResponse.json({ error: 'Error procesando solicitud' }, { status: 500 });
    }
}
