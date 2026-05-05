import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentUserId, getActiveMemberships } from '@/lib/enterprise/auth';
import { connectDB } from '@/lib/mongodb';
import Membership from '@/lib/models/Membership';

export async function GET() {
    const userId = await getCurrentUserId();

    if (!userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        await connectDB();

        // Claim any memberships stored with the user's email (e.g. created before first login)
        const session = await auth();
        if (session?.user?.email) {
            await Membership.updateMany(
                { userId: session.user.email },
                { $set: { userId } }
            );
        }

        const memberships = await getActiveMemberships(userId);

        const organizations = memberships.map(m => ({
            _id: m.organization._id,
            name: m.organization.name,
            slug: m.organization.slug,
            logoUrl: m.organization.logoUrl,
            programEndDate: m.organization.programEndDate,
        }));

        return NextResponse.json(organizations);
    } catch {
        return NextResponse.json({ error: 'Error al obtener organizaciones' }, { status: 500 });
    }
}
