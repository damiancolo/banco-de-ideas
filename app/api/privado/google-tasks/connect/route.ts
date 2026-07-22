import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isOwnerEmail } from '@/lib/owner';

export const runtime = 'nodejs';

/**
 * Autorización incremental: inicia el consent de Google SOLO para el scope
 * tasks.readonly. El login normal de la app no cambia; únicamente el owner
 * llega acá al usar "Importar del Task". Redirige a la pantalla de Google.
 */
export async function GET(request: Request) {
    const session = await auth().catch(() => null);
    if (!isOwnerEmail(session?.user?.email)) {
        return NextResponse.json({ error: 'No disponible' }, { status: 403 });
    }

    const clientId = process.env.AUTH_GOOGLE_ID;
    if (!clientId) {
        return NextResponse.json({ error: 'OAuth no configurado' }, { status: 500 });
    }

    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    const redirectUri = `${proto}://${host}/api/privado/google-tasks/callback`;

    const state = crypto.randomUUID();

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/tasks.readonly');
    authUrl.searchParams.set('access_type', 'offline');   // para obtener refresh_token
    authUrl.searchParams.set('prompt', 'consent');        // fuerza refresh_token
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', state);

    const res = NextResponse.redirect(authUrl.toString());
    // Cookie de estado para verificar el callback (CSRF).
    res.cookies.set('gtasks_oauth_state', state, {
        httpOnly: true,
        secure: proto === 'https',
        sameSite: 'lax',
        path: '/api/privado/google-tasks',
        maxAge: 600,
    });
    return res;
}
