import { connectDB } from '@/lib/mongodb';
import GoogleToken from '@/lib/models/GoogleToken';
import { logger } from '@/lib/logger';

export interface GoogleTask {
    id: string;
    listId: string;
    title: string;
    notes?: string;
    due?: string;      // RFC3339; presente = acción agendada
    status?: string;
    updated?: string;
}

export class ReauthRequiredError extends Error {
    constructor(message = 'reauth') {
        super(message);
        this.name = 'ReauthRequiredError';
    }
}

/**
 * Devuelve un access_token válido para el usuario, refrescándolo contra Google
 * si expiró. Lanza ReauthRequiredError si no hay token guardado o el refresh falla
 * (el usuario debe cerrar sesión y volver a entrar para re-otorgar el scope).
 */
async function getValidAccessToken(userId: string): Promise<string> {
    await connectDB();
    const doc = await GoogleToken.findOne({ userId }).exec();
    if (!doc) throw new ReauthRequiredError('no-token');

    // 60s de margen para evitar usar un token a punto de expirar.
    const stillValid = doc.expiresAt && doc.expiresAt.getTime() - 60_000 > Date.now();
    if (stillValid) return doc.accessToken;

    if (!doc.refreshToken) throw new ReauthRequiredError('no-refresh-token');

    const clientId = process.env.AUTH_GOOGLE_ID;
    const clientSecret = process.env.AUTH_GOOGLE_SECRET;
    if (!clientId || !clientSecret) throw new Error('AUTH_GOOGLE_ID/SECRET no configurados');

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: doc.refreshToken,
        }),
    });

    if (!res.ok) {
        logger.error('Google token refresh failed:', await res.text().catch(() => ''));
        throw new ReauthRequiredError('refresh-failed');
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    doc.accessToken = data.access_token;
    doc.expiresAt = new Date(Date.now() + data.expires_in * 1000);
    await doc.save();
    return data.access_token;
}

async function fetchJson(url: string, token: string): Promise<any> {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) throw new ReauthRequiredError('unauthorized');
    if (!res.ok) throw new Error(`Google Tasks API ${res.status}: ${await res.text().catch(() => '')}`);
    return res.json();
}

/**
 * Lee TODAS las tasks de TODAS las listas del usuario (incluyendo completadas y ocultas).
 */
export async function listAllTasks(userId: string): Promise<GoogleTask[]> {
    const token = await getValidAccessToken(userId);

    const listsData = await fetchJson('https://tasks.googleapis.com/tasks/v1/users/@me/lists', token);
    const lists: Array<{ id: string }> = listsData.items || [];

    const all: GoogleTask[] = [];
    for (const list of lists) {
        let pageToken: string | undefined;
        do {
            const params = new URLSearchParams({
                showCompleted: 'true',
                showHidden: 'true',
                maxResults: '100',
            });
            if (pageToken) params.set('pageToken', pageToken);
            const data = await fetchJson(
                `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?${params}`,
                token
            );
            for (const t of (data.items || []) as any[]) {
                all.push({
                    id: t.id,
                    listId: list.id,
                    title: t.title || '',
                    notes: t.notes,
                    due: t.due,
                    status: t.status,
                    updated: t.updated,
                });
            }
            pageToken = data.nextPageToken;
        } while (pageToken);
    }
    return all;
}
