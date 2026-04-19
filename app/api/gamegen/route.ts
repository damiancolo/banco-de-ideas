import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

export const maxDuration = 90;

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: 'https://api.deepseek.com',
});

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://estudioprompt.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const PLAN_SYSTEM = `Eres un diseñador de videojuegos experto. Dado un conjunto de elementos/disparadores, diseña un juego de navegador simple pero ingenioso y divertido.

Responde ÚNICAMENTE con JSON válido (sin markdown, sin texto fuera del JSON), con esta estructura exacta:
{
  "titulo": "nombre del juego",
  "genero": "género breve (ej: arcade, puzzle, plataformas, estrategia, acción)",
  "mecanica_central": "descripción de la mecánica principal en 1-2 oraciones claras",
  "objetivo": "qué debe hacer el jugador para ganar o progresar",
  "controles": "descripción de controles (teclado/mouse/táctil)",
  "estetica": "descripción de la estética visual, paleta de 3-4 colores específicos (ej: negro, blanco, rojo vivo, gris)"
}

El juego debe ser realizable en vanilla JS con Canvas o DOM puro, en ~150-250 líneas de HTML.`;

const CODE_SYSTEM = `Eres un experto desarrollador de juegos de navegador con vanilla JS.

Dado un diseño de juego, genera el código HTML/CSS/JS completo y 100% funcional.

REGLAS ABSOLUTAS:
- Responde SOLO con el HTML (<!DOCTYPE html>...). Cero texto fuera del HTML.
- El juego debe funcionar inmediatamente al cargarse en un iframe con sandbox="allow-scripts"
- Usa Canvas API para juegos de acción/arcade/plataformas
- Usa DOM puro para puzzles/cartas/estrategia por turnos
- NO uses fetch, localStorage, cookies ni APIs externas (el sandbox los bloquea)
- Controles bien definidos, feedback visual inmediato, condición clara de victoria/derrota/gameover
- Paleta limitada a 3-4 colores, estética limpia y legible
- El código debe estar COMPLETO: game loop, detección de colisiones, puntuación, pantalla de inicio, pantalla de fin
- Tamaño del canvas/viewport: 480x480 o 600x400 para mejor compatibilidad`;

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
    const ip = getIp(request);
    const rateLimit = await checkRateLimit(ip, 'gamegen', 5, 60);
    if (!rateLimit.success) {
        return Response.json(
            { error: 'Máximo 5 juegos por minuto. Esperá un momento.' },
            { status: 429, headers: CORS_HEADERS }
        );
    }

    let triggers: string[], genre: string;
    try {
        const body = await request.json();
        triggers = (body.triggers as string[])?.filter((t: string) => t?.trim());
        genre = body.genre || '';
        if (!triggers?.length) {
            return Response.json(
                { error: 'Se requiere al menos un disparador.' },
                { status: 400, headers: CORS_HEADERS }
            );
        }
    } catch {
        return Response.json({ error: 'JSON inválido.' }, { status: 400, headers: CORS_HEADERS });
    }

    const userPrompt = `Elementos/disparadores: ${triggers.join(', ')}${genre ? `\nGénero sugerido: ${genre}` : ''}`;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                // ── FASE 01: ANÁLISIS / PLANIFICACIÓN ──────────────────────────
                send({ type: 'status', phase: 'plan', msg: 'Analizando disparadores...' });

                const planRes = await deepseek.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: PLAN_SYSTEM },
                        { role: 'user', content: userPrompt },
                    ],
                    max_tokens: 600,
                    temperature: 0.85,
                });

                const planRaw = planRes.choices[0].message.content || '{}';
                let plan: Record<string, string>;
                try {
                    const cleaned = planRaw.replace(/^```(?:json)?\n?|```$/gm, '').trim();
                    plan = JSON.parse(cleaned);
                } catch {
                    plan = { titulo: 'Juego generado', mecanica_central: planRaw };
                }

                send({ type: 'plan', content: plan });

                // ── FASE 02: SÍNTESIS / GENERACIÓN DE CÓDIGO ───────────────────
                send({ type: 'status', phase: 'code', msg: 'Compilando código del juego...' });

                const codeStream = await deepseek.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: CODE_SYSTEM },
                        {
                            role: 'user',
                            content: `Diseño del juego:\n${JSON.stringify(plan, null, 2)}\n\nGenera el HTML completo y funcional.`,
                        },
                    ],
                    max_tokens: 4096,
                    temperature: 0.25,
                    stream: true,
                });

                for await (const chunk of codeStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) send({ type: 'code', content });
                }

                send({ type: 'done' });
            } catch (err) {
                logger.error('gamegen pipeline error:', err);
                send({ type: 'error', msg: err instanceof Error ? err.message : 'Error interno del servidor.' });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
