import { NextResponse } from 'next/server';
import { addComment, getPublicIdeaById } from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';

export async function POST(request: Request) {
    try {
        const { id, text } = await request.json();
        const ip = getIp(request);

        // Validar longitud del comentario antes de nada
        if (text && text.length > 1500) {
            return NextResponse.json(
                { error: 'El comentario excede el límite de 1500 caracteres.' },
                { status: 400 }
            );
        }

        // Rate Limiting para Comentarios: 10 por minuto
        // Compartimos el cupo con Highlights o podemos usar uno aparte.
        // Aquí usamos uno específico 'comment'.
        const rateLimit = await checkRateLimit(ip, 'comment', 10, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Estás comentando muy rápido. Espera un momento.' },
                { status: 429 }
            );
        }

        if (typeof id !== 'string' || typeof text !== 'string' || !id || !text.trim()) {
            return NextResponse.json(
                { error: 'ID de idea y texto del comentario son requeridos' },
                { status: 400 }
            );
        }

        // addComment no mira el scope: sin este control se podrían comentar
        // ideas privadas o de Enterprise conociendo (o adivinando) el id.
        const idea = await getPublicIdeaById(id);
        const success = idea ? await addComment(id, text) : false;

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Comentario añadido correctamente'
            });
        } else {
            return NextResponse.json(
                { error: 'No se pudo añadir el comentario. Verifica el ID.' },
                { status: 404 }
            );
        }
    } catch (error) {
        logger.error('Error in comments API:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
