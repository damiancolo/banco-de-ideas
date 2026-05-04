import { NextResponse } from 'next/server';
import { getCurrentUserId, getActiveMemberships } from '@/lib/enterprise/auth';

export async function GET() {
    const userId = await getCurrentUserId();

    if (!userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const memberships = await getActiveMemberships(userId);

        // Strip internal fields — UI only needs what it renders and what builds links
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
