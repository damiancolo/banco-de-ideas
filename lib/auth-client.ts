import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

// Singleton nativo para el MongoDB Adapter de Auth.js
// No reutilizamos la conexión de Mongoose porque el adapter
// necesita un MongoClient propio para garantizar compatibilidad.

declare global {
    // eslint-disable-next-line no-var
    var _authMongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    if (!global._authMongoClientPromise) {
        global._authMongoClientPromise = new MongoClient(MONGODB_URI).connect();
    }
    clientPromise = global._authMongoClientPromise;
} else {
    clientPromise = new MongoClient(MONGODB_URI).connect();
}

export function getMongoClient(): Promise<MongoClient> {
    return clientPromise;
}
