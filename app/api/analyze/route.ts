import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveIdea, saveIdeas } from '@/lib/db';
import { logger } from '@/lib/logger';
import { PROMPTS, API } from '@/lib/constants';
import type { Message, Idea } from '@/types';

/**
 * Tipo para los mensajes del historial de chat
 */
type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    plainText?: string;
};

/**
 * POST /api/analyze
 * Endpoint principal para interactuar con la IA del Banco de Ideas
 * 
 * @param request - Request con { action, idea, history }
 * @returns JSON con el resultado de la acción
 * 
 * Acciones soportadas:
 * - save: Guardar idea del usuario
 * - similar: Generar ideas similares (bisociaciones)
 * - analysis: Analizar idea desde perspectiva de negocio
 * - chat: Conversación fluida con el asistente
 */
export async function POST(request: Request) {
    try {
        const { action, idea, history } = await request.json();

        // Validar que action esté presente
        if (!action || typeof action !== 'string') {
            return NextResponse.json(
                { error: 'Acción requerida. Debe ser: save, similar, analysis o chat' },
                { status: 400 }
            );
        }

        // Validar acciones permitidas
        const validActions = ['save', 'similar', 'analysis', 'chat'];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { error: `Acción inválida: "${action}". Debe ser: ${validActions.join(', ')}` },
                { status: 400 }
            );
        }

        // Inicializar OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || "dummy-key",
        });

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY no configurada. Por favor configura esta variable en .env.local" },
                { status: 500 }
            );
        }

        // Validar que idea esté presente para acciones que la requieren
        if (!idea && action !== 'chat') {
            return NextResponse.json(
                { error: 'El campo "idea" es requerido para esta acción' },
                { status: 400 }
            );
        }

        // Validar longitud de la idea
        if (idea && typeof idea === 'string' && idea.trim().length > 2000) {
            return NextResponse.json(
                { error: 'La idea no puede exceder 2000 caracteres' },
                { status: 400 }
            );
        }

        // Construir contexto base del historial
        let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

        if (history && Array.isArray(history)) {
            messages = history
                .filter((msg: any) => msg && (msg.role === 'user' || msg.role === 'assistant'))
                .map((msg: ChatMessage) => ({
                    role: msg.role,
                    content: msg.plainText || (typeof msg.content === 'string' ? msg.content : "Contenido visual")
                }));
        }

        if (action === "save") {
            if (idea) {
                try {
                    await saveIdea(idea, 'user');
                    return NextResponse.json({ result: "Idea guardada exitosamente" });
                } catch (err: any) {
                    logger.error("Error saving idea:", err.message);
                    return NextResponse.json({
                        result: "Idea recibida (error al persistir)",
                        error: err.message
                    });
                }
            }
        }


        if (action === "similar") {
            try {
                const systemPrompt = PROMPTS.SIMILAR;

                const llmMessages: any = [
                    { role: "system", content: systemPrompt },
                    ...messages,
                    { role: "user", content: `La idea es: "${idea}". Dame 3 ideas similares.` }
                ];

                logger.debug("Calling OpenAI with messages count:", llmMessages.length);

                const completion = await openai.chat.completions.create({
                    model: API.MODEL,
                    messages: llmMessages,
                    response_format: { type: "json_object" },
                });

                const content = completion.choices[0].message.content;
                logger.debug("OpenAI raw response content:", content);

                let result = [];

                if (content) {
                    try {
                        const parsed = JSON.parse(content);
                        if (Array.isArray(parsed)) {
                            result = parsed;
                        } else {
                            result = parsed.ideas || parsed.result || parsed.bisociations || [];
                        }
                        logger.debug("Parsed result count:", result.length);
                    } catch (parseErr) {
                        logger.error("Error parsing OpenAI JSON:", parseErr);
                    }
                }

                if (result.length > 0) {
                    try {
                        const ideasToSave = result.map((item: any) => ({
                            text: item.summary || item.title || item.text || JSON.stringify(item),
                            category: 'bisociation' as const
                        }));

                        logger.debug("Background saving bisociations to DB...");
                        // No esperamos al guardado para responder al usuario
                        try {
                            await saveIdeas(ideasToSave);
                            logger.info("Bisociaciones guardadas correctamente");
                        } catch (err: any) {
                            logger.error("Error guardando bisociaciones:", err.message);
                        }

                        return NextResponse.json({
                            result: result.map((item: any, i: number) => ({
                                id: item.id || `temp-${Date.now()}-${i}`,
                                title: item.title || item.text?.substring(0, 50) || "Idea Sugerida",
                                summary: item.summary || item.text || JSON.stringify(item)
                            }))
                        });
                    } catch (err) {
                        logger.error("Error in result processing:", err);
                        return NextResponse.json({ result: [] });
                    }
                }


                return NextResponse.json({ result: [] });
            } catch (llmErr: any) {
                logger.error("LLM Error in similar action:", llmErr);
                return NextResponse.json({ error: "Error de IA", message: llmErr.message }, { status: 500 });
            }
        }
        else if (action === "analysis") {
            const systemPrompt = PROMPTS.ANALYSIS;
            messages = [
                { role: "system", content: systemPrompt },
                ...messages,
                { role: "user", content: `Analiza esta idea: "${idea}"` }
            ];

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
            });
            return NextResponse.json({ result: completion.choices[0].message.content });

        } else if (action === "chat") {
            // Conversación General / Fluida
            const systemPrompt = PROMPTS.CHAT;

            // En modo chat, 'idea' es el mensaje actual del usuario
            messages = [
                { role: "system", content: systemPrompt },
                ...messages,
                { role: "user", content: idea }
            ];

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
            });

            return NextResponse.json({ result: completion.choices[0].message.content });
        }

        return NextResponse.json({ error: "Acción no válida o flujo no soportado" }, { status: 400 });

    } catch (error: any) {
        logger.error("API Error:", error);
        return NextResponse.json({ error: "Error procesando solicitud" }, { status: 500 });
    }
}
