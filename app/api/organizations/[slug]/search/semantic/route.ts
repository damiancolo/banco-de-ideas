import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireMembership } from '@/lib/enterprise/auth';
import { connectDB } from '@/lib/mongodb';
import Idea from '@/lib/models/Idea';
import { generateEmbedding, cosineSimilarity } from '@/lib/utils/embeddings';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const session = await auth();

    let membership: Awaited<ReturnType<typeof requireMembership>>;
    try {
        membership = await requireMembership(slug, session);
    } catch (e: any) {
        if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const ip = getIp(req);
        const rateLimit = await checkRateLimit(ip, `org-semantic-${slug}`, 15, 60);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Demasiadas búsquedas. Intenta en un minuto.' }, { status: 429 });
        }

        const { query } = await req.json();
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json({ error: 'Se requiere un texto de búsqueda' }, { status: 400 });
        }

        await connectDB();

        const queryEmbedding = await generateEmbedding(query.trim());

        const ideas = await Idea.find({
            'scope.type': 'organization',
            'scope.organizationId': membership.organization._id,
            embedding: { $exists: true, $ne: [] }
        })
            .select('+embedding')
            .lean() as any[];

        if (ideas.length === 0) {
            return NextResponse.json({ result: [], message: 'No hay ideas con embeddings aún.' });
        }

        const results = ideas
            .map(idea => ({
                id: idea._id.toString(),
                title: idea.text.substring(0, 50) + (idea.text.length > 50 ? '...' : ''),
                summary: idea.text,
                similarity: Math.round(cosineSimilarity(queryEmbedding, idea.embedding) * 100) / 100,
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);

        return NextResponse.json({ result: results });

    } catch (error) {
        logger.error('Org semantic search error:', error);
        return NextResponse.json({ error: 'Error en la búsqueda semántica' }, { status: 500 });
    }
}
