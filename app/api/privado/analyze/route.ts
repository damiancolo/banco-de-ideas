import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireAuth } from '@/lib/auth-utils';
import { savePrivateIdea, savePrivateIdeas } from '@/lib/db';
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
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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

        if (!process.env.DEEPSEEK_API_KEY) {
            return NextResponse.json({ error: "DEEPSEEK_API_KEY no configurada" }, { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: "https://api.deepseek.com",
        });

        if (!idea && action !== 'chat') {
            return NextResponse.json({ error: 'El campo "idea" es requerido' }, { status: 400 });
        }

        if (idea && typeof idea === 'string' && idea.trim().length > 2000) {
            return NextResponse.json({ error: 'La idea no puede exceder 2000 caracteres' }, { status: 400 });
        }

        let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

        if (history && Array.isArray(history)) {
            messages = history
                .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant'))
                .map((msg: ChatMessage) => ({
                    role: msg.role,
                    content: msg.plainText || (typeof msg.content === 'string' ? msg.content : "Contenido visual")
                }));
        }

        if (action === "save") {
            if (idea) {
                try {
                    await savePrivateIdea(idea, 'user', userId);
                    return NextResponse.json({ result: "Idea guardada exitosamente" });
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
                    logger.error("Error saving private idea:", errorMessage);
                    return NextResponse.json({ result: "Idea recibida (error al persistir)", error: errorMessage });
                }
            }
        }

        if (action === "similar") {
            try {
                const systemPrompt = PROMPTS.SIMILAR;
                const llmMessages = [
                    { role: "system" as const, content: systemPrompt },
                    ...messages,
                    { role: "user" as const, content: `La idea es: "${idea}". Dame 3 ideas similares.` }
                ];

                const completion = await openai.chat.completions.create({
                    model: API.MODEL,
                    messages: llmMessages,
                    response_format: { type: "json_object" },
                });

                const content = completion.choices?.[0]?.message?.content;
                if (!content) return NextResponse.json({ result: [] });

                let result = [];
                try {
                    const parsed = JSON.parse(content);
                    if (Array.isArray(parsed)) {
                        result = parsed;
                    } else {
                        result = parsed.ideas || parsed.result || parsed.bisociations || [];
                    }
                } catch (parseErr) {
                    logger.error("Error parsing DeepSeek JSON:", parseErr);
                }

                if (result.length > 0) {
                    const ideasToSave = result.map((item: SuggestedIdea) => ({
                        text: item.summary || item.title || item.text || JSON.stringify(item),
                        category: 'bisociation' as const
                    }));

                    try {
                        await savePrivateIdeas(ideasToSave, userId);
                    } catch (err: unknown) {
                        logger.error("Error guardando bisociaciones privadas:", err);
                    }

                    return NextResponse.json({
                        result: result.map((item: SuggestedIdea, i: number) => ({
                            id: item.id || `temp-${Date.now()}-${i}`,
                            title: item.title || item.text?.substring(0, 50) || "Idea Sugerida",
                            summary: item.summary || item.text || JSON.stringify(item)
                        }))
                    });
                }

                return NextResponse.json({ result: [] });
            } catch (llmErr: unknown) {
                logger.error("LLM Error in similar action:", llmErr);
                return NextResponse.json({ error: "Error de IA" }, { status: 500 });
            }
        } else if (action === "analysis") {
            const systemPrompt = PROMPTS.ANALYSIS;
            messages = [
                { role: "system", content: systemPrompt },
                ...messages,
                { role: "user", content: `Analiza esta idea: "${idea}"` }
            ];

            const completion = await openai.chat.completions.create({
                model: API.MODEL,
                messages: messages,
            });
            const analysisContent = completion.choices?.[0]?.message?.content;
            if (!analysisContent) {
                return NextResponse.json({ error: "La IA no pudo generar un análisis" }, { status: 500 });
            }
            return NextResponse.json({ result: analysisContent });

        } else if (action === "chat") {
            const systemPrompt = PROMPTS.CHAT;
            messages = [
                { role: "system", content: systemPrompt },
                ...messages,
                { role: "user", content: idea }
            ];

            const completion = await openai.chat.completions.create({
                model: API.MODEL,
                messages: messages,
            });

            const chatContent = completion.choices?.[0]?.message?.content;
            if (!chatContent) {
                return NextResponse.json({ error: "La IA no pudo generar una respuesta" }, { status: 500 });
            }
            return NextResponse.json({ result: chatContent });
        }

        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });

    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : "Error desconocido";
        logger.error("Private API Error:", errorMsg);
        return NextResponse.json({ error: "Error procesando solicitud" }, { status: 500 });
    }
}
