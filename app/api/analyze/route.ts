import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveIdea, getIdeas } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { action, idea, history } = await request.json();

        // Inicializar OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || "dummy-key",
        });

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ result: "⚠️ **Falta Configuración**: `OPENAI_API_KEY` faltante." }, { status: 200 });
        }

        if (!idea && !history) {
            return NextResponse.json({ error: "Idea o historial requeridos" }, { status: 400 });
        }

        // Construir contexto base
        let messages: any[] = [];

        if (history && Array.isArray(history)) {
            messages = history.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.plainText || (typeof msg.content === 'string' ? msg.content : "Contenido visual mostrado al usuario")
            }));
        }

        if (action === "save") {
            // Guardar la idea del usuario explícitamente
            try {
                if (idea) {
                    saveIdea(idea, 'user');
                    return NextResponse.json({ result: "Idea guardada" });
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
                    result = parsed.ideas || parsed.result || [];

                    // Guardar automáticamente las bisociaciones
                    if (Array.isArray(result)) {
                        result.forEach((generatedIdea: any) => {
                            try {
                                const ideaText = `${generatedIdea.title}: ${generatedIdea.summary}`;
                                saveIdea(ideaText, 'bisociation');
                            } catch (err) {
                                console.error("Error saving bisociation:", err);
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("Error parsing JSON from OpenAI", e);
            }

            return NextResponse.json({ result });

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
