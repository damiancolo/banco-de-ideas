import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: 'https://api.deepseek.com',
});

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://estudioprompt.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Prompt diseñado para generar juegos CORTOS y COMPLETOS en una sola pasada.
// Límite de 150 líneas → ~1800 tokens → termina en ~25-35s.
const SYSTEM = `You are an expert browser game developer. Create a complete, playable HTML5 game.

OUTPUT RULES (strict):
- Output ONLY the HTML file. Start with <!DOCTYPE html>. Nothing before or after it.
- The game must work inside an iframe with sandbox="allow-scripts" (no fetch, no localStorage, no external URLs)
- Use Canvas API (480×480px, centered). Black or dark background.
- Vanilla JS only. No libraries.

GAME RULES:
- Under 150 lines of code total. Compact but complete.
- Must have: start screen (press SPACE or click), game loop (requestAnimationFrame), score, game over + restart
- 3 colors maximum
- Show controls on screen
- Pick the SIMPLEST mechanic that connects all elements. Don't overcomplicate it.

Think of the mechanic first (one sentence in a JS comment at the top), then write the code.`;

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

    let triggers: string[];
    try {
        const body = await request.json();
        triggers = (body.triggers as string[])?.filter((t: string) => t?.trim());
        if (!triggers?.length) {
            return Response.json({ error: 'Se requiere al menos un elemento.' }, { status: 400, headers: CORS_HEADERS });
        }
    } catch {
        return Response.json({ error: 'JSON inválido.' }, { status: 400, headers: CORS_HEADERS });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch { /* controller ya cerrado */ }
            };

            try {
                const gameStream = await deepseek.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: SYSTEM },
                        { role: 'user', content: `Game elements: ${triggers.join(', ')}` },
                    ],
                    max_tokens: 2200,
                    temperature: 0.4,
                    stream: true,
                });

                for await (const chunk of gameStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) send({ type: 'code', content });

                    // Si el modelo terminó (finish_reason presente), mandamos done
                    if (chunk.choices[0]?.finish_reason) {
                        send({ type: 'done' });
                    }
                }

                // Segunda red de seguridad: done al final del for await
                send({ type: 'done' });

            } catch (err) {
                logger.error('gamegen error:', err);
                // Mandamos done de todas formas para que el cliente finalice con lo que tenga
                send({ type: 'done' });
                send({ type: 'error', msg: err instanceof Error ? err.message : 'Error interno.' });
            } finally {
                try { controller.close(); } catch { /* ya cerrado */ }
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
