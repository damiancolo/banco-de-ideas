import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ============================================================
 * Middleware: Capa Invisible para Agentes de IA + Visitor Tracking
 * ============================================================
 *
 * Este middleware:
 * 1. Detecta bots de IA y humanos
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

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const userAgent = request.headers.get('user-agent') || '';
    const path = request.nextUrl.pathname;

    // ─── AI Bot Detection ───
    const bot = detectAiBot(userAgent);

    // ─── Visit Tracking (MongoDB via /api/track) ───
    const purpose = request.headers.get('purpose') || request.headers.get('sec-fetch-purpose') || '';
    const isPrefetch = purpose === 'prefetch';

    if (shouldTrack(path) && !isPrefetch) {
        const country = request.headers.get('x-vercel-ip-country') || null;
        const referrer = request.headers.get('referer') || null;

        try {
            const origin = request.nextUrl.origin;
            fetch(`${origin}/api/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: process.env.TRACK_SECRET || '',
                    path,
                    visitorType: bot ? 'bot' : 'human',
                    botName: bot?.name || null,
                    browser: bot ? null : detectBrowser(userAgent),
                    deviceType: bot ? 'desktop' : detectDeviceType(userAgent),
                    country,
                    referrer,
                    site: 'unbancodeideas',
                }),
            }).catch(() => {});
        } catch {}
    }

    // ─── Headers invisibles para agentes de IA ───
    response.headers.set('X-AI-Agent-API', '/api/agent');
    response.headers.set('X-AI-Capabilities', 'read,write,search');
    response.headers.set('X-AI-Docs', '/llms.txt');
    response.headers.set('X-AI-MCP', '/mcp');
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
