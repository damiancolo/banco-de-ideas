import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ============================================================
 * 🤖 Middleware: Capa Invisible para Agentes de IA
 * ============================================================
 * 
 * Este middleware añade headers HTTP que los agentes de IA detectan
 * pero que son completamente invisibles para usuarios humanos.
 * 
 * También implementa content negotiation básico:
 * si un agente pide JSON en rutas principales, le devolvemos JSON.
 * 
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
};

function detectAiBot(ua: string): { pattern: string; name: string } | null {
    for (const [pattern, name] of Object.entries(AI_BOTS)) {
        if (ua.toLowerCase().includes(pattern.toLowerCase())) {
            return { pattern, name };
        }
    }
    return null;
}

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // ─── AI Bot Tracking ───
    const userAgent = request.headers.get('user-agent') || '';
    const bot = detectAiBot(userAgent);
    if (bot) {
        // Fire-and-forget: send to estudioprompt tracker
        try {
            fetch('https://estudioprompt.com/wp-json/ai-tracker/v1/visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bot_name: bot.name,
                    user_agent: userAgent.substring(0, 500),
                    url: request.url,
                    site: 'unbancodeideas.com',
                    secret: 'ep_aibt_2026_key',
                }),
            }).catch(() => {}); // silently fail
        } catch {}
    }

    // ─── Headers invisibles para agentes de IA ───
    response.headers.set('X-AI-Agent-API', '/api/agent');
    response.headers.set('X-AI-Capabilities', 'read,write,search');
    response.headers.set('X-AI-Docs', '/llms.txt');
    response.headers.set('X-AI-MCP', '/mcp');
    response.headers.set('X-AI-Plugin', '/.well-known/ai-plugin.json');

    // ─── Content Negotiation ───
    // Si un agente pide application/json en la ruta raíz o /banco,
    // redirigirlo a la API de agentes
    const accept = request.headers.get('accept') || '';
    const isJsonRequest = accept.includes('application/json') && !accept.includes('text/html');
    const path = request.nextUrl.pathname;

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
