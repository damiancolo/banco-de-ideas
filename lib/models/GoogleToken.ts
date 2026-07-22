import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Guarda los tokens de Google OAuth de un usuario para poder llamar
 * a la API de Google Tasks desde el servidor (fuera del flujo de login).
 * Se escribe en el callback jwt de auth.ts en el primer login (cuando
 * Google entrega refresh_token) y se refresca de forma perezosa desde
 * lib/google/tasks.ts cuando el access_token expira.
 */
export interface IGoogleToken extends Document {
    userId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    scope?: string;
    updatedAt: Date;
    createdAt: Date;
}

const GoogleTokenSchema = new Schema<IGoogleToken>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        accessToken: { type: String, required: true },
        refreshToken: { type: String },
        expiresAt: { type: Date, required: true },
        scope: { type: String },
    },
    { timestamps: true, collection: 'google_tokens' }
);

const GoogleToken: Model<IGoogleToken> =
    mongoose.models.GoogleToken || mongoose.model<IGoogleToken>('GoogleToken', GoogleTokenSchema);

export default GoogleToken;
