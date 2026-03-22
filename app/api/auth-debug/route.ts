import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMongoClient } from '@/lib/auth-client';

export async function GET(req: NextRequest) {
    const checks: Record<string, string> = {};

    // Check 1: ENV vars
    checks.AUTH_SECRET = process.env.AUTH_SECRET ? 'SET' : 'MISSING';
    const gid = process.env.AUTH_GOOGLE_ID ?? '';
    const gsec = process.env.AUTH_GOOGLE_SECRET ?? '';
    checks.AUTH_GOOGLE_ID = gid ? `SET (${gid.length} chars, starts: ${gid.substring(0, 15)}...)` : 'MISSING';
    checks.AUTH_GOOGLE_SECRET = gsec ? `SET (${gsec.length} chars, starts: ${gsec.substring(0, 8)}...)` : 'MISSING';
    checks.MONGODB_URI = process.env.MONGODB_URI ? 'SET' : 'MISSING';
    checks.AUTH_URL = process.env.AUTH_URL ?? 'NOT SET';
    checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? 'NOT SET';

    // Check 2: Request info
    checks.REQUEST_URL = req.url;
    checks.HOST = req.headers.get('host') ?? 'unknown';
    checks.X_FORWARDED_HOST = req.headers.get('x-forwarded-host') ?? 'not set';
    checks.X_FORWARDED_PROTO = req.headers.get('x-forwarded-proto') ?? 'not set';

    // Check 3: MongoDB adapter connection
    try {
        const client = await getMongoClient();
        const db = client.db();
        checks.MONGODB_CONNECTION = 'OK';
        checks.MONGODB_DB_NAME = db.databaseName;

        const collections = await db.listCollections().toArray();
        const collNames = collections.map(c => c.name);
        checks.COLLECTIONS = collNames.join(', ');
        checks.HAS_USERS = collNames.includes('users') ? 'YES' : 'NO';
        checks.HAS_ACCOUNTS = collNames.includes('accounts') ? 'YES' : 'NO';

        // Check recent auth errors stored by our callback logger
        const errorsCol = db.collection('auth_errors');
        const recentErrors = await errorsCol.find().sort({ ts: -1 }).limit(5).toArray();
        checks.RECENT_AUTH_ERRORS = recentErrors.length > 0
            ? JSON.stringify(recentErrors.map(e => ({ ts: e.ts, error: e.error, details: e.details })))
            : 'none';
    } catch (err) {
        checks.MONGODB_CONNECTION = `ERROR: ${err instanceof Error ? err.message : 'unknown'}`;
    }

    // Check 4: Auth session
    try {
        const session = await auth();
        checks.SESSION = session ? JSON.stringify(session.user) : 'null (no session)';
    } catch (err) {
        checks.SESSION = `ERROR: ${err instanceof Error ? err.message : 'unknown'}`;
    }

    return NextResponse.json(checks, { status: 200 });
}
