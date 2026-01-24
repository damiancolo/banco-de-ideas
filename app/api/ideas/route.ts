import { NextResponse } from 'next/server';
import { getIdeas, getIdeasByCategory, highlightIdea, saveIdea } from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Helper to get IP from request
 */
function getIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    return forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
}

/**
 * GET /api/ideas?category=user|bisociation
 * Obtiene todas las ideas o filtradas por categoría
 * 
 * @param request - Request object de Next.js
 * @returns JSON con array de ideas
 * 
 * @example
 * GET /api/ideas -> Todas las ideas
 * GET /api/ideas?category=user -> Solo ideas del usuario
 * GET /api/ideas?category=bisociation -> Solo bisociaciones
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

        const ideas = category
            ? await getIdeasByCategory(category as 'user' | 'bisociation')
            : await getIdeas();

        return NextResponse.json({
            ideas,
            count: ideas.length,
            category: category || 'all'
        });
    } catch (error) {
        logger.error('Error fetching ideas:', error);
        return NextResponse.json(
            {
                error: 'Error al obtener ideas',
                message: error instanceof Error ? error.message : 'Error desconocido'
            },
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
        const ip = getIp(request);

        // Rate Limiting para Highlights: 10 por minuto
        const rateLimit = await checkRateLimit(ip, 'highlight', 10, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Demasiados resaltados por ahora. Intenta de nuevo en un minuto.' },
                { status: 429 }
            );
        }

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

        const deleted = await highlightIdea(id);

        if (deleted) {
            return NextResponse.json({
                success: true,
                message: 'Idea resaltada exitosamente',
                id
            });
        } else {
            return NextResponse.json(
                {
                    error: 'Idea no encontrada',
                    message: `No se encontró una idea con ID: ${id}`
                },
                { status: 404 }
            );
        }
    } catch (error) {
        logger.error('Error deleting idea:', error);
        return NextResponse.json(
            {
                error: 'Error al eliminar idea',
                message: error instanceof Error ? error.message : 'Error desconocido'
            },
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
            {
                error: 'Error al guardar la idea',
                message: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}

