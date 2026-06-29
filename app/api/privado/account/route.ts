import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-utils';
import { getMongoClient } from '@/lib/auth-client';
import { connectDB } from '@/lib/mongodb';
import Idea from '@/lib/models/Idea';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// Mismas ideas que el usuario ve como suyas (privadas; excluye contenido de organización
// para no destruir material compartido). Coincide con getUserIdeas() en lib/db.ts.
function userIdeasFilter(userId: string) {
    return { userId, $nor: [{ 'scope.type': 'organization' as const }] };
}

/**
 * GET — Derecho de acceso/portabilidad (RGPD Art. 15/20).
 * Devuelve una copia de los datos del usuario en JSON descargable.
 */
export async function GET(request: Request) {
    let userId: string;
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = getIp(request);
    const rateLimit = await checkRateLimit(ip, 'privado-account-export', 5, 60);
    if (!rateLimit.success) {
        return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        return NextResponse.json({ error: 'Sesión inválida' }, { status: 400 });
    }

    try {
        const client = await getMongoClient();
        const db = client.db();
        const profile = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { name: 1, email: 1, image: 1, emailVerified: 1 } }
        );

        await connectDB();
        const ideas = await Idea.find(userIdeasFilter(userId))
            .select('text category createdAt comments scope')
            .sort({ createdAt: -1 })
            .lean();

        const payload = {
            exportedAt: new Date().toISOString(),
            profile: profile
                ? { name: profile.name, email: profile.email, image: profile.image }
                : null,
            ideas,
            ideasCount: ideas.length,
        };

        return new NextResponse(JSON.stringify(payload, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': 'attachment; filename="mis-datos-banco-de-ideas.json"',
            },
        });
    } catch (error) {
        logger.error('Error exportando datos de cuenta:', error);
        return NextResponse.json({ error: 'Error al exportar los datos' }, { status: 500 });
    }
}

/**
 * DELETE — Derecho de supresión (RGPD Art. 17).
 * Borra de forma irreversible la cuenta del usuario autenticado y todos sus datos.
 */
export async function DELETE(request: Request) {
    let userId: string;
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = getIp(request);
    const rateLimit = await checkRateLimit(ip, 'privado-account-delete', 3, 60);
    if (!rateLimit.success) {
        return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        return NextResponse.json({ error: 'Sesión inválida' }, { status: 400 });
    }

    try {
        // 1. Ideas del usuario (Mongoose)
        await connectDB();
        const ideasResult = await Idea.deleteMany(userIdeasFilter(userId));

        // 2. Membresías de organización, si existen (no bloqueante)
        let membershipsDeleted = 0;
        try {
            const { default: Membership } = await import('@/lib/models/Membership');
            const memResult = await Membership.deleteMany({ userId });
            membershipsDeleted = memResult.deletedCount ?? 0;
        } catch {
            // El modelo puede no existir en este entorno; no es crítico.
        }

        // 3. Registros de autenticación (MongoClient nativo del adapter)
        const client = await getMongoClient();
        const db = client.db();
        const _id = new ObjectId(userId);
        await db.collection('accounts').deleteMany({ userId: _id });
        await db.collection('sessions').deleteMany({ userId: _id });
        const userResult = await db.collection('users').deleteOne({ _id });

        logger.info(
            `Cuenta eliminada: ideas=${ideasResult.deletedCount} memberships=${membershipsDeleted} user=${userResult.deletedCount}`
        );

        return NextResponse.json({
            success: true,
            deleted: {
                ideas: ideasResult.deletedCount ?? 0,
                memberships: membershipsDeleted,
                account: userResult.deletedCount ?? 0,
            },
        });
    } catch (error) {
        logger.error('Error eliminando cuenta:', error);
        return NextResponse.json({ error: 'Error al eliminar la cuenta' }, { status: 500 });
    }
}
