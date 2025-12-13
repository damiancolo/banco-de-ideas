import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.json');

export type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category: 'user' | 'bisociation';
};

// Inicializar DB si no existe
if (!fs.existsSync(DB_PATH)) {
    // Asegurar directorio data existe
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
}

export function getIdeas(): SavedIdea[] {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
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
    fs.writeFileSync(DB_PATH, JSON.stringify(ideas, null, 2));

    return newIdea;
}
