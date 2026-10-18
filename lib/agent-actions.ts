/**
 * Piezas compartidas por las dos puertas de los agentes: la API REST
 * (/api/agent) y el servidor MCP por HTTP (/mcp). Validan la entrada y arman el
 * texto que se guarda, para que una idea publicada por cualquiera de las dos
 * quede igual en el banco.
 */

import { recordVisit } from '@/lib/visits';
import { logger } from '@/lib/logger';

export const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Tags: lista de textos, o nada. Cualquier otra cosa se ignora. */
export function limpiarTags(tags: unknown): string[] {
    return Array.isArray(tags) ? tags.filter(esTexto).map((t) => t.trim()) : [];
}

/** agent_name: texto corto, o el valor por defecto. */
export function firmaAgente(agentName: unknown, porDefecto = 'agente-ia'): string {
    return esTexto(agentName) ? agentName.trim().slice(0, 100) : porDefecto;
}

/** Mismo tope que una idea humana. */
export const MAX_TEXTO_AGENTE = 1500;

export function textoBisociacion(conceptA: string, conceptB: string, insight: string, tags: string[], firma: string): string {
    return `[Bisociación: ${conceptA} × ${conceptB}] ${insight}${
        tags.length ? ` | Tags: ${tags.join(', ')}` : ''
    } | Publicado por: ${firma}`;
}

export function textoIdea(text: string, tags: string[], firma: string): string {
    return `${text}${tags.length ? ` | Tags: ${tags.join(', ')}` : ''} | Por: ${firma}`;
}

export function textoComentario(text: string, firma: string): string {
    return `${text} | Por: ${firma}`;
}

/**
 * Registra una llamada de agente en `visits`, directo a la base (sin fetch al propio
 * sitio). botName = agent_name si existe; si no, el user-agent
 * (banco-de-ideas-mcp/… para el MCP por stdio). Nunca lanza.
 */
export async function registrarLlamadaAgente(request: Request, path: string, agentName?: unknown): Promise<void> {
    try {
        const userAgent = request.headers.get('user-agent') || '';
        const name = esTexto(agentName) ? agentName.trim() : userAgent;
        await recordVisit({
            path,
            visitorType: 'agent',
            botName: (name || 'desconocido').slice(0, 100),
            country: request.headers.get('x-vercel-ip-country'),
            site: 'unbancodeideas',
            userAgent,
        });
    } catch (error) {
        logger.error('No se pudo registrar la llamada de agente:', error);
    }
}
