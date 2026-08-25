import { NextResponse } from 'next/server';
import {
    getIdeas,
    countPublicIdeas,
    IDEAS_POR_PAGINA,
    highlightIdea,
    deletePublicIdea,
    saveIdea,
} from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { auth } from '@/auth';

const ADMIN_EMAIL = 'damianlafferranderie@gmail.com';

/**
 * GET /api/ideas?category=user|bisociation&limit=60&skip=0
 * Obtiene una página de ideas públicas, de la más reciente a la más vieja.
 *
 * Devuelve `total` y `hasMore` para que el banco sepa si le queda algo por pedir.
 * Ya no existe la variante «todas»: la colección pasó las 1500 ideas y crece.
 *
 * @param request - Request object de Next.js
 * @returns JSON con array de ideas, total y si hay más
 *
 * @example
 * GET /api/ideas -> Primera página, ambas categorías
 * GET /api/ideas?category=user -> Primera página de ideas del usuario
 * GET /api/ideas?category=bisociation&skip=60 -> Segunda página de bisociaciones
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        // Validar categoría si se proporciona
        if (category && category !== 'user' && category !== 'bisociation') {
            return NextResponse.json(
                { error: 'Categoría inválida. Debe ser "user" o "bisociation"' },
                { status: 400 }
            );
        }

        const limitRaw = parseInt(searchParams.get('limit') || String(IDEAS_POR_PAGINA), 10);
        const skipRaw = parseInt(searchParams.get('skip') || '0', 10);
        const limit = Number.isNaN(limitRaw) ? IDEAS_POR_PAGINA : limitRaw;
        const skip = Math.max(Number.isNaN(skipRaw) ? 0 : skipRaw, 0);

        const filtro = (category as 'user' | 'bisociation' | null) ?? undefined;

        const [ideas, total] = await Promise.all([
            getIdeas({ limit, skip, category: filtro }),
            countPublicIdeas(filtro),
        ]);

        return NextResponse.json({
            ideas,
            count: ideas.length,
            total,
            skip,
            hasMore: skip + ideas.length < total,
            category: category || 'all'
        });
    } catch (error) {
        logger.error('Error fetching ideas:', error);
        return NextResponse.json(
            { error: 'Error al obtener ideas' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/ideas?id=xxx
 * Elimina (Resalta) una idea por ID
 * 
 * @param request - Request object de Next.js
 * @returns JSON con resultado de la operación
 * 
 * @example
 * DELETE /api/ideas?id=507f1f77bcf86cd799439011
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const action = searchParams.get('action');

        // Validar que se proporcionó un ID
        if (!id) {
            return NextResponse.json(
                { error: 'ID requerido. Proporciona ?id=xxx en la URL' },
                { status: 400 }
            );
        }

        // Validar formato de ObjectId de MongoDB
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return NextResponse.json(
                { error: 'ID inválido. Debe ser un ObjectId válido de MongoDB (24 caracteres hexadecimales)' },
                { status: 400 }
            );
        }

        // Borrado real: solo admin
        if (action === 'delete') {
            const session = await auth();
            if (session?.user?.email !== ADMIN_EMAIL) {
                return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
            }

            const deleted = await deletePublicIdea(id);
            if (deleted) {
                return NextResponse.json({ success: true, message: 'Idea borrada', id });
            } else {
                return NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 });
            }
        }

        // Comportamiento por defecto: resaltar (highlight)
        const ip = getIp(request);
        const rateLimit = await checkRateLimit(ip, 'highlight', 10, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Demasiados resaltados por ahora. Intenta de nuevo en un minuto.' },
                { status: 429 }
            );
        }

        const highlighted = await highlightIdea(id);

        if (highlighted) {
            return NextResponse.json({
                success: true,
                message: 'Idea resaltada exitosamente',
                id
            });
        } else {
            return NextResponse.json(
                { error: 'Idea no encontrada' },
                { status: 404 }
            );
        }
    } catch (error) {
        logger.error('Error deleting idea:', error);
        return NextResponse.json(
            { error: 'Error al eliminar idea' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/ideas
 * Crea una nueva idea
 * 
 * @param request - Request object de Next.js
 * @returns JSON con la idea creada
 */
export async function POST(request: Request) {
    try {
        const { text, category } = await request.json();
        const ip = getIp(request);

        // Rate Limiting para Nuevas Ideas: 5 por minuto
        // Es un límite estricto para evitar spam de base de datos
        const rateLimit = await checkRateLimit(ip, 'new-idea', 5, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Estás creando ideas muy rápido. Tómate un respiro de un minuto.' },
                { status: 429 }
            );
        }

        if (text && text.length > 1500) {
            return NextResponse.json(
                { error: 'La idea excede el límite de 1500 caracteres.' },
                { status: 400 }
            );
        }

        if (!text) {
            return NextResponse.json(
                { error: 'El texto de la idea es requerido' },
                { status: 400 }
            );
        }

        const idea = await saveIdea(text, category || 'user');

        return NextResponse.json({
            success: true,
            idea
        });
    } catch (error) {
        logger.error('Error saving idea via API:', error);
        return NextResponse.json(
            { error: 'Error al guardar la idea' },
            { status: 500 }
        );
    }
}

