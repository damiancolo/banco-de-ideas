import { NextResponse } from 'next/server';
import type { PipelineStage } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Visit from '@/lib/models/Visit';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';
import { madridStartOfToday } from '@/lib/visits';

const TZ = 'Europe/Madrid';
// 'bot' es el valor viejo (antes de separar tipos): se lee como ai_crawler.
const CRAWLER_TYPES = ['ai_crawler', 'bot'];

function getDateFilter(range: string): Date | null {
    const now = new Date();
    switch (range) {
        case 'today':
            return madridStartOfToday(now);
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case 'all':
        default:
            return null;
    }
}

type Counted = { _id: string; count: number };

export async function GET(request: Request) {
    try {
        // Rate limit: 30/min
        const ip = getIp(request);
        const { success } = await checkRateLimit(ip, 'tracker-dashboard', 30, 60);
        if (!success) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        await connectDB();

        const url = new URL(request.url);
        const range = url.searchParams.get('range') || '7d';
        const site = url.searchParams.get('site') || 'unbancodeideas';
        const since = getDateFilter(range);

        const matchStage = since
            ? { timestamp: { $gte: since }, site }
            : { site };

        const dia = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: TZ } };
        const porTipo = (...tipos: string[]) => ({ ...matchStage, visitorType: { $in: tipos } });
        const humanos = porTipo('human');
        const top = (match: object, campo: string, limit?: number): PipelineStage[] => [
            { $match: match },
            { $group: { _id: `$${campo}`, count: { $sum: 1 } } },
            { $sort: { count: -1 as const } },
            ...(limit ? [{ $limit: limit }] : []),
        ];

        const [
            totalVisits,
            byType,
            visitsByDay,
            personasPorDia,
            topBots,
            topAgents,
            topPages,
            browsers,
            devices,
            countries,
            recentVisits,
            v2Since,
        ] = await Promise.all([
            Visit.countDocuments(matchStage),

            Visit.aggregate([
                { $match: matchStage },
                { $group: { _id: '$visitorType', count: { $sum: 1 } } },
            ]),

            Visit.aggregate([
                { $match: matchStage },
                { $group: { _id: { date: dia, visitorType: '$visitorType' }, count: { $sum: 1 } } },
                { $sort: { '_id.date': 1 } },
            ]),

            // Personas únicas: el visitorId rota cada día, así que en un rango
            // largo es la suma de las personas únicas de cada día.
            Visit.aggregate([
                { $match: { ...humanos, visitorId: { $ne: null } } },
                { $group: { _id: { date: dia, visitorId: '$visitorId' } } },
                { $count: 'n' },
            ]),

            Visit.aggregate(top({ ...porTipo(...CRAWLER_TYPES), botName: { $ne: null } }, 'botName', 10)),
            Visit.aggregate(top({ ...porTipo('agent'), botName: { $ne: null } }, 'botName', 10)),
            Visit.aggregate(top({ ...matchStage, visitorType: { $ne: 'agent' } }, 'path', 10)),
            Visit.aggregate(top({ ...humanos, browser: { $ne: null } }, 'browser')),
            Visit.aggregate(top(humanos, 'deviceType')),
            Visit.aggregate(top({ ...matchStage, country: { $ne: null } }, 'country', 15)),

            Visit.find(matchStage)
                .sort({ timestamp: -1 })
                .limit(20)
                .select('timestamp path visitorType botName browser deviceType country')
                .lean(),

            // Desde cuándo rige la clasificación nueva (primer registro con visitorId).
            Visit.findOne({ site, visitorId: { $ne: null } }).sort({ timestamp: 1 }).select('timestamp').lean(),
        ]);

        const count = (...tipos: string[]) =>
            (byType as Counted[]).filter((t) => tipos.includes(t._id)).reduce((n, t) => n + t.count, 0);

        type Day = { date: string; human: number; ai_crawler: number; other_bot: number; agent: number };
        const dayMap: Record<string, Day> = {};
        for (const entry of visitsByDay) {
            const date = entry._id.date as string;
            dayMap[date] ??= { date, human: 0, ai_crawler: 0, other_bot: 0, agent: 0 };
            const tipo = entry._id.visitorType === 'bot' ? 'ai_crawler' : (entry._id.visitorType as keyof Omit<Day, 'date'>);
            if (tipo in dayMap[date]) dayMap[date][tipo] += entry.count;
        }
        const dailyData = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

        const crawlerCount = count(...CRAWLER_TYPES);

        return NextResponse.json({
            totalVisits,
            uniquePeople: personasPorDia[0]?.n ?? 0,
            humanCount: count('human'),
            // `botCount` se mantiene por compatibilidad con el iframe de WordPress.
            botCount: crawlerCount,
            crawlerCount,
            otherBotCount: count('other_bot'),
            agentCount: count('agent'),
            v2Since: v2Since ? (v2Since as unknown as { timestamp: Date }).timestamp : null,
            countryCount: countries.length,
            dailyData,
            topAgents: (topAgents as Counted[]).map((a) => ({ name: a._id, count: a.count })),
            topBots: (topBots as Counted[]).map((b) => ({ name: b._id, count: b.count })),
            topPages: (topPages as Counted[]).map((p) => ({ path: p._id, count: p.count })),
            browsers: (browsers as Counted[]).map((b) => ({ name: b._id, count: b.count })),
            devices: (devices as Counted[]).map((d) => ({ type: d._id, count: d.count })),
            countries: (countries as Counted[]).map((c) => ({ code: c._id, count: c.count })),
            recentVisits,
        });
    } catch (error) {
        logger.error('Error fetching tracker data:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
