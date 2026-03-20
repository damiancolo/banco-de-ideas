import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { searchUserIdeasByKeywords } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';

export async function POST(req: Request) {
    let userId: string;
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const ip = getIp(req);
        const rateLimit = await checkRateLimit(ip, 'privado-keywords', 20, 60);
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

        if (query.trim().length > 200) {
            return NextResponse.json({ error: 'El texto de búsqueda no puede exceder 200 caracteres' }, { status: 400 });
        }

        const ideas = await searchUserIdeasByKeywords(query, userId);

        const result = ideas.map(idea => ({
            id: idea.id,
            title: idea.text.substring(0, 50) + (idea.text.length > 50 ? '...' : ''),
            summary: idea.text,
        }));

        return NextResponse.json({ result });

    } catch (error) {
        return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 });
    }
}
