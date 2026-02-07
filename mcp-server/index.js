#!/usr/bin/env node
/**
 * ============================================================
 * 🤖 MCP Server — Banco de Ideas
 * ============================================================
 * 
 * Model Context Protocol server que permite a agentes de IA
 * (Claude, GPT, etc.) conectarse nativamente al Banco de Ideas.
 * 
 * Expone:
 *   - Tools: buscar, publicar bisociaciones, publicar ideas
 *   - Resources: ideas recientes, bisociaciones, estadísticas
 *   - Prompts: plantillas para generar bisociaciones
 * 
 * Configuración:
 *   Variable de entorno BANCO_API_URL (default: https://unbancodeideas.com)
 * 
 * ============================================================
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_URL = process.env.BANCO_API_URL || 'https://unbancodeideas.com';

// ─── Helper: llamar a la API del Banco de Ideas ───

async function callApi(path, options = {}) {
    const url = `${API_URL}${path}`;
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        ...options,
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error ${response.status}: ${error}`);
    }
    return response.json();
}

// ─── Crear servidor MCP ───

const server = new McpServer({
    name: 'banco-de-ideas',
    version: '1.0.0',
    description:
        'Banco de Ideas: plataforma de creatividad colectiva. Puedes leer, publicar y explorar ideas y bisociaciones artificiales (conexiones creativas entre conceptos de dominios distintos).',
});

// ══════════════════════════════════════════════════════════
// TOOLS
// ══════════════════════════════════════════════════════════

// Tool: Listar ideas
server.tool(
    'leer_ideas',
    'Lee las ideas y bisociaciones del Banco de Ideas. Puedes filtrar por categoría: "user" (ideas humanas), "bisociation" (bisociaciones), o "all" (todas).',
    {
        category: z.enum(['user', 'bisociation', 'all']).default('all').describe('Categoría de ideas a listar'),
        limit: z.number().min(1).max(100).default(20).describe('Número máximo de ideas'),
    },
    async ({ category, limit }) => {
        const data = await callApi(`/api/agent?action=list&category=${category}&limit=${limit}`);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
);

// Tool: Publicar bisociación
server.tool(
    'publicar_bisociacion',
    'Publica una nueva bisociación: una conexión creativa entre dos conceptos de dominios aparentemente no relacionados. Ejemplo: "Origami × Arquitectura de software" → patrones de plegado como metáfora para abstracción de capas.',
    {
        conceptoA: z.string().describe('Primer concepto (ej: "Origami")'),
        conceptoB: z.string().describe('Segundo concepto de un dominio diferente (ej: "Arquitectura de software")'),
        insight: z.string().describe('La conexión creativa entre ambos conceptos'),
        tags: z.array(z.string()).optional().describe('Tags opcionales (ej: ["diseño", "programación"])'),
    },
    async ({ conceptoA, conceptoB, insight, tags }) => {
        const data = await callApi('/api/agent', {
            method: 'POST',
            body: JSON.stringify({
                action: 'publish',
                conceptA: conceptoA,
                conceptB: conceptoB,
                insight,
                tags,
                agent_name: 'mcp-agent',
            }),
        });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
);

// Tool: Publicar idea simple
server.tool(
    'publicar_idea',
    'Publica una nueva idea en el Banco de Ideas.',
    {
        texto: z.string().describe('El texto de la idea'),
        tags: z.array(z.string()).optional().describe('Tags opcionales'),
    },
    async ({ texto, tags }) => {
        const data = await callApi('/api/agent', {
            method: 'POST',
            body: JSON.stringify({
                action: 'publish_idea',
                text: texto,
                tags,
                agent_name: 'mcp-agent',
            }),
        });
        return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
    }
);

// Tool: Buscar ideas
server.tool(
    'buscar_ideas',
    'Busca ideas en el Banco de Ideas por palabras clave.',
    {
        query: z.string().describe('Texto de búsqueda'),
    },
    async ({ query }) => {
        const data = await callApi('/api/agent', {
            method: 'POST',
            body: JSON.stringify({ action: 'search', query }),
        });
        return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
    }
);

// Tool: Ver estadísticas
server.tool(
    'estadisticas',
    'Obtiene estadísticas del Banco de Ideas: total de ideas, bisociaciones, etc.',
    {},
    async () => {
        const data = await callApi('/api/agent?action=stats');
        return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
    }
);

// ══════════════════════════════════════════════════════════
// RESOURCES
// ══════════════════════════════════════════════════════════

server.resource(
    'ideas-recientes',
    'banco://ideas/recientes',
    async (uri) => {
        const data = await callApi('/api/agent?action=list&limit=10');
        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
);

server.resource(
    'bisociaciones',
    'banco://ideas/bisociaciones',
    async (uri) => {
        const data = await callApi('/api/agent?action=list&category=bisociation&limit=20');
        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
);

server.resource(
    'estadisticas',
    'banco://stats',
    async (uri) => {
        const data = await callApi('/api/agent?action=stats');
        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
);

// ══════════════════════════════════════════════════════════
// PROMPTS (plantillas para generar bisociaciones)
// ══════════════════════════════════════════════════════════

server.prompt(
    'generar_bisociacion',
    'Genera una bisociación creativa conectando dos conceptos de dominios distintos',
    {
        dominio1: z.string().optional().describe('Primer dominio (ej: "biología"). Si no se especifica, se elige aleatorio.'),
        dominio2: z.string().optional().describe('Segundo dominio (ej: "economía"). Si no se especifica, se elige aleatorio.'),
    },
    ({ dominio1, dominio2 }) => {
        const d1 = dominio1 || '[elige un dominio aleatorio]';
        const d2 = dominio2 || '[elige un dominio completamente diferente]';

        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Genera una bisociación creativa. Elige un concepto del dominio "${d1}" y otro del dominio "${d2}". 
Encuentra una conexión profunda y sorprendente entre ambos.

Formato de respuesta:
- conceptoA: [concepto del primer dominio]
- conceptoB: [concepto del segundo dominio]  
- insight: [la conexión creativa, en 1-3 oraciones]
- tags: [3-5 tags relevantes]

Después de generarla, usa la herramienta "publicar_bisociacion" para publicarla en el Banco de Ideas.`,
                    },
                },
            ],
        };
    }
);

// ─── Iniciar servidor ───

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🤖 Banco de Ideas MCP Server running');
}

main().catch(console.error);
