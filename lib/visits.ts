import { connectDB } from '@/lib/mongodb';
import Visit from '@/lib/models/Visit';

export const VISITOR_TYPES = ['human', 'ai_crawler', 'other_bot', 'agent', 'bot'] as const;
export type VisitorType = (typeof VISITOR_TYPES)[number];

export type VisitInput = {
    timestamp?: Date;
    path?: string;
    visitorType?: string;
    botName?: string | null;
    browser?: string | null;
    deviceType?: string;
    country?: string | null;
    referrer?: string | null;
    site?: string | null;
    visitorId?: string | null;
    userAgent?: string | null;
};

/** Guarda una visita. Un único punto de escritura para /api/track y para /api/agent. */
export async function recordVisit(input: VisitInput): Promise<void> {
    await connectDB();
    const visitorType = VISITOR_TYPES.includes(input.visitorType as VisitorType)
        ? (input.visitorType as VisitorType)
        : 'human';
    await Visit.create({
        timestamp: input.timestamp ?? new Date(),
        path: input.path || '/',
        visitorType,
        botName: input.botName || null,
        browser: input.browser || null,
        deviceType: input.deviceType || 'desktop',
        country: input.country || null,
        referrer: input.referrer || null,
        site: input.site || null,
        visitorId: input.visitorId || null,
        userAgent: input.userAgent ? String(input.userAgent).slice(0, 200) : null,
    });
}

const TZ = 'Europe/Madrid';

/** Medianoche de hoy en Madrid, expresada como instante UTC. */
export function madridStartOfToday(now = new Date()): Date {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-GB', {
            timeZone: TZ,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        })
            .formatToParts(now)
            .map((p) => [p.type, Number(p.value)])
    ) as Record<string, number>;
    const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const offset = localAsUtc - Math.floor(now.getTime() / 1000) * 1000; // Madrid menos UTC
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - offset);
}
