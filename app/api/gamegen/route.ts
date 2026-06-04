import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

export const maxDuration = 300;

// ── Modelo ────────────────────────────────────────────────────────────────
// Cambiar aquí cuando haya un modelo mejor/más barato disponible
const MODEL = 'deepseek-v4-pro';

const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: 'https://api.deepseek.com',
});

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://estudioprompt.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Prompt del sistema ────────────────────────────────────────────────────
const SYSTEM = `You are an expert HTML5 game developer. Create a complete, original, playable browser game themed around the given elements.

OUTPUT RULES:
- Output ONLY valid HTML. Start with <!DOCTYPE html>. Absolutely nothing outside the HTML.
- No markdown fences, no explanation, no comments before or after the code.

GAME DESIGN:
- Choose the game type that best fits the theme: snake, breakout, pong, platformer, or endless runner.
- Everything must reflect the 3 elements: player, objects, enemies, background color, text, speed, atmosphere.
- The player should immediately feel the theme without reading anything — through color, movement, and naming.

TECHNICAL REQUIREMENTS (all mandatory):
1. Canvas 2D API + vanilla JS. No external libraries.
2. requestAnimationFrame game loop.
3. START SCREEN: fill canvas with themed background color. Draw game title (large, bold, themed color) centered. Draw a short tagline below. Draw "Toca o pulsa tecla para empezar" at bottom. Wait for keydown or touchstart before starting the loop.
4. SCORE: var score=0. Increment on relevant game event (eating, breaking, bouncing, jumping). Draw on canvas every frame: context.fillStyle='rgba(255,255,255,0.8)'; context.font='bold 14px monospace'; context.fillText('score: '+score, 8, 22).
5. GAME OVER: when player dies/loses, draw a full-canvas overlay with thematic message, final score, and "Toca o pulsa tecla para reintentar". Reset on next keydown/touchstart.
6. TOUCH SUPPORT:
   canvas.addEventListener('touchstart', e => { e.preventDefault(); /* primary action */ }, {passive:false});
   canvas.addEventListener('touchmove', e => { e.preventDefault(); }, {passive:false});
   Left half of canvas touch = left arrow. Right half = right arrow.
7. RESPONSIVE CANVAS: after canvas creation:
   function resize() { var s = Math.min(480, window.innerWidth - 8); canvas.width = s; canvas.height = s; }
   window.addEventListener('resize', resize); resize();
   (for non-square games adjust height proportionally)
8. Compact code: no blank lines between functions, no inline comments.

QUALITY BAR: If the elements are "fuego, agua, viento" the game must feel like fire navigating wind through water — not just a snake with orange color. Make it feel custom-made.`;

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
                try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); }
                catch { /* closed */ }
            };

            try {
                send({ type: 'phase', phase: 'code' });

                const gameStream = await client.chat.completions.create({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: SYSTEM },
                        { role: 'user', content: `Create a game themed around these 3 elements: ${triggers.join(', ')}` },
                    ],
                    max_tokens: 4000,
                    temperature: 0.8,
                    stream: true,
                });

                for await (const chunk of gameStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) send({ type: 'code', content });
                    if (chunk.choices[0]?.finish_reason) send({ type: 'done' });
                }

                send({ type: 'done' });

            } catch (err) {
                logger.error('gamegen error:', err);
                send({ type: 'done' });
            } finally {
                try { controller.close(); } catch { /* already closed */ }
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
