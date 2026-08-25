import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

// Singleton nativo para el MongoDB Adapter de Auth.js
// No reutilizamos la conexión de Mongoose porque el adapter
// necesita un MongoClient propio para garantizar compatibilidad.

/**
 * Los mismos timeouts que lib/mongodb.ts.
 *
 * Sin esto el cliente usaba los valores por defecto del driver, y el de
 * selección de servidor son 30 segundos: cuando Atlas tenía un bache, /privado
 * y /banco se quedaban colgadas medio minuto antes de fallar. Pasó cuatro veces
 * en producción entre junio y agosto de 2026 (MongoServerSelectionError,
 * ReplicaSetNoPrimary). Es mejor fallar en 2 segundos y que el usuario reintente.
 */
const OPCIONES = {
    connectTimeoutMS: 2000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 2000,
};

declare global {
    // eslint-disable-next-line no-var
    var _authMongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    if (!global._authMongoClientPromise) {
        global._authMongoClientPromise = new MongoClient(MONGODB_URI, OPCIONES).connect();
    }
    clientPromise = global._authMongoClientPromise;
} else {
    clientPromise = new MongoClient(MONGODB_URI, OPCIONES).connect();
}

export function getMongoClient(): Promise<MongoClient> {
    return clientPromise;
}
