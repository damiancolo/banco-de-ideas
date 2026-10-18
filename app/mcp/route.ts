import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { crearServidorMcp } from '@/lib/mcp/server';
import { logger } from '@/lib/logger';

/**
 * ============================================================
 * 🤖 Servidor MCP por HTTP — /mcp
 * ============================================================
 *
 * Transporte Streamable HTTP, sin sesión: cada POST crea su servidor y su
 * transporte, responde en JSON y se cierra. En Vercel cada petición puede caer
 * en una instancia distinta, así que no hay nada que valga la pena recordar.
 *
 * El paquete npm `banco-de-ideas-mcp` (stdio) sigue existiendo para clientes
 * que no hablan HTTP remoto.
 * ============================================================
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Versión del protocolo del Banco, no del paquete npm.
const VERSION = '1.1.0';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
};

function conCors(response: Response): Response {
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function POST(request: Request) {
    const server = crearServidorMcp(request, VERSION);
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
    });

    try {
        await server.connect(transport);
        return conCors(await transport.handleRequest(request));
    } catch (error) {
        logger.error('MCP /mcp error:', error);
        return conCors(
            Response.json(
                { jsonrpc: '2.0', error: { code: -32603, message: 'Error interno' }, id: null },
                { status: 500 }
            )
        );
    } finally {
        // Con respuesta JSON la respuesta ya está completa: se puede cerrar.
        await transport.close().catch(() => {});
        await server.close().catch(() => {});
    }
}

// Sin sesión no hay stream de notificaciones (GET) ni sesión que cerrar (DELETE).
function noPermitido() {
    return conCors(
        Response.json(
            { jsonrpc: '2.0', error: { code: -32000, message: 'Método no permitido: este servidor MCP no usa sesiones. Usá POST.' }, id: null },
            { status: 405, headers: { Allow: 'POST, OPTIONS' } }
        )
    );
}

export const GET = noPermitido;
export const DELETE = noPermitido;

export function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}
