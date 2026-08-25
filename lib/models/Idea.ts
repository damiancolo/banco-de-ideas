import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interfaz que define la estructura de una Idea en la base de datos
 * Extiende Document de Mongoose para incluir métodos y propiedades de MongoDB
 */
export interface IComment {
    text: string;
    createdAt: Date;
}

export interface IIdeaScope {
    type: 'public' | 'private' | 'organization';
    userId?: string | null;                       // String (NextAuth JWT id)
    organizationId?: mongoose.Types.ObjectId | string | null;
}

/**
 * Interfaz que define la estructura de una Idea en la base de datos
 */
export interface ISimilarRef {
    ideaId: mongoose.Types.ObjectId | string;
    text: string;
    similarity: number;
}

export interface IIdea extends Document {
    text: string;
    category: 'user' | 'bisociation';
    embedding?: number[];
    deletionAttempts: number;
    comments: IComment[];
    userId?: string | null;
    scope: IIdeaScope;
    source?: 'google-tasks';                 // origen de la idea si fue importada
    originalText?: string;                    // texto crudo original (ej. entrada del Task)
    similarTo?: ISimilarRef[];                // ideas parecidas ya existentes (marcado, no filtro)
    createdAt: Date;
    updatedAt: Date;
}

// Nested schema for scope — needed because "type" is a reserved word in Mongoose
const IdeaScopeSchema = new Schema<IIdeaScope>(
    {
        type: {
            type: String,
            enum: ['public', 'private', 'organization'],
            required: true,
            default: 'public',
        },
        userId: {
            type: String,
            default: null,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            default: null,
        },
    },
    { _id: false }
);

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
            maxlength: [1500, 'La idea no puede exceder 1500 caracteres']
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
        },
        embedding: {
            type: [Number],
            required: false,
            select: false // No incluir por defecto en queries para ahorrar memoria
        },
        deletionAttempts: {
            type: Number,
            default: 0,
            required: true
        },
        userId: {
            type: String,
            default: null,
            index: true
        },
        comments: [{
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }],
        scope: {
            type: IdeaScopeSchema,
            default: () => ({ type: 'public' }),
        },
        source: {
            type: String,
            enum: ['google-tasks'],
            required: false,
        },
        originalText: {
            type: String,
            required: false,
        },
        similarTo: {
            type: [{
                ideaId: { type: Schema.Types.ObjectId, ref: 'Idea' },
                text: { type: String },
                similarity: { type: Number },
                _id: false,
            }],
            required: false,
            default: undefined,
        },
    },
    {
        timestamps: true, // Añade createdAt y updatedAt automáticamente
        collection: 'ideas' // Nombre explícito de la colección
    }
);

// Índices compuestos para optimizar queries comunes
// Índice para filtrar por categoría y ordenar por fecha (usado por getIdeas con category)
IdeaSchema.index({ category: 1, createdAt: -1 });

// Índice para ordenar todas las ideas por fecha (usado en getIdeas)
IdeaSchema.index({ createdAt: -1 });

// Índice compuesto para ideas privadas por usuario
IdeaSchema.index({ userId: 1, category: 1, createdAt: -1 });

// Índice para ideas organizacionales
IdeaSchema.index({ 'scope.type': 1, 'scope.organizationId': 1, createdAt: -1 });

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
