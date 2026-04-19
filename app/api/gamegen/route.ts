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

// ── R1: diseña el juego con razonamiento ────────────────────────────────
// deepseek-reasoner (R1) piensa antes de responder.
// Le pedimos un plan JSON pequeño — la respuesta llega en ~8-12s.
const R1_SYSTEM = `You are a creative game designer. Given 3 elements, design a simple but fun browser game.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "title": "short game title",
  "mechanic": "core mechanic in one sentence — how elements connect",
  "controls": "keyboard/mouse controls in one line",
  "winCondition": "how to win or progress",
  "style": "3-4 word visual style (e.g. 'dark pixel sci-fi')"
}

Design for Canvas 480×480. Keep the mechanic achievable in ~120 lines of vanilla JS.`;

// ── V3: codea el juego diseñado por R1 ─────────────────────────────────
// deepseek-chat (V3) es el mejor modelo costo/calidad para código.
// Recibe el plan de R1 → genera HTML completo en streaming.
const V3_SYSTEM = `You are an expert HTML5 game developer using vanilla JS and Canvas API.

Implement the game design below as a COMPLETE, PLAYABLE HTML file.

STRICT RULES — follow all of them:
1. Output ONLY the HTML file. Start with <!DOCTYPE html>. Zero text outside it.
2. Canvas 480×480, centered on page, dark background.
3. Vanilla JS only. No libraries. No fetch. No localStorage. No external URLs.
4. Works in iframe sandbox="allow-scripts".
5. Under 130 lines total. Compact code.
6. Must include: start screen (SPACE/click), requestAnimationFrame game loop, score display, game over screen with restart.
7. Max 3 colors. Clean, readable visuals. Show controls on screen.`;

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
                // ══ FASE 1: R1 DISEÑA ══════════════════════════════════════════════
                send({ type: 'phase', phase: 'design', msg: 'R1 diseñando el juego...' });

                const planRes = await deepseek.chat.completions.create({
                    model: 'deepseek-reasoner',
                    messages: [
                        { role: 'system', content: R1_SYSTEM },
                        { role: 'user', content: `Elements: ${triggers.join(', ')}` },
                    ],
                    max_tokens: 400,
                    // R1 no tiene temperature — usa su propio razonamiento
                });

                const raw = planRes.choices[0].message.content || '{}';
                let plan: Record<string, string>;
                try {
                    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                    plan = JSON.parse(cleaned);
                } catch {
                    // Si R1 no devolvió JSON válido, construimos un plan mínimo
                    plan = {
                        title: triggers.join(' & '),
                        mechanic: `Juego con ${triggers.join(', ')}`,
                        controls: 'Flechas o WASD para mover, SPACE para acción',
                        winCondition: 'Sobrevivir el mayor tiempo posible',
                        style: 'dark minimal pixel',
                    };
                }

                send({ type: 'plan', content: plan });

                // ══ FASE 2: V3 CODEA ═══════════════════════════════════════════════
                send({ type: 'phase', phase: 'code', msg: 'V3 compilando el código...' });

                const codeStream = await deepseek.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: V3_SYSTEM },
                        {
                            role: 'user',
                            content: `Game design:\nTitle: ${plan.title}\nMechanic: ${plan.mechanic}\nControls: ${plan.controls}\nWin: ${plan.winCondition}\nStyle: ${plan.style || 'dark minimal'}\n\nWrite the complete HTML.`,
                        },
                    ],
                    max_tokens: 2400,
                    temperature: 0.25,
                    stream: true,
                });

                for await (const chunk of codeStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) send({ type: 'code', content });

                    if (chunk.choices[0]?.finish_reason) {
                        send({ type: 'done' });
                    }
                }

                // Red de seguridad: done al final del loop
                send({ type: 'done' });

            } catch (err) {
                logger.error('gamegen error:', err);
                // done de todas formas para que el cliente no quede colgado
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
