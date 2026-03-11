import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Visit from '@/lib/models/Visit';
import { logger } from '@/lib/logger';

const TRACK_SECRET = process.env.TRACK_SECRET || '';

export async function POST(request: Request) {
    try {
        // Validate secret
        const body = await request.json();
        if (!TRACK_SECRET || body.secret !== TRACK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        await Visit.create({
            timestamp: new Date(),
            path: body.path || '/',
            visitorType: body.visitorType || 'human',
            botName: body.botName || null,
            browser: body.browser || null,
            deviceType: body.deviceType || 'desktop',
            country: body.country || null,
            referrer: body.referrer || null,
        });

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        logger.error('Error saving visit:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
