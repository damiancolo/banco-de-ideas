import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.json');

export type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category: 'user' | 'bisociation';
};

// Inicializar DB si no existe (Solo en desarrollo)
// En producción (Vercel), evitamos tocar FS para no romper el build/runtime inmutables
const IS_PROD = process.env.NODE_ENV === 'production';

try {
    if (!IS_PROD && !fs.existsSync(DB_PATH)) {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (e) {
                console.warn("Could not create data directory:", e);
            }
        }
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
        } catch (e) {
            console.warn("Could not write init db:", e);
        }
    }
} catch (e) {
    if (!IS_PROD) console.warn("FS access error:", e);
}

export function getIdeas(): SavedIdea[] {
    if (IS_PROD) return []; // En Vercel no leemos del disco

    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.warn("Error reading DB:", error);
    }
    return [];
}

export function saveIdea(text: string, category: 'user' | 'bisociation' = 'user'): SavedIdea {
    const ideas = getIdeas();
    const newIdea: SavedIdea = {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        text,
        createdAt: new Date().toISOString(),
        category
    };

    if (IS_PROD) return newIdea; // En Vercel devolvemos éxito sin guardar en disco

    ideas.unshift(newIdea); // Agregar al principio

    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(ideas, null, 2));
    } catch (error) {
        console.error("Error writing to DB:", error);
    }

    return newIdea;
}
