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

// Fase 1: razonamiento — diseña el juego y devuelve un plan JSON pequeño
const DESIGN_SYSTEM = `You are a creative game designer. Given 3 elements, design a simple but fun browser game.

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "title": "short game title",
  "mechanic": "core mechanic in one sentence — how the 3 elements connect",
  "controls": "describe both keyboard AND touch controls",
  "winCondition": "how to win or progress",
  "style": "3-4 word visual style (e.g. 'dark neon arcade')"
}

Design for a square canvas that fits any screen. Mechanic must be achievable in ~130 lines of vanilla JS.
Prefer mechanics that work with a single tap/click (not complex keyboard combos) so they're fun on mobile.`;

// Fase 2: codificación — implementa el juego con soporte móvil completo
const CODE_SYSTEM = `You are an expert HTML5 game developer. Implement the given game design as a complete, playable HTML file.

STRICT OUTPUT RULES:
1. Output ONLY the HTML file. Start with <!DOCTYPE html>. Zero text outside it.
2. Works in iframe with sandbox="allow-scripts" — no fetch, no localStorage, no external URLs.
3. Vanilla JS + Canvas API only. No libraries.
4. Under 140 lines total. Compact but complete.

MOBILE-FIRST CANVAS (required):
- Size: const SIZE = Math.min(480, window.innerWidth - 16); canvas.width = SIZE; canvas.height = SIZE;
- Center canvas: canvas.style.display='block'; canvas.style.margin='auto';
- Resize on orientation change: window.addEventListener('resize', resizeCanvas);
- Body: margin:0; background:#111; overflow:hidden; display:flex; align-items:center; justify-content:center; min-height:100vh;

TOUCH + KEYBOARD CONTROLS (both required):
- Start screen: tap OR press SPACE to start
- Movement games: listen to touchstart/touchmove/touchend on canvas; map touch X/Y to game direction
- Tap games: touchstart = same as click
- Show on-screen hint: "TAP" on mobile, "SPACE/CLICK" on desktop (detect via navigator.maxTouchPoints)
- Touch handler example: canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInput(e.touches[0]); }, {passive:false});

GAME COMPLETENESS:
- Start screen with title + controls hint
- requestAnimationFrame game loop
- Score or progress display (large, readable on small screens)
- Game over screen + restart on tap/click/SPACE
- Max 3 colors. Minimum font size 16px for any text.`;

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
                catch { /* controller ya cerrado */ }
            };

            try {
                // ── FASE 1: DISEÑO (razonamiento) ─────────────────────────────────
                send({ type: 'phase', phase: 'design' });

                const planRes = await deepseek.chat.completions.create({
                    model: 'deepseek-reasoner',
                    messages: [
                        { role: 'system', content: DESIGN_SYSTEM },
                        { role: 'user', content: `Elements: ${triggers.join(', ')}` },
                    ],
                    max_tokens: 400,
                });

                const raw = planRes.choices[0].message.content || '{}';
                let plan: Record<string, string>;
                try {
                    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                    plan = JSON.parse(cleaned);
                } catch {
                    plan = {
                        title: triggers.join(' & '),
                        mechanic: `Game combining ${triggers.join(', ')}`,
                        controls: 'Tap or click to play',
                        winCondition: 'Survive as long as possible',
                        style: 'dark minimal',
                    };
                }

                send({ type: 'plan', content: plan });

                // ── FASE 2: CÓDIGO (streaming) ────────────────────────────────────
                send({ type: 'phase', phase: 'code' });

                const codeStream = await deepseek.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: CODE_SYSTEM },
                        {
                            role: 'user',
                            content: [
                                `Game design:`,
                                `Title: ${plan.title}`,
                                `Mechanic: ${plan.mechanic}`,
                                `Controls: ${plan.controls}`,
                                `Win: ${plan.winCondition}`,
                                `Style: ${plan.style || 'dark minimal'}`,
                                ``,
                                `Write the complete HTML file now.`,
                            ].join('\n'),
                        },
                    ],
                    max_tokens: 2600,
                    temperature: 0.2,
                    stream: true,
                });

                for await (const chunk of codeStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) send({ type: 'code', content });
                    if (chunk.choices[0]?.finish_reason) send({ type: 'done' });
                }

                send({ type: 'done' }); // red de seguridad

            } catch (err) {
                logger.error('gamegen error:', err);
                send({ type: 'done' }); // el cliente finaliza con lo que tenga
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
