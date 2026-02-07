import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Idea from '@/lib/models/Idea';
import { generateEmbedding, cosineSimilarity } from '@/lib/utils/embeddings';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';

interface IdeaWithEmbedding {
    _id: string;
    text: string;
    category: string;
    embedding: number[];
    createdAt: Date;
}

interface SearchResult {
    id: string;
    title: string;
    summary: string;
    similarity: number;
}

export async function POST(req: Request) {
    try {
        // Rate limit: 15 req/min (uses embeddings, costly)
        const ip = getIp(req);
        const rateLimit = await checkRateLimit(ip, 'semantic-search', 15, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Demasiadas búsquedas. Intenta de nuevo en un minuto.' },
                { status: 429 }
            );
        }

        const { query } = await req.json();

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json(
                { error: 'Se requiere un texto de búsqueda' },
                { status: 400 }
            );
        }

        await connectDB();

        // Generate embedding for the query
        logger.info(`Generating embedding for query: "${query.substring(0, 50)}..."`);
        const queryEmbedding = await generateEmbedding(query.trim());

        // Auto-save: Store the search query as a new idea with its embedding
        // This saves computation for future searches and builds the idea bank
        let savedIdeaId: string | null = null;
        try {
            const savedIdea = await Idea.create({
                text: query.trim(),
                category: 'user',
                embedding: queryEmbedding,
            });
            savedIdeaId = savedIdea._id.toString();
            logger.info(`Auto-saved search query as new idea with ID: ${savedIdeaId}`);
        } catch (saveError) {
            // Don't fail the search if save fails, just log it
            logger.warn('Failed to auto-save search query:', saveError);
        }

        // Fetch all ideas that have embeddings, excluding the one we just saved
        const queryFilter: any = { embedding: { $exists: true, $ne: [] } };
        if (savedIdeaId) {
            queryFilter._id = { $ne: savedIdeaId };
        }

        const ideas = await Idea.find(queryFilter)
            .select('+embedding') // Include embedding field (excluded by default)
            .lean() as unknown as IdeaWithEmbedding[];

        logger.info(`Found ${ideas.length} ideas with embeddings`);

        if (ideas.length === 0) {
            return NextResponse.json({
                result: [],
                message: 'No hay ideas con embeddings. Ejecuta el script de migración primero.'
            });
        }

        // Calculate similarity for each idea
        const results: SearchResult[] = ideas
            .map(idea => {
                const similarity = cosineSimilarity(queryEmbedding, idea.embedding);
                return {
                    id: idea._id.toString(),
                    title: idea.text.substring(0, 50) + (idea.text.length > 50 ? '...' : ''),
                    summary: idea.text,
                    similarity: Math.round(similarity * 100) / 100, // Round to 2 decimals
                };
            })
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5); // Top 5 results

        logger.info(`Returning ${results.length} search results`);

        return NextResponse.json({ result: results });

    } catch (error) {
        logger.error('Semantic search error:', error);
        return NextResponse.json(
            { error: 'Error en la búsqueda semántica' },
            { status: 500 }
        );
    }
}
