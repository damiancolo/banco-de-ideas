import { NextResponse } from 'next/server';
import { recordVisit } from '@/lib/visits';
import { logger } from '@/lib/logger';

const TRACK_SECRET = process.env.TRACK_SECRET || '';

export async function POST(request: Request) {
    try {
        // Validate secret
        const body = await request.json();
        if (!TRACK_SECRET || body.secret !== TRACK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await recordVisit({
            timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
            path: body.path,
            visitorType: body.visitorType,
            botName: body.botName,
            browser: body.browser,
            deviceType: body.deviceType,
            country: body.country,
            referrer: body.referrer,
            site: body.site,
            visitorId: typeof body.visitorId === 'string' ? body.visitorId.slice(0, 16) : null,
            userAgent: typeof body.userAgent === 'string' ? body.userAgent : null,
        });

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        logger.error('Error saving visit:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
