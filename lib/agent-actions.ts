/**
 * Piezas compartidas por las dos puertas de los agentes: la API REST
 * (/api/agent) y el servidor MCP por HTTP (/mcp). Validan la entrada y arman el
 * texto que se guarda, para que una idea publicada por cualquiera de las dos
 * quede igual en el banco.
 */

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

/**
 * Patrones de las pruebas de ataque que mandan los escáneres automáticos.
 * Nada de esto se ejecuta en el banco (las ideas se guardan como texto), pero
 * el 12 nov 2026 un escáner publicó ~40 en tres minutos y quedaron visibles en
 * el banco público y en el mail. Se rechazan antes de guardar.
 */
const PATRONES_ATAQUE: RegExp[] = [
    // Comandos de shell, sólo tras un separador (; | & `): «Sleep tracking
    // para plantas» o «Echo de menos el mar» son ideas, no ataques.
    /[;|&`]\s*(curl|wget|sleep|echo|touch|whoami|nc|bash|sh)\b/i,
    /\$\(\(?|`[^`]*`/,                       // sustitución de comandos
    /-oProxyCommand/i,                       // inyección en ssh
    /\{\{.*\}\}|\$\{.*\}/,                   // inyección de plantillas
    /__import__|\beval\s*\(|\bexec\s*\(/i,   // código Python/JS
    /(\.\.\/){2,}|\/etc\/passwd|\/tmp\//i,   // recorrido de rutas
    /169\.254\.169\.254|metadata\.google/i,  // metadatos de la nube (SSRF)
    /\boob:\d+|\binteractsh|\bburpcollaborator/i, // callbacks fuera de banda
    /<script\b|javascript:/i,                // XSS
    /shadow_tool|"inputSchema"\s*:/i,        // definiciones de herramientas MCP inyectadas
];

/** true si el texto parece una prueba de ataque y no una idea. */
export function pareceAtaque(...textos: unknown[]): boolean {
    return textos.some((t) => typeof t === 'string' && PATRONES_ATAQUE.some((p) => p.test(t)));
}

export const MENSAJE_RECHAZO =
    'Contenido rechazado: parece una prueba de seguridad, no una idea. El banco guarda ideas en texto plano.';

/**
 * Cupo de escritura de los agentes (publicar y comentar), además del límite por
 * minuto general: 5 por minuto y 20 por hora por IP. Lo comparten la API REST y
 * el MCP por HTTP.
 */
export async function dentroDelCupoDeEscritura(ip: string): Promise<boolean> {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    const minuto = await checkRateLimit(ip, 'agent-escritura-min', 5, 60);
    if (!minuto.success) return false;
    const hora = await checkRateLimit(ip, 'agent-escritura-hora', 20, 3600);
    return hora.success;
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
        // Import perezoso: este archivo lo carga /mcp también para peticiones que
        // no tocan la base, y lib/visits arrastra Mongoose.
        const { recordVisit } = await import('@/lib/visits');
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
