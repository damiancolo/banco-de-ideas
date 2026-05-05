import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireMembership } from '@/lib/enterprise/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const session = await auth();
        
        // requireMembership throws if unauthorized or forbidden
        const membership = await requireMembership(slug, session);
        
        // Return the organization data
        return NextResponse.json(membership.organization);
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (error.message === 'FORBIDDEN') {
            return NextResponse.json({ error: 'Acceso denegado a esta organización' }, { status: 403 });
        }
        console.error('Error fetching organization:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
