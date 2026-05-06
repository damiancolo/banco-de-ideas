import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { getUserIdeas, savePrivateIdea, highlightPrivateIdea, deletePrivateIdea } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';

export async function GET(request: Request) {
    let userId: string;
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = getIp(request);
    const rateLimit = await checkRateLimit(ip, 'privado-ideas-get', 30, 60);
    if (!rateLimit.success) {
        return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    try {
        const ideas = await getUserIdeas(userId);
        return NextResponse.json({ ideas, count: ideas.length });
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener ideas' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    let userId: string;
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = getIp(request);
    const rateLimit = await checkRateLimit(ip, 'privado-ideas-post', 5, 60);
    if (!rateLimit.success) {
        return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    try {
        const { text, category = 'user' } = await request.json();

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });
        }

        if (text.trim().length > 1500) {
            return NextResponse.json({ error: 'Excede 1500 caracteres' }, { status: 400 });
        }

        const idea = await savePrivateIdea(text, category, userId);
        return NextResponse.json({ idea });
    } catch (error) {
        return NextResponse.json({ error: 'Error al guardar idea' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    let userId: string;
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = getIp(request);
    const rateLimit = await checkRateLimit(ip, 'privado-ideas-delete', 10, 60);
    if (!rateLimit.success) {
        return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const action = searchParams.get('action');

        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        if (action === 'delete') {
            const success = await deletePrivateIdea(id, userId);
            if (!success) {
                return NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 });
            }
            return NextResponse.json({ success: true });
        }

        const success = await highlightPrivateIdea(id, userId);
        if (!success) {
            return NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error al resaltar idea' }, { status: 500 });
    }
}
