import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { addPrivateComment } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';

export async function POST(request: Request) {
    let userId: string;
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = getIp(request);
    const rateLimit = await checkRateLimit(ip, 'privado-comments', 10, 60);
    if (!rateLimit.success) {
        return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    try {
        const { id, text } = await request.json();

        if (!id || !text || typeof text !== 'string') {
            return NextResponse.json({ error: 'ID y texto requeridos' }, { status: 400 });
        }

        if (text.trim().length > 1500) {
            return NextResponse.json({ error: 'El comentario no puede exceder 1500 caracteres' }, { status: 400 });
        }

        const success = await addPrivateComment(id, text, userId);
        if (!success) {
            return NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error al agregar comentario' }, { status: 500 });
    }
}
