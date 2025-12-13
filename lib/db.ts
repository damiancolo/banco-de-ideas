import path from 'path';

// NOTA: Usamos require dinámico para 'fs' para evitar errores de compilación
// en entornos Edge/Client donde 'fs' no existe.

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.json');
const IS_PROD = process.env.NODE_ENV === 'production';

// Inicialización Lazy
function initDB() {
    if (IS_PROD) return; // No tocar FS en prod
    try {
        const fs = require('fs');
        if (!fs.existsSync(DB_PATH)) {
            const dir = path.dirname(DB_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
        }
    } catch (e) {
        // Ignorar errores de FS si falla el require
    }
}

// Ejecutar init solo si estamos en node puro (opcional, o llamar dentro de save)
try { initDB(); } catch (e) { }

export type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category: 'user' | 'bisociation';
};

export function getIdeas(): SavedIdea[] {
    if (IS_PROD) return [];
    try {
        const fs = require('fs');
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        // Silent fail
    }
    return [];
}

export function saveIdea(text: string, category: 'user' | 'bisociation' = 'user'): SavedIdea {
    const newIdea: SavedIdea = {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        text,
        createdAt: new Date().toISOString(),
        category
    };

    if (IS_PROD) return newIdea;

    try {
        const fs = require('fs');
        const ideas = getIdeas(); // Esto ya usa require interno
        ideas.unshift(newIdea);
        fs.writeFileSync(DB_PATH, JSON.stringify(ideas, null, 2));
    } catch (error) {
        console.error("Error writing to DB:", error);
    }

    return newIdea;
}
