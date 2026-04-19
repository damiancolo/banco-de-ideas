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

// ── Templates (Steven Straker — MIT license) ────────────────────────────
// https://github.com/straker — minimal canvas games, educational, open source
const TEMPLATES: Record<string, { url: string; genre: string; description: string }> = {
    snake: {
        url: 'https://gist.githubusercontent.com/straker/ff00b4b49669ad3dec890306d348adc4/raw/snake.html',
        genre: 'arcade',
        description: 'Snake that grows eating food, avoid walls and itself. Arrow keys.',
    },
    breakout: {
        url: 'https://gist.githubusercontent.com/straker/98a2aed6a7686d26c04810f08bfaf66b/raw/breakout.html',
        genre: 'arcade',
        description: 'Bounce a ball to break bricks. Mouse/keyboard paddle.',
    },
    pong: {
        url: 'https://gist.githubusercontent.com/straker/81b59eecf70da93af396f963596dfdc5/raw/pong.html',
        genre: 'arcade',
        description: 'Classic Pong: player vs AI, bounce ball back and forth.',
    },
    'doodle-jump': {
        url: 'https://gist.githubusercontent.com/straker/b96a4a68bd6d79cf75a833d98a2b654f/raw/doodle-jump.html',
        genre: 'platformer',
        description: 'Jump upward on platforms infinitely. Arrow keys. Score = height.',
    },
    helicopter: {
        url: 'https://gist.githubusercontent.com/straker/0d25ae9d235f6a62f8287fd36a097043/raw/helicopter.html',
        genre: 'endless',
        description: 'Fly helicopter through cave obstacles. Hold space/click to go up.',
    },
};

// Fase 1: R1 elige el template más apropiado y planifica los cambios
const DESIGN_SYSTEM = `You are a creative game customizer. Given 3 elements and a list of game templates, choose the best template and plan SPECIFIC changes to theme it around the elements.

Available templates:
${Object.entries(TEMPLATES).map(([k, v]) => `- ${k}: ${v.description}`).join('\n')}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "template": "<template name from list above>",
  "title": "<creative game title incorporating the elements>",
  "changes": [
    "<specific change 1: e.g. 'Replace snake color #00ff00 with #ff6b35'>",
    "<specific change 2: e.g. 'Rename food to [element]'>",
    "<specific change 3>",
    "<specific change 4>",
    "<specific change 5>"
  ]
}

CHANGE RULES:
- Max 6 changes. Be SPECIFIC (mention exact things to change, not vague instructions).
- Prefer: color changes, label/text changes, speed tweaks (+20% faster), rename objects.
- Avoid: structural changes, new game mechanics, adding new systems.
- The 3 elements must appear in the title and at least 2 changes.`;

// Fase 2: V3 aplica los cambios al template existente
const EDIT_SYSTEM = `You are a code editor. Your job is to apply a short list of changes to an existing HTML game file.

RULES:
1. Output ONLY the complete modified HTML. Start with <!DOCTYPE html>. Zero text outside.
2. Apply ALL the listed changes. Keep everything else IDENTICAL.
3. Add touch support if missing:
   - Tap/touchstart = spacebar or primary action
   - Touch left half of canvas = left arrow; right half = right arrow
   - Add: canvas.addEventListener('touchstart', e => { e.preventDefault(); ... }, {passive:false})
4. Make canvas responsive: add this after canvas is created:
   function resizeCanvas() { const s = Math.min(400, window.innerWidth - 16); canvas.width = s; canvas.height = s; }
   window.addEventListener('resize', resizeCanvas); resizeCanvas();
   (Only if canvas is square — for non-square games, resize only width proportionally)
5. Show the custom title on the start screen.
6. Keep the code compact. Do not add comments unless already present.`;

async function fetchTemplate(name: string): Promise<string> {
    const tmpl = TEMPLATES[name];
    if (!tmpl) throw new Error(`Template "${name}" not found.`);
    const res = await fetch(tmpl.url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Failed to fetch template "${name}": ${res.status}`);
    return await res.text();
}

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
                catch { /* cerrado */ }
            };

            try {
                // ── FASE 1: R1 elige template y planifica cambios ──────────────────
                send({ type: 'phase', phase: 'design' });

                const planRes = await deepseek.chat.completions.create({
                    model: 'deepseek-reasoner',
                    messages: [
                        { role: 'system', content: DESIGN_SYSTEM },
                        { role: 'user', content: `Elements: ${triggers.join(', ')}` },
                    ],
                    max_tokens: 500,
                });

                const raw = planRes.choices[0].message.content || '{}';
                let plan: { template: string; title: string; changes: string[] };
                try {
                    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                    plan = JSON.parse(cleaned);
                } catch {
                    plan = {
                        template: 'snake',
                        title: triggers.join(' & '),
                        changes: [`Rename "Snake" to "${triggers[0]}"`, `Change food color to orange`],
                    };
                }

                // Validar que el template existe
                if (!TEMPLATES[plan.template]) plan.template = 'snake';

                send({ type: 'plan', content: { title: plan.title, template: plan.template, changes: plan.changes } });

                // ── DESCARGA DEL TEMPLATE ──────────────────────────────────────────
                send({ type: 'phase', phase: 'fetch' });

                const templateCode = await fetchTemplate(plan.template);

                // ── FASE 2: V3 aplica los cambios en streaming ────────────────────
                send({ type: 'phase', phase: 'code' });

                const changesText = plan.changes.map((c, i) => `${i + 1}. ${c}`).join('\n');

                const codeStream = await deepseek.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: EDIT_SYSTEM },
                        {
                            role: 'user',
                            content: [
                                `Game title: "${plan.title}"`,
                                ``,
                                `Changes to apply:`,
                                changesText,
                                ``,
                                `Original game code:`,
                                `\`\`\`html`,
                                templateCode,
                                `\`\`\``,
                                ``,
                                `Output the complete modified HTML file.`,
                            ].join('\n'),
                        },
                    ],
                    max_tokens: 2800,
                    temperature: 0.15,
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
                send({ type: 'done' });
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
