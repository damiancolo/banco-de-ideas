import { ObjectId } from 'mongodb';
import { Resend } from 'resend';
import { getMongoClient } from '@/lib/auth-client';
import { OWNER_EMAIL } from '@/lib/owner';

/**
 * Aviso por mail al administrador cada vez que OTRA persona publica una idea.
 *
 * Privacidad, por diseño:
 * - Ningún mail lleva datos del autor (nombre, email, id), ni siquiera en las públicas.
 * - Privada y Enterprise: sólo el aviso y la fecha/hora. Sin texto, título, id
 *   de la idea ni nombre de organización.
 *
 * Nunca lanza: si falta configuración o el envío falla, loguea y vuelve. La
 * publicación de la idea no puede depender de que salga un mail.
 */

export type NotifiableIdea = {
    id: string;
    text: string;
    createdAt: string | Date;
    /** Tipo de espacio donde se guardó. `organization` es el entorno Enterprise. */
    scope: 'public' | 'private' | 'organization';
};

const TIMEZONE = 'Europe/Madrid';
const TITLE_MAX = 60;
const COLOR_BG = '#faf8f3';
const COLOR_ACCENT = '#7a1a2e';

/**
 * Remitente de pruebas de Resend: funciona sin verificar dominio, pero sólo
 * entrega al email dueño de la cuenta de Resend. Para producción, definir
 * NOTIFY_EMAIL_FROM con un dominio verificado.
 */
const DEFAULT_FROM = 'Banco de Ideas <onboarding@resend.dev>';

/**
 * Configuración con respaldo: la API key también se acepta como `RESEND` (así
 * quedó guardada en Vercel), y destinatario/admin caen en el owner del proyecto.
 */
function config() {
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
    return {
        apiKey: process.env.RESEND_API_KEY || process.env.RESEND,
        to: process.env.NOTIFY_EMAIL_TO || OWNER_EMAIL,
        from: process.env.NOTIFY_EMAIL_FROM || DEFAULT_FROM,
        adminUserId: process.env.ADMIN_USER_ID?.trim(),
        adminEmail: (process.env.ADMIN_EMAIL || OWNER_EMAIL).trim().toLowerCase(),
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || vercelUrl,
    };
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    const valid = Number.isNaN(date.getTime()) ? new Date() : date;
    return new Intl.DateTimeFormat('es-ES', {
        timeZone: TIMEZONE,
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(valid) + ' (hora de Madrid)';
}

/** Las ideas no tienen título propio: se usa la primera línea del texto. */
function titleOf(text: string): string {
    const firstLine = text.trim().split('\n')[0].trim();
    return firstLine.length > TITLE_MAX
        ? firstLine.slice(0, TITLE_MAX - 1).trimEnd() + '…'
        : firstLine;
}

/**
 * No hay una página por idea en el sitio; el único enlace directo y público a
 * una idea concreta es la lectura por id de la API de agentes.
 */
function publicIdeaUrl(ideaId: string): string | null {
    const base = config().siteUrl?.trim().replace(/\/+$/, '');
    if (!base) return null;
    return `${base}/api/agent?action=get&id=${encodeURIComponent(ideaId)}`;
}

async function emailOfUser(userId: string): Promise<string | null> {
    if (!ObjectId.isValid(userId)) return null;
    const client = await getMongoClient();
    const user = await client
        .db()
        .collection('users')
        .findOne({ _id: new ObjectId(userId) }, { projection: { email: 1 } });
    return typeof user?.email === 'string' ? user.email : null;
}

async function isAdmin(authorUserId: string | null | undefined): Promise<boolean> {
    if (!authorUserId) return false;

    const { adminUserId, adminEmail } = config();
    if (adminUserId && authorUserId === adminUserId) return true;

    if (adminEmail) {
        const email = await emailOfUser(authorUserId);
        if (email && email.trim().toLowerCase() === adminEmail) return true;
    }
    return false;
}

type Message = { subject: string; text: string; html: string };

function layout(heading: string, bodyHtml: string): string {
    return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:${COLOR_BG};font-family:Georgia,'Times New Roman',serif;color:#2b2b2b;">
  <div style="max-width:560px;margin:0 auto;">
    <h1 style="margin:0 0 16px;font-size:20px;color:${COLOR_ACCENT};">${heading}</h1>
    ${bodyHtml}
    <p style="margin:24px 0 0;font-size:12px;color:#888;">Banco de Ideas · aviso automático</p>
  </div>
</body>
</html>`;
}

function buildMessage(idea: NotifiableIdea): Message {
    const when = formatDate(idea.createdAt);

    if (idea.scope === 'organization') {
        const heading = 'Se publicó una idea en el entorno Enterprise';
        return {
            subject: 'Nueva idea en Enterprise',
            text: `${heading}\n\nFecha: ${when}\n`,
            html: layout(heading, `<p style="margin:0;">Fecha: ${escapeHtml(when)}</p>`),
        };
    }

    if (idea.scope === 'private') {
        const heading = 'Se publicó una idea privada';
        return {
            subject: 'Nueva idea privada publicada',
            text: `${heading}\n\nFecha: ${when}\n`,
            html: layout(heading, `<p style="margin:0;">Fecha: ${escapeHtml(when)}</p>`),
        };
    }

    const title = titleOf(idea.text);
    const url = publicIdeaUrl(idea.id);
    const heading = 'Se publicó una idea pública';

    const text = [
        heading,
        '',
        `Título: ${title}`,
        `Fecha: ${when}`,
        '',
        idea.text,
        '',
        url ? `Ver la idea: ${url}` : '',
    ].join('\n');

    const html = layout(
        heading,
        `<p style="margin:0 0 4px;font-weight:bold;">${escapeHtml(title)}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#666;">${escapeHtml(when)}</p>
    <div style="padding:16px;background:#fff;border-left:4px solid ${COLOR_ACCENT};white-space:pre-wrap;">${escapeHtml(idea.text)}</div>
    ${url ? `<p style="margin:16px 0 0;"><a href="${escapeHtml(url)}" style="color:${COLOR_ACCENT};">Ver la idea</a></p>` : ''}`
    );

    return { subject: `Nueva idea pública: ${title}`, text, html };
}

export async function notifyAdminNewIdea(
    idea: NotifiableIdea,
    authorUserId?: string | null
): Promise<void> {
    try {
        const { apiKey, to, from } = config();
        if (!apiKey) {
            console.warn('[notifyAdminNewIdea] Falta RESEND_API_KEY (o RESEND); no se envía aviso.');
            return;
        }

        if (await isAdmin(authorUserId)) return;

        const message = buildMessage(idea);
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
            from,
            to: to.split(',').map((s) => s.trim()).filter(Boolean),
            subject: message.subject,
            text: message.text,
            html: message.html,
        });
        if (error) {
            console.error('[notifyAdminNewIdea] Resend devolvió error:', error);
        }
    } catch (error) {
        console.error('[notifyAdminNewIdea] Error enviando aviso:', error);
    }
}
