import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireMembership } from '@/lib/enterprise/auth';
import { connectDB } from '@/lib/mongodb';
import Idea from '@/lib/models/Idea';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';

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
        const rateLimit = await checkRateLimit(ip, `org-keywords-${slug}`, 20, 60);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Demasiadas búsquedas. Intenta en un minuto.' }, { status: 429 });
        }

        const { query } = await req.json();
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json({ error: 'Se requiere un texto de búsqueda' }, { status: 400 });
        }

        await connectDB();

        const ideas = await Idea.find({
            'scope.type': 'organization',
            'scope.organizationId': membership.organization._id,
            $text: { $search: query.trim() }
        })
            .sort({ score: { $meta: 'textScore' } })
            .limit(10)
            .lean();

        // Fallback to regex if text index not available
        const results = ideas.length > 0 ? ideas : await Idea.find({
            'scope.type': 'organization',
            'scope.organizationId': membership.organization._id,
            text: { $regex: query.trim(), $options: 'i' }
        }).limit(10).lean();

        return NextResponse.json({
            result: results.map((idea: any) => ({
                id: idea._id.toString(),
                title: idea.text.substring(0, 50) + (idea.text.length > 50 ? '...' : ''),
                summary: idea.text,
            }))
        });

    } catch {
        return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 });
    }
}
