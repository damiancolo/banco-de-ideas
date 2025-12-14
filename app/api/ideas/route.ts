import { NextResponse } from 'next/server';
import { getIdeas, getIdeasByCategory, deleteIdea } from '@/lib/db';

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
        console.error('Error fetching ideas:', error);
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
 * Elimina una idea por ID
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

        const deleted = await deleteIdea(id);

        if (deleted) {
            return NextResponse.json({
                success: true,
                message: 'Idea eliminada exitosamente',
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
        console.error('Error deleting idea:', error);
        return NextResponse.json(
            {
                error: 'Error al eliminar idea',
                message: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}
