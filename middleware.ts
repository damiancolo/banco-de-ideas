import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

/**
 * ============================================================
 * Middleware: Capa Invisible para Agentes de IA + Visitor Tracking
 * ============================================================
 *
 * Este middleware:
 * 1. Clasifica: persona, rastreador de IA, otro bot (buscadores, curl, previews…)
 * 2. Envía datos de visita a /api/track (MongoDB) via fire-and-forget
 * 3. Añade headers HTTP para agentes de IA
 * 4. Content negotiation para agentes que piden JSON
 *
 * Nota: Edge Runtime — no puede usar Mongoose directamente,
 * por eso envía POST a /api/track que corre en Node.js.
 * ============================================================
 */

// ─── AI Bot patterns ───
const AI_BOTS: Record<string, string> = {
    'GPTBot': 'OpenAI (ChatGPT)',
    'ChatGPT-User': 'ChatGPT User Browse',
    'OAI-SearchBot': 'OpenAI SearchBot',
    'ClaudeBot': 'Anthropic (Claude)',
    'Claude-Web': 'Claude Web',
    'anthropic-ai': 'Anthropic AI',
    'Google-Extended': 'Google AI (Gemini)',
    'PerplexityBot': 'Perplexity AI',
    'cohere-ai': 'Cohere AI',
    'meta-externalagent': 'Meta AI',
    'Bytespider': 'ByteDance AI',
    'YouBot': 'You.com AI',
    'DeepSeekBot': 'DeepSeek AI',
    'Applebot-Extended': 'Apple (Siri)',
    // Invitados en robots.txt pero sin detectar hasta ago 2026: sus visitas se
    // contaban como humanas y ensuciaban las cifras del tracker.
    'Claude-SearchBot': 'Anthropic (Claude Search)',
    'CCBot': 'Common Crawl',
};

// Otros bots: buscadores, herramientas de línea de comandos, previews de enlaces,
// monitores y navegadores sin interfaz. Se comparan en minúsculas; 'bot', 'crawler'
// y 'spider' son genéricos a propósito. Un user-agent vacío también es otro bot.
const OTHER_BOTS = [
    'Googlebot', 'bingbot', 'YandexBot', 'DuckDuckBot', 'Baiduspider', 'AhrefsBot', 'SemrushBot', 'MJ12bot',
    'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'Slackbot', 'WhatsApp', 'TelegramBot', 'Discordbot',
    'curl', 'wget', 'python-requests', 'axios', 'node-fetch', 'Go-http-client', 'HeadlessChrome', 'Lighthouse',
    'UptimeRobot', 'vercel-screenshot', 'bot', 'crawler', 'spider',
].map((p) => p.toLowerCase());

function isOtherBot(ua: string): boolean {
    if (!ua.trim()) return true;
    const lower = ua.toLowerCase();
    return OTHER_BOTS.some((p) => lower.includes(p));
}

function detectAiBot(ua: string): { pattern: string; name: string } | null {
    for (const [pattern, name] of Object.entries(AI_BOTS)) {
        if (ua.toLowerCase().includes(pattern.toLowerCase())) {
            return { pattern, name };
        }
    }
    return null;
}

// ─── Browser detection ───
function detectBrowser(ua: string): string | null {
    const lower = ua.toLowerCase();
    if (lower.includes('edg/') || lower.includes('edge/')) return 'Edge';
    if (lower.includes('opr/') || lower.includes('opera')) return 'Opera';
    if (lower.includes('chrome') && !lower.includes('edg')) return 'Chrome';
    if (lower.includes('firefox')) return 'Firefox';
    if (lower.includes('safari') && !lower.includes('chrome')) return 'Safari';
    return null;
}

// ─── Device type detection ───
function detectDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
    const lower = ua.toLowerCase();
    if (/tablet|ipad|playbook|silk/.test(lower)) return 'tablet';
    if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(lower)) return 'mobile';
    return 'desktop';
}

// ─── Should track this path? ───
function shouldTrack(path: string): boolean {
    if (path.startsWith('/api/')) return false;
    if (path.startsWith('/_next/')) return false;
    if (path === '/tracker') return false; // don't track the dashboard itself
    if (path.includes('.')) return false; // static files
    return true;
}

// Navegación interna de Next.js (RSC y prefetch): no es una visita.
function isInternalNavigation(request: NextRequest): boolean {
    const h = request.headers;
    return (
        h.get('rsc') === '1' ||
        h.has('next-router-prefetch') ||
        [h.get('sec-purpose'), h.get('purpose'), h.get('sec-fetch-purpose')].some((v) =>
            (v || '').toLowerCase().includes('prefetch')
        )
    );
}

const TZ = 'Europe/Madrid';
const NO_TRACK_COOKIE = 'bdi_no_track';

/**
 * Identificador de visitante sin cookies: SHA-256 de IP + user-agent + fecha
 * (Madrid) + TRACK_SECRET, a 16 hex. Rota cada día y no permite identificar a
 * nadie; la IP no se guarda.
 */
async function visitorIdOf(request: NextRequest, userAgent: string): Promise<string> {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || '';
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
    const data = new TextEncoder().encode(`${ip}|${userAgent}|${day}|${process.env.TRACK_SECRET || ''}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 16);
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
    const response = NextResponse.next();
    const userAgent = request.headers.get('user-agent') || '';
    const path = request.nextUrl.pathname;

    // ─── Excluirse del conteo: /tracker?no-contarme=1 (0 lo quita) ───
    const noContarme = request.nextUrl.searchParams.get('no-contarme');
    if (path === '/tracker' && noContarme === '1') {
        response.cookies.set(NO_TRACK_COOKIE, '1', { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' });
    } else if (path === '/tracker' && noContarme === '0') {
        response.cookies.delete(NO_TRACK_COOKIE);
    }

    // ─── Clasificación del visitante ───
    const aiBot = detectAiBot(userAgent);
    const visitorType = aiBot ? 'ai_crawler' : isOtherBot(userAgent) ? 'other_bot' : 'human';

    // ─── Visit Tracking (MongoDB via /api/track) ───
    const excluido = request.cookies.get(NO_TRACK_COOKIE)?.value === '1' || noContarme === '1';

    if (shouldTrack(path) && !isInternalNavigation(request) && !excluido) {
        const country = request.headers.get('x-vercel-ip-country') || null;
        const referrer = request.headers.get('referer') || null;
        const isHuman = visitorType === 'human';
        const origin = request.nextUrl.origin;

        // waitUntil: la petición de seguimiento no se corta al responder.
        event.waitUntil(
            (async () => {
                try {
                    await fetch(`${origin}/api/track`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            secret: process.env.TRACK_SECRET || '',
                            path,
                            visitorType,
                            botName: aiBot?.name || null,
                            browser: isHuman ? detectBrowser(userAgent) : null,
                            deviceType: isHuman ? detectDeviceType(userAgent) : 'desktop',
                            country,
                            referrer,
                            site: 'unbancodeideas',
                            visitorId: await visitorIdOf(request, userAgent),
                            userAgent: userAgent.slice(0, 200),
                        }),
                    });
                } catch {}
            })()
        );
    }

    // ─── Headers invisibles para agentes de IA ───
    response.headers.set('X-AI-Agent-API', '/api/agent');
    response.headers.set('X-AI-Capabilities', 'read,write,search');
    response.headers.set('X-AI-Docs', '/llms.txt');
    // El servidor MCP habla por stdio (npm: banco-de-ideas-mcp), no por HTTP.
    // Apuntamos al manifiesto, que es lo unico que existe de verdad.
    response.headers.set('X-AI-MCP', '/.well-known/mcp.json');
    response.headers.set('X-AI-Plugin', '/.well-known/ai-plugin.json');

    // ─── Content Negotiation ───
    const accept = request.headers.get('accept') || '';
    const isJsonRequest = accept.includes('application/json') && !accept.includes('text/html');

    if (isJsonRequest && (path === '/' || path === '/banco')) {
        const agentUrl = new URL('/api/agent?action=list', request.url);
        if (path === '/banco') {
            agentUrl.searchParams.set('category', 'all');
        }
        return NextResponse.redirect(agentUrl);
    }

    // ─── CORS para la API de agentes ───
    if (path.startsWith('/api/agent')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return response;
}

/**
 * Matcher: aplica a todas las rutas excepto archivos estáticos
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - archivos estáticos con extensión
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
};
