import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireMembership } from '@/lib/enterprise/auth';
import { getOrganizationIdeas, saveOrganizationIdea } from '@/lib/db';
import { getIp } from '@/lib/request-utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const session = await auth();
        
        // requireMembership throws if unauthorized or forbidden
        const membership = await requireMembership(slug, session);
        
        const ideas = await getOrganizationIdeas(membership.organization._id);

        return NextResponse.json({
            ideas,
            count: ideas.length
        });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (error.message === 'FORBIDDEN') {
            return NextResponse.json({ error: 'Acceso denegado a esta organización' }, { status: 403 });
        }
        logger.error('Error fetching organization ideas:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const session = await auth();
        
        // requireMembership throws if unauthorized or forbidden
        const membership = await requireMembership(slug, session);

        const { text, category } = await request.json();
        const ip = getIp(request);

        // Rate Limiting para Nuevas Ideas Organizacionales: 15 por minuto
        const rateLimit = await checkRateLimit(ip, 'new-org-idea', 15, 60);
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

        const idea = await saveOrganizationIdea(
            text, 
            category || 'user', 
            membership.organization._id, 
            session?.user?.id
        );

        return NextResponse.json({
            success: true,
            idea
        });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (error.message === 'FORBIDDEN') {
            return NextResponse.json({ error: 'Acceso denegado a esta organización' }, { status: 403 });
        }
        logger.error('Error saving organization idea via API:', error);
        return NextResponse.json(
            { error: 'Error al guardar la idea' },
            { status: 500 }
        );
    }
}
