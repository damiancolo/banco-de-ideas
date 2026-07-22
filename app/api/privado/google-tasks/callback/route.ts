import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isOwnerEmail } from '@/lib/owner';
import { connectDB } from '@/lib/mongodb';
import GoogleToken from '@/lib/models/GoogleToken';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * Callback del consent incremental de Google Tasks. Intercambia el code por
 * tokens y los guarda en google_tokens para el owner. Vuelve a /privado.
 */
export async function GET(request: Request) {
    const session = await auth().catch(() => null);
    const userId = session?.user?.id;
    if (!userId || !isOwnerEmail(session?.user?.email)) {
        return NextResponse.json({ error: 'No disponible' }, { status: 403 });
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const cookieState = request.headers
        .get('cookie')
        ?.split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('gtasks_oauth_state='))
        ?.split('=')[1];

    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    const origin = `${proto}://${host}`;

    if (url.searchParams.get('error')) {
        return NextResponse.redirect(`${origin}/privado?tasks=denied`);
    }
    if (!code || !state || !cookieState || state !== cookieState) {
        return NextResponse.redirect(`${origin}/privado?tasks=error`);
    }

    try {
        const clientId = process.env.AUTH_GOOGLE_ID!;
        const clientSecret = process.env.AUTH_GOOGLE_SECRET!;
        const redirectUri = `${origin}/api/privado/google-tasks/callback`;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenRes.ok) {
            logger.error('Google Tasks token exchange failed:', await tokenRes.text().catch(() => ''));
            return NextResponse.redirect(`${origin}/privado?tasks=error`);
        }

        const data = (await tokenRes.json()) as {
            access_token: string;
            refresh_token?: string;
            expires_in: number;
            scope?: string;
        };

        await connectDB();
        const update: Record<string, unknown> = {
            userId,
            accessToken: data.access_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
            scope: data.scope,
        };
        if (data.refresh_token) update.refreshToken = data.refresh_token;

        await GoogleToken.updateOne({ userId }, { $set: update }, { upsert: true });

        const res = NextResponse.redirect(`${origin}/privado?tasks=connected`);
        res.cookies.delete('gtasks_oauth_state');
        return res;
    } catch (err) {
        logger.error('Google Tasks callback error:', err);
        return NextResponse.redirect(`${origin}/privado?tasks=error`);
    }
}
