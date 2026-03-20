import { connectDB } from './mongodb';
import mongoose from 'mongoose';
import type { MongoClient } from 'mongodb';

let clientPromise: Promise<MongoClient> | null = null;

/**
 * Extrae el MongoClient nativo de la conexión de Mongoose.
 * Auth.js necesita un MongoClient, no Mongoose.
 * Reutilizamos la misma conexión para no duplicar pools.
 */
export function getMongoClient(): Promise<MongoClient> {
    if (!clientPromise) {
        clientPromise = connectDB().then(() => {
            return mongoose.connection.getClient() as unknown as MongoClient;
        });
    }
    return clientPromise;
}
