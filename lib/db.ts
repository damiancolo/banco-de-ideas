import { connectDB } from './mongodb';
import Idea, { IIdea } from './models/Idea';

/**
 * Tipo que representa una idea guardada en formato serializable
 * Usado para transferir datos entre servidor y cliente
 */
export type SavedIdea = {
    /** ID único de MongoDB convertido a string */
    id: string;
    /** Contenido textual de la idea */
    text: string;
    /** Fecha de creación en formato ISO 8601 */
    createdAt: string;
    /** Categoría de la idea */
    category: 'user' | 'bisociation';
};

/**
 * Convierte un documento de Mongoose a un objeto SavedIdea serializable
 * 
 * @param doc - Documento de Mongoose (puede ser lean o no)
 * @returns Objeto SavedIdea con tipos primitivos
 * @private
 */
function toSavedIdea(doc: any): SavedIdea {
    return {
        id: doc._id.toString(),
        text: doc.text,
        createdAt: doc.createdAt instanceof Date
            ? doc.createdAt.toISOString()
            : doc.createdAt,
        category: doc.category
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

        const ideas = await Idea.find({})
            .sort({ createdAt: -1 })
            .lean() // Retorna objetos planos (más rápido)
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

        const ideas = await Idea.find({ category })
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

    if (trimmedText.length > 2000) {
        throw new Error('La idea no puede exceder 2000 caracteres');
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
 * Elimina una idea por su ID
 * 
 * @param id - ID de MongoDB de la idea a eliminar
 * @returns Promise<boolean> - true si se eliminó, false si no se encontró
 * 
 * @example
 * ```typescript
 * const deleted = await deleteIdea('507f1f77bcf86cd799439011');
 * if (deleted) {
 *   console.log('Idea eliminada');
 * }
 * ```
 */
export async function deleteIdea(id: string): Promise<boolean> {
    // Validación de entrada
    if (!id || typeof id !== 'string') {
        console.error('deleteIdea: ID inválido');
        return false;
    }

    // Validar que sea un ObjectId válido de MongoDB
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        console.error('deleteIdea: ID no es un ObjectId válido de MongoDB');
        return false;
    }

    try {
        await connectDB();
        const result = await Idea.findByIdAndDelete(id);
        return !!result;
    } catch (error) {
        console.error('Error deleting idea:', error);
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
