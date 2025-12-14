import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveIdea, saveIdeas } from '@/lib/db';

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
            // Guardar la idea del usuario explícitamente
            try {
                if (idea) {
                    const savedIdea = await saveIdea(idea, 'user');
                    return NextResponse.json({
                        result: "Idea guardada",
                        idea: savedIdea
                    });
                }
            } catch (err) {
                console.error("Error saving user idea:", err);
                return NextResponse.json({ error: "No se pudo guardar la idea" }, { status: 500 });
            }
        }

        if (action === "similar") {
            const systemPrompt = "Eres un gestor de un Banco de Ideas innovador. Tu tarea es generar ideas similares. Devuelve JSON { result: [{id, title, summary}] }.";

            messages = [
                { role: "system", content: systemPrompt },
                ...messages,
                { role: "user", content: `La idea es: "${idea}". Dame 3 ideas similares.` }
            ];

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
                response_format: { type: "json_object" },
            });

            const content = completion.choices[0].message.content;
            let result = [];

            try {
                if (content) {
                    const parsed = JSON.parse(content);
                    // Robust handling: parsed could be { ideas: [...] }, { result: [...] } or just [...]
                    if (Array.isArray(parsed)) {
                        result = parsed;
                    } else {
                        result = parsed.ideas || parsed.result || [];
                    }

                    // Guardar bisociaciones en MongoDB automáticamente
                    if (result.length > 0) {
                        const ideasToSave = result.map((item: any) => ({
                            text: item.summary || item.title || item.text || JSON.stringify(item),
                            category: 'bisociation' as const
                        }));

                        const savedIdeas = await saveIdeas(ideasToSave);

                        // Devolver las ideas guardadas con sus IDs reales
                        return NextResponse.json({
                            result: savedIdeas.map(idea => ({
                                id: idea.id,
                                title: idea.text.substring(0, 50),
                                summary: idea.text
                            }))
                        });
                    }
                }
            } catch (e) {
                console.error("Error parsing/saving bisociations:", e);
            }

            return NextResponse.json({ result: [] });

        } else if (action === "analysis") {
            const systemPrompt = "Eres un consultor de negocios crítico. Analiza la idea. Usa Markdown.";
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
            const systemPrompt = "Eres el Gestor inteligente de este Banco de Ideas. Tu objetivo es ayudar al usuario a madurar, conectar y explorar sus ideas. Ya has presentado opciones o análisis previos (visibles en el historial). Continúa la conversación de forma natural, respondiendo a las preguntas del usuario o profundizando en los puntos que le interesen. Sé útil, perspicaz y breve.";

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
        console.error("API Error:", error);
        return NextResponse.json({ error: "Error procesando solicitud" }, { status: 500 });
    }
}
