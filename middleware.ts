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

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

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
