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
        comments
    };
}

/**
 * Obtiene todas las ideas ordenadas por fecha descendente (más recientes primero)
 * 
 * @returns Promise con array de ideas o array vacío en caso de error
 * 
 * @example
 * ```typescript
 * const ideas = await getIdeas();
 * console.log(ideas.length); // Número total de ideas
 * ```
 */
export async function getIdeas(): Promise<SavedIdea[]> {
    try {
        await connectDB();

        const ideas = await Idea.find({
            $or: [{ userId: null }, { userId: { $exists: false } }],
            $nor: [{ 'scope.type': 'organization' }, { 'scope.type': 'private' }]
        })
            .sort({ createdAt: -1 })
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
 * Obtiene ideas filtradas por categoría, ordenadas por fecha descendente
 * 
 * @param category - Categoría a filtrar: 'user' o 'bisociation'
 * @returns Promise con array de ideas filtradas
 * 
 * @example
 * ```typescript
 * const userIdeas = await getIdeasByCategory('user');
 * const aiIdeas = await getIdeasByCategory('bisociation');
 * ```
 */
export async function getIdeasByCategory(
    category: 'user' | 'bisociation'
): Promise<SavedIdea[]> {
    try {
        await connectDB();

        const ideas = await Idea.find({ category, $or: [{ userId: null }, { userId: { $exists: false } }] })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return ideas.map(idea => toSavedIdea(idea));
    } catch (error) {
        console.error(`Error fetching ${category} ideas:`, error);
        return [];
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
            text: { $regex: regexPattern, $options: 'i' },
            $or: [{ userId: null }, { userId: { $exists: false } }]
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
