import { NextResponse } from 'next/server';
import { searchIdeasByKeywords } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * POST /api/search/keywords
 * Endpoint para búsqueda de ideas por palabras clave (regex search)
 * 
 * @param request - Request con { query }
 * @returns JSON con array de resultados
 */
export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json(
                { error: 'Se requiere un texto de búsqueda' },
                { status: 400 }
            );
        }

        if (query.trim().length > 200) {
            return NextResponse.json(
                { error: 'La búsqueda no puede exceder 200 caracteres' },
                { status: 400 }
            );
        }

        logger.info(`Keyword search: "${query.substring(0, 50)}..."`);
        const ideas = await searchIdeasByKeywords(query.trim());

        // Formatear como SearchResult para consistencia con semantic search
        const results = ideas.map((idea) => ({
            id: idea.id,
            title: idea.text.substring(0, 50) + (idea.text.length > 50 ? '...' : ''),
            summary: idea.text,
        }));

        logger.info(`Found ${results.length} results for keyword search`);
        return NextResponse.json({ result: results });

    } catch (error) {
        logger.error('Keyword search error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error en la búsqueda' },
            { status: 500 }
        );
    }
}
