import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
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

export async function POST(req: Request) {
    let userId: string;
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const ip = getIp(req);
        const rateLimit = await checkRateLimit(ip, 'privado-semantic', 15, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Demasiadas búsquedas. Intenta de nuevo en un minuto.' },
                { status: 429 }
            );
        }

        const { query } = await req.json();

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json({ error: 'Se requiere un texto de búsqueda' }, { status: 400 });
        }

        await connectDB();

        const queryEmbedding = await generateEmbedding(query.trim());

        // Auto-save search query as private idea with embedding
        let savedIdeaId: string | null = null;
        try {
            const savedIdea = await Idea.create({
                text: query.trim(),
                category: 'user',
                embedding: queryEmbedding,
                userId,
            });
            savedIdeaId = savedIdea._id.toString();
        } catch (saveError) {
            logger.warn('Failed to auto-save private search query:', saveError);
        }

        // Only search among user's own ideas with embeddings
        const queryFilter: Record<string, unknown> = {
            embedding: { $exists: true, $ne: [] },
            userId,
        };
        if (savedIdeaId) {
            queryFilter._id = { $ne: savedIdeaId };
        }

        const ideas = await Idea.find(queryFilter)
            .select('+embedding')
            .lean() as unknown as IdeaWithEmbedding[];

        if (ideas.length === 0) {
            return NextResponse.json({
                result: [],
                message: 'No hay ideas privadas con embeddings.'
            });
        }

        const results = ideas
            .map(idea => {
                const similarity = cosineSimilarity(queryEmbedding, idea.embedding);
                return {
                    id: idea._id.toString(),
                    title: idea.text.substring(0, 50) + (idea.text.length > 50 ? '...' : ''),
                    summary: idea.text,
                    similarity: Math.round(similarity * 100) / 100,
                };
            })
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);

        return NextResponse.json({ result: results });

    } catch (error) {
        logger.error('Private semantic search error:', error);
        return NextResponse.json({ error: 'Error en la búsqueda semántica' }, { status: 500 });
    }
}
