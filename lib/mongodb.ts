import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

/**
 * Global cache para mantener la conexión entre hot reloads en desarrollo
 * Esto previene que se creen múltiples conexiones en entornos serverless
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Usar global para persistir la conexión entre hot reloads
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Conecta a MongoDB usando Mongoose con connection pooling
 * Reutiliza la conexión existente en entornos serverless para optimizar performance
 * 
 * @returns {Promise<typeof mongoose>} Instancia de mongoose conectada
 * @throws {Error} Si MONGODB_URI no está definido o la conexión falla
 * 
 * @example
 * ```typescript
 * await connectDB();
 * // Ahora puedes usar modelos de Mongoose
 * ```
 */
export async function connectDB(): Promise<typeof mongoose> {
    // Validar que MONGODB_URI esté configurado
    if (!MONGODB_URI) {
        throw new Error(
            'MONGODB_URI no está definido. Por favor configura esta variable en .env.local'
        );
    }

    // Retornar conexión existente si ya está establecida
    if (cached.conn) {
        return cached.conn;
    }

    // Crear nueva promesa de conexión si no existe
    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Deshabilitar buffering para mejor manejo de errores
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    try {
        const mongooseInstance = await cached.promise;
        cached.conn = mongooseInstance;

        // Log solo en desarrollo
        if (process.env.NODE_ENV !== 'production') {
            console.log('✅ MongoDB conectado exitosamente');
        }

        return cached.conn;
    } catch (error) {
        // Limpiar promesa fallida para permitir reintentos
        cached.promise = null;

        console.error('❌ Error conectando a MongoDB:', error);
        throw new Error(
            `No se pudo conectar a MongoDB: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
    }
}

/**
 * Desconecta de MongoDB
 * Útil para testing o cierre limpio de la aplicación
 * 
 * @returns {Promise<void>}
 */
export async function disconnectDB(): Promise<void> {
    if (cached.conn) {
        await cached.conn.disconnect();
        cached.conn = null;
        cached.promise = null;

        if (process.env.NODE_ENV !== 'production') {
            console.log('MongoDB desconectado');
        }
    }
}
