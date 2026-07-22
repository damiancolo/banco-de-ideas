/**
 * Email del owner del proyecto. Funciones y rutas exclusivas del owner
 * (ej. el importador de Google Tasks) se gatean contra este valor.
 */
export const OWNER_EMAIL = 'damianlafferranderie@gmail.com';

export function isOwnerEmail(email?: string | null): boolean {
    return !!email && email === OWNER_EMAIL;
}
