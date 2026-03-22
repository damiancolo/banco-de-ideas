import { handlers } from '@/auth';
import { NextRequest } from 'next/server';
import { getMongoClient } from '@/lib/auth-client';

// Wrap GET to log callback errors to MongoDB for debugging
async function loggedGET(req: NextRequest) {
    const url = new URL(req.url);
    const isCallback = url.pathname.includes('/callback/');

    if (isCallback) {
        // Log what Google sent us
        const params: Record<string, string> = {};
        url.searchParams.forEach((v, k) => { params[k] = k === 'code' ? v.substring(0, 10) + '...' : v; });

        try {
            const client = await getMongoClient();
            const db = client.db();
            await db.collection('auth_errors').insertOne({
                ts: new Date(),
                type: 'callback_received',
                error: null,
                details: {
                    params,
                    cookies: req.cookies.getAll().map(c => c.name),
                    url: url.pathname + '?' + url.searchParams.toString().substring(0, 200),
                },
            });
        } catch { /* ignore logging errors */ }
    }

    try {
        return await handlers.GET(req);
    } catch (err) {
        // Log the error to MongoDB
        try {
            const client = await getMongoClient();
            const db = client.db();
            await db.collection('auth_errors').insertOne({
                ts: new Date(),
                type: 'callback_error',
                error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack?.substring(0, 500) } : String(err),
                details: {
                    cause: err instanceof Error && err.cause ? (err.cause instanceof Error ? { name: err.cause.name, message: err.cause.message } : String(err.cause)) : null,
                    url: url.pathname,
                },
            });
        } catch { /* ignore logging errors */ }
        throw err;
    }
}

export { loggedGET as GET };
export const { POST } = handlers;
