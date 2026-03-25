import { auth } from '@/auth';

/**
 * Obtiene el ID del usuario autenticado o null.
 */
export async function getAuthUserId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id ?? null;
}

/**
 * Requiere autenticación. Lanza error si no hay sesión.
 * Retorna el userId.
 */
export async function requireAuth(): Promise<string> {
    const userId = await getAuthUserId();
    if (!userId) {
        throw new Error('UNAUTHORIZED');
    }
    return userId;
}
