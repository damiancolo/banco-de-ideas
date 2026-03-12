import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Visit from '@/lib/models/Visit';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

function getDateFilter(range: string): Date | null {
    const now = new Date();
    switch (range) {
        case 'today': {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            return start;
        }
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case 'all':
        default:
            return null;
    }
}

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

        const [
            totalVisits,
            humanVsBots,
            visitsByDay,
            topBots,
            topPages,
            browsers,
            devices,
            countries,
            recentVisits,
        ] = await Promise.all([
            // 1. Total visits
            Visit.countDocuments(matchStage),

            // 2. Humans vs Bots
            Visit.aggregate([
                { $match: matchStage },
                { $group: { _id: '$visitorType', count: { $sum: 1 } } },
            ]),

            // 3. Visits by day
            Visit.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                            visitorType: '$visitorType',
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.date': 1 } },
            ]),

            // 4. Top bots
            Visit.aggregate([
                { $match: { ...matchStage, visitorType: 'bot', botName: { $ne: null } } },
                { $group: { _id: '$botName', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),

            // 5. Top pages
            Visit.aggregate([
                { $match: matchStage },
                { $group: { _id: '$path', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),

            // 6. Browsers
            Visit.aggregate([
                { $match: { ...matchStage, visitorType: 'human', browser: { $ne: null } } },
                { $group: { _id: '$browser', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // 7. Devices
            Visit.aggregate([
                { $match: { ...matchStage, visitorType: 'human' } },
                { $group: { _id: '$deviceType', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // 8. Countries
            Visit.aggregate([
                { $match: { ...matchStage, country: { $ne: null } } },
                { $group: { _id: '$country', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 15 },
            ]),

            // 9. Recent 20 visits
            Visit.find(matchStage)
                .sort({ timestamp: -1 })
                .limit(20)
                .select('timestamp path visitorType botName browser deviceType country')
                .lean(),
        ]);

        // Transform visitsByDay into a more usable format
        const dayMap: Record<string, { date: string; human: number; bot: number }> = {};
        for (const entry of visitsByDay) {
            const date = entry._id.date;
            if (!dayMap[date]) {
                dayMap[date] = { date, human: 0, bot: 0 };
            }
            dayMap[date][entry._id.visitorType as 'human' | 'bot'] = entry.count;
        }
        const dailyData = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

        // Transform humanVsBots
        const humanCount = humanVsBots.find((h: { _id: string }) => h._id === 'human')?.count || 0;
        const botCount = humanVsBots.find((h: { _id: string }) => h._id === 'bot')?.count || 0;

        return NextResponse.json({
            totalVisits,
            humanCount,
            botCount,
            countryCount: countries.length,
            dailyData,
            topBots: topBots.map((b: { _id: string; count: number }) => ({ name: b._id, count: b.count })),
            topPages: topPages.map((p: { _id: string; count: number }) => ({ path: p._id, count: p.count })),
            browsers: browsers.map((b: { _id: string; count: number }) => ({ name: b._id, count: b.count })),
            devices: devices.map((d: { _id: string; count: number }) => ({ type: d._id, count: d.count })),
            countries: countries.map((c: { _id: string; count: number }) => ({ code: c._id, count: c.count })),
            recentVisits,
        });
    } catch (error) {
        logger.error('Error fetching tracker data:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
