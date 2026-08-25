import type { QueryFilter } from 'mongoose';
import { connectDB } from './mongodb';
import Idea, { IIdea } from './models/Idea';

/**
 * Tipo que representa una idea guardada en formato serializable
 * Usado para transferir datos entre servidor y cliente
 */
export type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category: 'user' | 'bisociation';
    /** En la DB es deletionAttempts, pero en la App lo llamamos highlightCount */
    highlightCount: number;
    comments: Array<{
        text: string;
        createdAt: string;
    }>;
    /** Presente solo en ideas importadas (ej. desde Google Tasks) */
    source?: 'google-tasks';
    /** Texto crudo original de la fuente (ej. la entrada del Task) */
    originalText?: string;
    /** Ideas parecidas ya existentes; se muestra como marca, no filtra */
    similarTo?: Array<{ ideaId: string; text: string; similarity: number }>;
};

/**
 * Convierte un documento de Mongoose a un objeto SavedIdea serializable
 */
function toSavedIdea(doc: IIdea | Record<string, unknown>): SavedIdea {
    const d = doc as Record<string, unknown>;
    const id = (d._id as { toString(): string }).toString();

    const comments = Array.isArray(d.comments)
        ? d.comments.map((c: any) => ({
            text: c.text,
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt
        }))
        : [];

    return {
        id,
        text: d.text as string,
        createdAt: d.createdAt instanceof Date
            ? d.createdAt.toISOString()
            : d.createdAt as string,
        category: d.category as 'user' | 'bisociation',
        highlightCount: (d.deletionAttempts as number) || 0,
        comments,
        ...(d.source ? { source: d.source as 'google-tasks' } : {}),
        ...(d.originalText ? { originalText: d.originalText as string } : {}),
        ...(Array.isArray(d.similarTo) && d.similarTo.length
            ? {
                similarTo: (d.similarTo as any[]).map((s) => ({
                    ideaId: s.ideaId ? String(s.ideaId) : '',
                    text: s.text as string,
                    similarity: s.similarity as number,
                })),
            }
            : {}),
    };
}

/**
 * Trae un corpus de ideas con embedding para comparación de similitud:
 * las públicas más las privadas del propio usuario. Limitado a las más
 * recientes para acotar memoria/tiempo (el marcado de parecidas es best-effort).
 */
export async function getSimilarityCorpus(
    userId: string,
    limit = 500
): Promise<Array<{ id: string; text: string; embedding: number[] }>> {
    await connectDB();
    const docs = await Idea.find({
        embedding: { $exists: true, $ne: [] },
        $or: [{ userId: null }, { userId }],
    })
        .select('text embedding')   // embedding es select:false; inclusión explícita lo trae
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

    return docs
        .filter((d: any) => Array.isArray(d.embedding) && d.embedding.length)
        .map((d: any) => ({ id: String(d._id), text: d.text as string, embedding: d.embedding as number[] }));
}

/**
 * Guarda una idea privada importada (ej. desde Google Tasks) con todos sus
 * metadatos de origen. A diferencia de savePrivateIdea, persiste embedding,
 * texto original, fuente y las ideas parecidas detectadas.
 */
export async function savePrivateIdeaFromTask(params: {
    text: string;
    originalText?: string;
    userId: string;
    embedding?: number[];
    similarTo?: Array<{ ideaId: string; text: string; similarity: number }>;
}): Promise<SavedIdea> {
    const trimmed = params.text.trim();
    if (!trimmed) throw new Error('La idea no puede estar vacía');

    await connectDB();
    const idea = await Idea.create({
        text: trimmed.slice(0, 1500),
        category: 'user',
        userId: params.userId,
        source: 'google-tasks',
        originalText: params.originalText,
        embedding: params.embedding,
        similarTo: params.similarTo && params.similarTo.length ? params.similarTo : undefined,
    });
    return toSavedIdea(idea);
}

/**
 * Filtro canónico de «idea pública»: sin dueño, y fuera de los espacios privado
 * y de organización.
 *
 * Vive en una sola constante a propósito. Había dos copias sueltas a las que les
 * faltaba la parte del `scope`, así que una idea de organización guardada sin
 * `userId` (lo que hace `saveOrganizationIdea` cuando no recibe uno) se colaba
 * al banco público: una al filtrar por categoría y otra al buscar por texto.
 */
const SOLO_PUBLICAS: QueryFilter<IIdea> = {
    $or: [{ userId: null }, { userId: { $exists: false } }],
    $nor: [{ 'scope.type': 'organization' }, { 'scope.type': 'private' }],
};

/** Cuántas ideas trae una página del banco. */
export const IDEAS_POR_PAGINA = 60;

/** Techo duro por consulta: ningún llamador puede pedir la colección entera. */
const MAX_POR_CONSULTA = 200;

export type OpcionesDePagina = {
    /** Cuántas traer (por defecto IDEAS_POR_PAGINA, tope MAX_POR_CONSULTA) */
    limit?: number;
    /** Cuántas saltar desde la más reciente */
    skip?: number;
    /** Filtrar por categoría; sin esto vienen las dos mezcladas */
    category?: 'user' | 'bisociation';
};

/**
 * Obtiene una página de ideas públicas, de la más reciente a la más vieja.
 *
 * Antes devolvía la colección entera en cada carga de /banco: 897 ideas públicas
 * en agosto de 2026 (de 1509 documentos en la colección), y creciendo sin techo.
 * Ahora siempre hay límite: para contar está `countPublicIdeas`, y para las
 * agregadas `getPublicIdeaStats`.
 *
 * @example
 * ```typescript
 * const primeraPagina = await getIdeas({ category: 'user' });
 * const segunda = await getIdeas({ category: 'user', skip: IDEAS_POR_PAGINA });
 * ```
 */
export async function getIdeas(options: OpcionesDePagina = {}): Promise<SavedIdea[]> {
    const limit = Math.min(Math.max(options.limit ?? IDEAS_POR_PAGINA, 1), MAX_POR_CONSULTA);
    const skip = Math.max(options.skip ?? 0, 0);

    try {
        await connectDB();

        const ideas = await Idea.find({
            ...SOLO_PUBLICAS,
            ...(options.category ? { category: options.category } : {}),
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();

        return ideas.map(idea => toSavedIdea(idea));
    } catch (error) {
        console.error('Error fetching ideas:', error);
        // Retornar array vacío en lugar de lanzar error para no romper la UI
        return [];
    }
}

/**
 * Cuenta ideas públicas sin traerlas. Es lo que necesita el «cargar más» para
 * saber si quedan.
 */
export async function countPublicIdeas(category?: 'user' | 'bisociation'): Promise<number> {
    try {
        await connectDB();
        return await Idea.countDocuments({
            ...SOLO_PUBLICAS,
            ...(category ? { category } : {}),
        });
    } catch (error) {
        console.error('Error counting ideas:', error);
        return 0;
    }
}

/**
 * Las ideas resaltadas (deletionAttempts > 0), de más a menos.
 *
 * La tarjeta sepia del banco las sacaba filtrando la lista completa en el
 * cliente; con paginación esa lista ya no está entera, así que la consulta la
 * hace la base.
 */
export async function getHighlightedIdeas(limit = 20): Promise<SavedIdea[]> {
    try {
        await connectDB();

        const ideas = await Idea.find({ ...SOLO_PUBLICAS, deletionAttempts: { $gt: 0 } })
            .sort({ deletionAttempts: -1, createdAt: -1 })
            .limit(Math.min(Math.max(limit, 1), MAX_POR_CONSULTA))
            .lean()
            .exec();

        return ideas.map(idea => toSavedIdea(idea));
    } catch (error) {
        console.error('Error fetching highlighted ideas:', error);
        return [];
    }
}

/**
 * Busca una idea pública por su id. Reemplaza al `getIdeas().find(...)` de
 * /api/agent, que traía la colección entera para quedarse con un documento.
 */
export async function getPublicIdeaById(id: string): Promise<SavedIdea | null> {
    // Un id con forma inválida haría tirar a Mongoose un CastError. Eso no es un
    // fallo del servidor —es que no existe—, así que se descarta antes de
    // consultar y no ensucia los logs.
    if (!/^[a-f\d]{24}$/i.test(id)) return null;

    try {
        await connectDB();

        const idea = await Idea.findOne({ _id: id, ...SOLO_PUBLICAS }).lean().exec();
        return idea ? toSavedIdea(idea) : null;
    } catch (error) {
        console.error('Error fetching idea by id:', error);
        return null;
    }
}

/**
 * Totales del banco público, resueltos con contadores y dos documentos, en vez de
 * traerse las ideas enteras para contarlas en memoria.
 */
export async function getPublicIdeaStats(): Promise<{
    total: number;
    user: number;
    bisociation: number;
    newest: string | null;
    oldest: string | null;
}> {
    try {
        await connectDB();

        const [user, bisociation, newestDoc, oldestDoc] = await Promise.all([
            Idea.countDocuments({ ...SOLO_PUBLICAS, category: 'user' }),
            Idea.countDocuments({ ...SOLO_PUBLICAS, category: 'bisociation' }),
            Idea.findOne(SOLO_PUBLICAS).sort({ createdAt: -1 }).select('createdAt').lean().exec(),
            Idea.findOne(SOLO_PUBLICAS).sort({ createdAt: 1 }).select('createdAt').lean().exec(),
        ]);

        const fecha = (doc: unknown): string | null => {
            const value = (doc as { createdAt?: Date } | null)?.createdAt;
            return value instanceof Date ? value.toISOString() : null;
        };

        return {
            total: user + bisociation,
            user,
            bisociation,
            newest: fecha(newestDoc),
            oldest: fecha(oldestDoc),
        };
    } catch (error) {
        console.error('Error fetching idea stats:', error);
        return { total: 0, user: 0, bisociation: 0, newest: null, oldest: null };
    }
}

/**
 * Guarda una nueva idea en la base de datos
 * 
 * @param text - Contenido textual de la idea (1-2000 caracteres)
 * @param category - Categoría de la idea (default: 'user')
 * @returns Promise con la idea guardada
 * @throws Error si no se puede guardar la idea
 * 
 * @example
 * ```typescript
 * const idea = await saveIdea('Mi nueva idea', 'user');
 * console.log(idea.id); // ID de MongoDB
 * ```
 */
export async function saveIdea(
    text: string,
    category: 'user' | 'bisociation' = 'user'
): Promise<SavedIdea> {
    // Validación de entrada
    if (!text || typeof text !== 'string') {
        throw new Error('El texto de la idea es requerido y debe ser un string');
    }

    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
        throw new Error('La idea no puede estar vacía');
    }

    if (trimmedText.length > 1500) {
        throw new Error('La idea no puede exceder 1500 caracteres');
    }

    try {
        await connectDB();
        const idea = await Idea.create({ text: trimmedText, category });
        return toSavedIdea(idea);
    } catch (error) {
        console.error('Error saving idea:', error);

        // Mensaje de error más específico según el tipo de error
        if (error instanceof Error && error.message.includes('validation')) {
            throw new Error(`Validación fallida: ${error.message}`);
        }

        throw new Error('No se pudo guardar la idea. Por favor intenta de nuevo.');
    }
}

/**
 * Guarda múltiples ideas en una sola operación (batch insert)
 * Útil para guardar bisociaciones generadas por IA
 * 
 * @param ideas - Array de objetos con text y category
 * @returns Promise con array de ideas guardadas
 * @throws Error si no se pueden guardar las ideas
 * 
 * @example
 * ```typescript
 * const bisociations = [
 *   { text: 'Idea 1', category: 'bisociation' as const },
 *   { text: 'Idea 2', category: 'bisociation' as const }
 * ];
 * const saved = await saveIdeas(bisociations);
 * ```
 */
export async function saveIdeas(
    ideas: Array<{ text: string; category: 'user' | 'bisociation' }>
): Promise<SavedIdea[]> {
    // Validación de entrada
    if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error('Se requiere un array no vacío de ideas');
    }

    // Validar cada idea
    const validatedIdeas = ideas.map((idea, index) => {
        if (!idea.text || typeof idea.text !== 'string') {
            throw new Error(`Idea en posición ${index}: texto requerido`);
        }

        const trimmedText = idea.text.trim();

        if (trimmedText.length === 0) {
            throw new Error(`Idea en posición ${index}: no puede estar vacía`);
        }

        if (trimmedText.length > 2000) {
            throw new Error(`Idea en posición ${index}: excede 2000 caracteres`);
        }

        return {
            text: trimmedText,
            category: idea.category
        };
    });

    try {
        await connectDB();
        const savedIdeas = await Idea.insertMany(validatedIdeas);
        return savedIdeas.map(idea => toSavedIdea(idea));
    } catch (error) {
        console.error('Error saving multiple ideas:', error);
        throw new Error('No se pudieron guardar las ideas. Por favor intenta de nuevo.');
    }
}

/**
 * Borra una idea pública por ID (solo admin)
 */
export async function deletePublicIdea(id: string): Promise<boolean> {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return false;

    try {
        await connectDB();
        const result = await Idea.findByIdAndDelete(id);
        return !!result;
    } catch (error) {
        console.error('Error deleting public idea:', error);
        return false;
    }
}

/**
 * Registra un resaltado para una idea (incrementa contador)
 */
export async function highlightIdea(id: string): Promise<boolean> {
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return false;
    }

    try {
        await connectDB();
        const result = await Idea.findByIdAndUpdate(
            id,
            { $inc: { deletionAttempts: 1 } },
            { new: true }
        );
        return !!result;
    } catch (error) {
        console.error('Error recording highlight:', error);
        return false;
    }
}

/**
 * Añade un comentario a una idea
 */
export async function addComment(id: string, text: string): Promise<boolean> {
    if (!id || !text || !/^[0-9a-fA-F]{24}$/.test(id)) return false;

    try {
        await connectDB();
        const result = await Idea.findByIdAndUpdate(
            id,
            {
                $push: {
                    comments: {
                        text: text.trim(),
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );
        return !!result;
    } catch (error) {
        console.error('Error adding comment:', error);
        return false;
    }
}

/**
 * Cuenta el número total de ideas en la base de datos
 * 
 * @param category - Opcional: filtrar por categoría
 * @returns Promise<number> - Número de ideas
 * 
 * @example
 * ```typescript
 * const total = await countIdeas();
 * const userIdeas = await countIdeas('user');
 * ```
 */
export async function countIdeas(
    category?: 'user' | 'bisociation'
): Promise<number> {
    try {
        await connectDB();
        const filter = category ? { category } : {};
        return await Idea.countDocuments(filter);
    } catch (error) {
        console.error('Error counting ideas:', error);
        return 0;
    }
}

/**
 * Busca ideas por palabras clave usando regex case-insensitive
 * 
 * @param query - Texto a buscar en el campo text
 * @returns Promise con array de ideas que coinciden
 * 
 * @example
 * ```typescript
 * const results = await searchIdeasByKeywords('blockchain');
 * console.log(results.length); // Número de ideas que contienen "blockchain"
 * ```
 */
export async function searchIdeasByKeywords(query: string): Promise<SavedIdea[]> {
    if (!query || typeof query !== 'string') {
        throw new Error('El query es requerido y debe ser un string');
    }

    const trimmed = query.trim();

    if (trimmed.length === 0) {
        throw new Error('El query no puede estar vacío');
    }

    if (trimmed.length > 200) {
        throw new Error('El query no puede exceder 200 caracteres');
    }

    try {
        await connectDB();

        // Dividir el query en palabras y limpiar espacios
        const words = trimmed.split(/\s+/).filter(w => w.length > 0);

        if (words.length === 0) return [];

        // Escapar caracteres especiales de regex y unir con | (OR)
        const regexPattern = words
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|');

        // Búsqueda case-insensitive con regex (OR logic) - solo ideas públicas
        const ideas = await Idea.find({
            ...SOLO_PUBLICAS,
            text: { $regex: regexPattern, $options: 'i' },
        })
            .sort({ createdAt: -1 })
            .limit(10) // Limitar a 10 resultados
            .lean()
            .exec();

        return ideas.map(idea => toSavedIdea(idea));

    } catch (error) {
        console.error('Error searching ideas by keywords:', error);
        return [];
    }
}

// =============================================
// Funciones para ideas privadas (con userId)
// =============================================

/**
 * Obtiene todas las ideas de un usuario específico
 */
export async function getUserIdeas(userId: string): Promise<SavedIdea[]> {
    try {
        await connectDB();
        const ideas = await Idea.find({ userId, $nor: [{ 'scope.type': 'organization' }] })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return ideas.map(idea => toSavedIdea(idea));
    } catch (error) {
        console.error('Error fetching user ideas:', error);
        return [];
    }
}

/**
 * Guarda una idea privada con userId
 */
export async function savePrivateIdea(
    text: string,
    category: 'user' | 'bisociation',
    userId: string
): Promise<SavedIdea> {
    if (!text || typeof text !== 'string') {
        throw new Error('El texto de la idea es requerido');
    }
    const trimmedText = text.trim();
    if (trimmedText.length === 0) throw new Error('La idea no puede estar vacía');
    if (trimmedText.length > 1500) throw new Error('La idea no puede exceder 1500 caracteres');

    try {
        await connectDB();
        const idea = await Idea.create({ text: trimmedText, category, userId });
        return toSavedIdea(idea);
    } catch (error) {
        console.error('Error saving private idea:', error);
        throw new Error('No se pudo guardar la idea.');
    }
}

/**
 * Guarda múltiples ideas privadas (bisociaciones) con userId
 */
export async function savePrivateIdeas(
    ideas: Array<{ text: string; category: 'user' | 'bisociation' }>,
    userId: string
): Promise<SavedIdea[]> {
    if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error('Se requiere un array no vacío de ideas');
    }

    const validatedIdeas = ideas.map((idea, index) => {
        if (!idea.text || typeof idea.text !== 'string') {
            throw new Error(`Idea en posición ${index}: texto requerido`);
        }
        const trimmedText = idea.text.trim();
        if (trimmedText.length === 0) throw new Error(`Idea en posición ${index}: vacía`);
        if (trimmedText.length > 2000) throw new Error(`Idea en posición ${index}: excede 2000 caracteres`);
        return { text: trimmedText, category: idea.category, userId };
    });

    try {
        await connectDB();
        const savedIdeas = await Idea.insertMany(validatedIdeas);
        return savedIdeas.map(idea => toSavedIdea(idea));
    } catch (error) {
        console.error('Error saving private ideas:', error);
        throw new Error('No se pudieron guardar las ideas.');
    }
}

/**
 * Busca ideas de un usuario por palabras clave
 */
export async function searchUserIdeasByKeywords(query: string, userId: string): Promise<SavedIdea[]> {
    if (!query || typeof query !== 'string') throw new Error('Query requerido');
    const trimmed = query.trim();
    if (trimmed.length === 0) throw new Error('Query vacío');
    if (trimmed.length > 200) throw new Error('Query excede 200 caracteres');

    try {
        await connectDB();
        const words = trimmed.split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return [];

        const regexPattern = words
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|');

        const ideas = await Idea.find({
            text: { $regex: regexPattern, $options: 'i' },
            userId
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
            .exec();

        return ideas.map(idea => toSavedIdea(idea));
    } catch (error) {
        console.error('Error searching user ideas:', error);
        return [];
    }
}

/**
 * Borra una idea privada (verificando ownership)
 */
export async function deletePrivateIdea(id: string, userId: string): Promise<boolean> {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return false;

    try {
        await connectDB();
        const result = await Idea.findOneAndDelete({ _id: id, userId });
        return !!result;
    } catch (error) {
        console.error('Error deleting private idea:', error);
        return false;
    }
}

/**
 * Highlight una idea privada (verificando ownership)
 */
export async function highlightPrivateIdea(id: string, userId: string): Promise<boolean> {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return false;

    try {
        await connectDB();
        const result = await Idea.findOneAndUpdate(
            { _id: id, userId },
            { $inc: { deletionAttempts: 1 } },
            { new: true }
        );
        return !!result;
    } catch (error) {
        console.error('Error highlighting private idea:', error);
        return false;
    }
}

/**
 * Añade un comentario a una idea privada (verificando ownership)
 */
export async function addPrivateComment(id: string, text: string, userId: string): Promise<boolean> {
    if (!id || !text || !/^[0-9a-fA-F]{24}$/.test(id)) return false;

    try {
        await connectDB();
        const result = await Idea.findOneAndUpdate(
            { _id: id, userId },
            { $push: { comments: { text: text.trim(), createdAt: new Date() } } },
            { new: true }
        );
        return !!result;
    } catch (error) {
        console.error('Error adding private comment:', error);
        return false;
    }
}

// =============================================
// Funciones para ideas organizacionales (Enterprise)
// =============================================

/**
 * Obtiene todas las ideas de una organización específica
 */
export async function getOrganizationIdeas(organizationId: string): Promise<SavedIdea[]> {
    try {
        await connectDB();
        const ideas = await Idea.find({
            'scope.type': 'organization',
            'scope.organizationId': organizationId
        })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return ideas.map(idea => toSavedIdea(idea));
    } catch (error) {
        console.error('Error fetching organization ideas:', error);
        return [];
    }
}

/**
 * Guarda una idea organizacional
 */
export async function saveOrganizationIdea(
    text: string,
    category: 'user' | 'bisociation',
    organizationId: string,
    userId?: string
): Promise<SavedIdea> {
    if (!text || typeof text !== 'string') {
        throw new Error('El texto de la idea es requerido');
    }
    const trimmedText = text.trim();
    if (trimmedText.length === 0) throw new Error('La idea no puede estar vacía');
    if (trimmedText.length > 1500) throw new Error('La idea no puede exceder 1500 caracteres');

    try {
        await connectDB();
        const idea = await Idea.create({
            text: trimmedText,
            category,
            userId: userId || null,
            scope: {
                type: 'organization',
                organizationId
            }
        });
        return toSavedIdea(idea);
    } catch (error) {
        console.error('Error saving organization idea:', error);
        throw new Error('No se pudo guardar la idea de la organización.');
    }
}
