import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interfaz que define la estructura de una Idea en la base de datos
 * Extiende Document de Mongoose para incluir métodos y propiedades de MongoDB
 */
export interface IIdea extends Document {
    /** Contenido textual de la idea */
    text: string;
    /** Categoría: 'user' para ideas del usuario, 'bisociation' para ideas generadas por IA */
    category: 'user' | 'bisociation';
    /** Fecha de creación (auto-generada por timestamps) */
    createdAt: Date;
    /** Fecha de última actualización (auto-generada por timestamps) */
    updatedAt: Date;
}

/**
 * Esquema de Mongoose para el modelo Idea
 * Define la estructura, validaciones e índices para la colección 'ideas'
 */
const IdeaSchema = new Schema<IIdea>(
    {
        text: {
            type: String,
            required: [true, 'El texto de la idea es requerido'],
            trim: true, // Eliminar espacios al inicio y final
            minlength: [1, 'La idea no puede estar vacía'],
            maxlength: [2000, 'La idea no puede exceder 2000 caracteres']
        },
        category: {
            type: String,
            enum: {
                values: ['user', 'bisociation'],
                message: 'La categoría debe ser "user" o "bisociation"'
            },
            default: 'user',
            required: true,
            index: true // Índice simple para filtrado rápido
        }
    },
    {
        timestamps: true, // Añade createdAt y updatedAt automáticamente
        collection: 'ideas' // Nombre explícito de la colección
    }
);

// Índices compuestos para optimizar queries comunes
// Índice para filtrar por categoría y ordenar por fecha (usado en getIdeasByCategory)
IdeaSchema.index({ category: 1, createdAt: -1 });

// Índice para ordenar todas las ideas por fecha (usado en getIdeas)
IdeaSchema.index({ createdAt: -1 });

// Índice de texto para búsqueda futura (opcional, comentado por ahora)
// IdeaSchema.index({ text: 'text' });

/**
 * Modelo de Mongoose para Ideas
 * Previene duplicación del modelo en hot-reload de Next.js
 * 
 * @example
 * ```typescript
 * // Crear una nueva idea
 * const idea = await Idea.create({ text: 'Mi idea', category: 'user' });
 * 
 * // Buscar ideas
 * const ideas = await Idea.find({ category: 'user' }).sort({ createdAt: -1 });
 * ```
 */
const Idea: Model<IIdea> = mongoose.models.Idea || mongoose.model<IIdea>('Idea', IdeaSchema);

export default Idea;
