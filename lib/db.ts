import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.json');

export type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category: 'user' | 'bisociation';
};

// Inicializar DB si no existe (Solo si es posible escribir)
try {
    if (!fs.existsSync(DB_PATH)) {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (e) {
                console.warn("Could not create data directory (expected in serverless):", e);
            }
        }
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
        } catch (e) {
            console.warn("Could not write init db (expected in serverless):", e);
        }
    }
} catch (e) {
    console.warn("FS access error:", e);
}

export function getIdeas(): SavedIdea[] {
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

    ideas.unshift(newIdea); // Agregar al principio

    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(ideas, null, 2));
    } catch (error) {
        console.error("Error writing to DB (read-only system?):", error);
        // En Vercel no podemos guardar, pero devolvemos la idea para que el frontend no falle
    }

    return newIdea;
}
