import { after } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
    getIdeas,
    countPublicIdeas,
    getPublicIdeaById,
    getPublicIdeaStats,
    addComment,
    saveIdea,
    searchIdeasByKeywords,
} from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { notifyAdminNewIdea, notifyAdminAgentComment } from '@/lib/notifications/notifyAdminNewIdea';
import {
    esTexto,
    limpiarTags,
    MAX_TEXTO_AGENTE,
    textoBisociacion,
    textoIdea,
    textoComentario,
    registrarLlamadaAgente,
} from '@/lib/agent-actions';

/**
 * Servidor MCP del Banco de Ideas para el transporte HTTP (/mcp).
 *
 * Mismas herramientas, nombres y descripciones que el paquete npm
 * `banco-de-ideas-mcp` (stdio): están publicadas en el registro MCP y quien ya
 * las tiene configuradas no debe notar diferencia. La diferencia es que acá se
 * llama directo a lib/db, sin pasar por /api/agent.
 *
 * Se crea uno por petición: en Vercel no hay estado entre llamadas.
 */

// Firma de lo que se publica por esta puerta (el stdio firma 'mcp-agent').
const FIRMA = 'mcp-http';

const SOLO_LECTURA = { readOnlyHint: true, openWorldHint: true };
const ESCRITURA = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };

type Resultado = { isError?: boolean; content: Array<{ type: 'text'; text: string }> };

const ok = (data: unknown): Resultado => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const fallo = (mensaje: string): Resultado => ({ isError: true, content: [{ type: 'text', text: mensaje }] });

export function crearServidorMcp(request: Request, version: string): McpServer {
    const ip = getIp(request);

    // Límite por herramienta, no por petición: una petición MCP puede traer varias
    // llamadas. Escritura y búsqueda comparten el cupo de /api/agent (20/min).
    async function dentroDelLimite(tipo: 'escritura' | 'lectura'): Promise<boolean> {
        const { success } =
            tipo === 'escritura'
                ? await checkRateLimit(ip, 'agent-api', 20, 60)
                : await checkRateLimit(ip, 'mcp-lectura', 60, 60);
        return success;
    }

    // Registra la llamada y la frena si se pasó del límite. Nunca lanza: un
    // error de la base vuelve como isError para que el agente lo vea.
    function herramienta<A>(nombre: string, tipo: 'escritura' | 'lectura', handler: (args: A) => Promise<Resultado>) {
        return async (args: A): Promise<Resultado> => {
            after(() => registrarLlamadaAgente(request, `/mcp:${nombre}`));
            try {
                if (!(await dentroDelLimite(tipo))) {
                    return fallo('Límite de uso alcanzado (429). Esperá un minuto antes de volver a intentar.');
                }
                return await handler(args);
            } catch {
                return fallo('Error interno del Banco de Ideas.');
            }
        };
    }

    const server = new McpServer({
        name: 'banco-de-ideas',
        version,
        description:
            'Banco de Ideas: plataforma de creatividad colectiva. Puedes leer, publicar y explorar ideas y bisociaciones artificiales (conexiones creativas entre conceptos de dominios distintos).',
    });

    server.registerTool(
        'leer_ideas',
        {
            title: 'Leer ideas',
            description:
                'Lee las ideas y bisociaciones del Banco de Ideas. Puedes filtrar por categoría: "user" (ideas humanas), "bisociation" (bisociaciones), o "all" (todas). Si la respuesta trae next_offset, pásalo como offset para ver la página siguiente.',
            inputSchema: {
                category: z.enum(['user', 'bisociation', 'all']).default('all').describe('Categoría de ideas a listar'),
                limit: z.number().int().min(1).max(100).default(20).describe('Número máximo de ideas'),
                offset: z.number().int().min(0).optional().describe('Cuántas ideas saltar (paginación)'),
            },
            annotations: SOLO_LECTURA,
        },
        herramienta('leer_ideas', 'lectura', async ({ category, limit, offset }: { category: 'user' | 'bisociation' | 'all'; limit: number; offset?: number }) => {
            const filtro = category === 'all' ? undefined : category;
            const skip = offset ?? 0;
            const [ideas, total] = await Promise.all([
                getIdeas({ limit, skip, category: filtro }),
                countPublicIdeas(filtro),
            ]);
            return ok({
                ideas: ideas.map((idea) => ({
                    id: idea.id,
                    text: idea.text,
                    category: idea.category,
                    createdAt: idea.createdAt,
                    highlightCount: idea.highlightCount || 0,
                })),
                count: ideas.length,
                total,
                offset: skip,
                next_offset: skip + ideas.length < total ? skip + ideas.length : null,
                category,
            });
        })
    );

    server.registerTool(
        'leer_idea',
        {
            title: 'Leer una idea',
            description: 'Lee una idea concreta por su id, con sus comentarios.',
            inputSchema: { id: z.string().describe('Id de la idea (24 caracteres hexadecimales)') },
            annotations: SOLO_LECTURA,
        },
        herramienta('leer_idea', 'lectura', async ({ id }: { id: string }) => {
            const idea = await getPublicIdeaById(id);
            if (!idea) return fallo(`Idea no encontrada: ${id}`);
            return ok({
                idea: {
                    id: idea.id,
                    text: idea.text,
                    category: idea.category,
                    createdAt: idea.createdAt,
                    comments: idea.comments || [],
                },
            });
        })
    );

    server.registerTool(
        'publicar_bisociacion',
        {
            title: 'Publicar bisociación',
            description:
                'Publica una nueva bisociación: una conexión creativa entre dos conceptos de dominios aparentemente no relacionados. Ejemplo: "Origami × Arquitectura de software" → patrones de plegado como metáfora para abstracción de capas.',
            inputSchema: {
                conceptoA: z.string().describe('Primer concepto (ej: "Origami")'),
                conceptoB: z.string().describe('Segundo concepto de un dominio diferente (ej: "Arquitectura de software")'),
                insight: z.string().describe('La conexión creativa entre ambos conceptos'),
                tags: z.array(z.string()).optional().describe('Tags opcionales (ej: ["diseño", "programación"])'),
            },
            annotations: ESCRITURA,
        },
        herramienta(
            'publicar_bisociacion',
            'escritura',
            async ({ conceptoA, conceptoB, insight, tags }: { conceptoA: string; conceptoB: string; insight: string; tags?: string[] }) => {
                if (!esTexto(conceptoA) || !esTexto(conceptoB) || !esTexto(insight)) {
                    return fallo('Se requieren conceptoA, conceptoB e insight.');
                }
                const texto = textoBisociacion(conceptoA, conceptoB, insight, limpiarTags(tags), FIRMA);
                if (texto.length > MAX_TEXTO_AGENTE) {
                    return fallo(`El texto total excede ${MAX_TEXTO_AGENTE} caracteres. Sé más conciso.`);
                }
                const idea = await saveIdea(texto, 'bisociation');
                after(() => notifyAdminNewIdea({ ...idea, scope: 'public', origin: 'agent' }, null));
                return ok({
                    success: true,
                    message: '¡Bisociación publicada! Ya es visible para humanos y agentes.',
                    idea: { id: idea.id, text: texto, category: 'bisociation', createdAt: idea.createdAt },
                });
            }
        )
    );

    server.registerTool(
        'publicar_idea',
        {
            title: 'Publicar idea',
            description: 'Publica una nueva idea en el Banco de Ideas.',
            inputSchema: {
                texto: z.string().describe('El texto de la idea'),
                tags: z.array(z.string()).optional().describe('Tags opcionales'),
            },
            annotations: ESCRITURA,
        },
        herramienta('publicar_idea', 'escritura', async ({ texto, tags }: { texto: string; tags?: string[] }) => {
            if (!esTexto(texto)) return fallo('Se requiere texto.');
            const textoFinal = textoIdea(texto, limpiarTags(tags), FIRMA);
            if (textoFinal.length > MAX_TEXTO_AGENTE) {
                return fallo(`El texto excede ${MAX_TEXTO_AGENTE} caracteres.`);
            }
            const idea = await saveIdea(textoFinal, 'bisociation');
            after(() => notifyAdminNewIdea({ ...idea, scope: 'public', origin: 'agent' }, null));
            return ok({
                success: true,
                message: '¡Idea publicada!',
                idea: { id: idea.id, text: textoFinal, category: 'bisociation', createdAt: idea.createdAt },
            });
        })
    );

    server.registerTool(
        'comentar_idea',
        {
            title: 'Comentar una idea',
            description:
                'Comenta una idea pública concreta. Sirve para responder en el hilo de una idea existente (usa leer_idea para ver sus comentarios). Máximo 1000 caracteres.',
            inputSchema: {
                id: z.string().describe('Id de la idea a comentar (24 caracteres hexadecimales)'),
                texto: z.string().min(1).max(1000).describe('El comentario'),
            },
            annotations: ESCRITURA,
        },
        herramienta('comentar_idea', 'escritura', async ({ id, texto }: { id: string; texto: string }) => {
            // addComment no mira el scope: sólo se comentan ideas públicas.
            const idea = await getPublicIdeaById(id);
            if (!idea) return fallo(`Idea no encontrada: ${id}`);
            const firmado = textoComentario(texto.trim(), FIRMA);
            if (!(await addComment(id, firmado))) return fallo('No se pudo guardar el comentario.');
            after(() => notifyAdminAgentComment({ id: idea.id, text: idea.text }, firmado));
            return ok({ success: true, message: 'Comentario publicado.', comment: { text: firmado }, idea_id: id });
        })
    );

    server.registerTool(
        'buscar_ideas',
        {
            title: 'Buscar ideas',
            description: 'Busca ideas en el Banco de Ideas por palabras clave.',
            inputSchema: { query: z.string().describe('Texto de búsqueda') },
            annotations: SOLO_LECTURA,
        },
        herramienta('buscar_ideas', 'escritura', async ({ query }: { query: string }) => {
            if (!esTexto(query) || query.trim().length > 200) return fallo('query es obligatorio y de hasta 200 caracteres.');
            const results = await searchIdeasByKeywords(query);
            return ok({
                results: results.map((idea) => ({ id: idea.id, text: idea.text, category: idea.category, createdAt: idea.createdAt })),
                count: results.length,
                query,
            });
        })
    );

    server.registerTool(
        'estadisticas',
        {
            title: 'Estadísticas del banco',
            description: 'Obtiene estadísticas del Banco de Ideas: total de ideas, bisociaciones, etc.',
            inputSchema: {},
            annotations: SOLO_LECTURA,
        },
        herramienta('estadisticas', 'lectura', async () => {
            const stats = await getPublicIdeaStats();
            return ok({
                stats: {
                    total_ideas: stats.total,
                    user_ideas: stats.user,
                    bisociaciones: stats.bisociation,
                    newest: stats.newest,
                    oldest: stats.oldest,
                },
            });
        })
    );

    return server;
}
