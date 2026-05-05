import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import Organization from '@/lib/models/Organization';
import Membership from '@/lib/models/Membership';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const ip = getIp(req);
        const rateLimit = await checkRateLimit(ip, 'org-join', 10, 60);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Demasiados intentos. Inténtalo más tarde.' }, { status: 429 });
        }

        const { token } = await req.json();
        if (!token || typeof token !== 'string') {
            return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
        }

        await connectDB();

        const org = await Organization.findOne({
            joinToken: token.toUpperCase(),
            status: 'active',
        }).lean();

        if (!org) {
            return NextResponse.json({ error: 'Enlace no válido o programa finalizado' }, { status: 404 });
        }

        // Already a member?
        const existing = await Membership.findOne({
            userId: session.user.id,
            organizationId: org._id,
            status: 'active',
        }).lean();

        if (existing) {
            return NextResponse.json({ slug: org.slug, alreadyMember: true });
        }

        await Membership.create({
            userId: session.user.id,
            organizationId: org._id,
            role: 'participant',
            status: 'active',
        });

        return NextResponse.json({ slug: org.slug, name: org.name });

    } catch (error) {
        console.error('Error joining org:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
