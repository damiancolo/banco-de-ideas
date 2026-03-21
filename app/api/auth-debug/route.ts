import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMongoClient } from '@/lib/auth-client';

export async function GET() {
    const checks: Record<string, string> = {};

    // Check 1: ENV vars
    checks.AUTH_SECRET = process.env.AUTH_SECRET ? 'SET' : 'MISSING';
    checks.AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID ? 'SET' : 'MISSING';
    checks.AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET ? 'SET' : 'MISSING';
    checks.MONGODB_URI = process.env.MONGODB_URI ? 'SET' : 'MISSING';

    // Check 2: MongoDB adapter connection
    try {
        const client = await getMongoClient();
        const db = client.db();
        checks.MONGODB_CONNECTION = 'OK';
        checks.MONGODB_DB_NAME = db.databaseName;

        // Check if auth collections exist
        const collections = await db.listCollections().toArray();
        const collNames = collections.map(c => c.name);
        checks.COLLECTIONS = collNames.join(', ');
        checks.HAS_USERS = collNames.includes('users') ? 'YES' : 'NO';
        checks.HAS_ACCOUNTS = collNames.includes('accounts') ? 'YES' : 'NO';
    } catch (err) {
        checks.MONGODB_CONNECTION = `ERROR: ${err instanceof Error ? err.message : 'unknown'}`;
    }

    // Check 3: Auth session
    try {
        const session = await auth();
        checks.SESSION = session ? JSON.stringify(session.user) : 'null (no session)';
    } catch (err) {
        checks.SESSION = `ERROR: ${err instanceof Error ? err.message : 'unknown'}`;
    }

    return NextResponse.json(checks, { status: 200 });
}
