import OpenAI from 'openai';
import { logger } from '@/lib/logger';

let deepseek: OpenAI | null = null;
function getDeepSeek(): OpenAI {
    if (!deepseek) {
        if (!process.env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY no configurada');
        deepseek = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com',
        });
    }
    return deepseek;
}

const SYSTEM_PROMPT = `Sos el curador del Banco de Ideas (unbancodeideas.com), un repositorio orientado a
encontrar ideas "metanoicas simbióticas": ideas que (1) corren el paradigma —
cambian la manera de mirar un problema, no solo lo optimizan — y (2) son
simbióticas — mutualistas, regenerativas, de bien común; suman al tejido
humano-humano, humano-naturaleza o humano-IA.

Recibís una entrada cruda de la lista de tareas personal del autor. Puede ser
telegráfica (pocas palabras). Tu trabajo:
1. Interpretá la semilla con generosidad: ¿qué idea podría llegar a ser?
2. Desarrollala en 2-4 oraciones como idea del banco, en español, voz clara y
   concreta, sin tono de marketing.
3. Mantené la intención original; no inventes un proyecto distinto.
4. Solo si la entrada es un trámite puro sin ninguna semilla conceptual posible,
   descartala.

Respondé SOLO JSON, sin texto adicional:
{"idea": "<texto desarrollado>"}  o  {"descartar": "<razón breve>"}`;

export type DevelopResult = { idea: string } | { descartar: string };

/**
 * Toma el texto crudo de una task y lo desarrolla como idea del banco, o lo
 * descarta si es puro trámite. Reintenta una vez si el JSON viene malformado.
 */
export async function developIdea(rawText: string): Promise<DevelopResult> {
    const client = getDeepSeek();

    const run = async (): Promise<DevelopResult> => {
        const response = await client.chat.completions.create({
            model: 'deepseek-v4-pro',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: rawText },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });
        const content = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        if (typeof parsed.idea === 'string' && parsed.idea.trim()) {
            return { idea: parsed.idea.trim().slice(0, 1500) };
        }
        if (typeof parsed.descartar === 'string') {
            return { descartar: parsed.descartar.trim() || 'sin semilla conceptual' };
        }
        throw new Error('Respuesta sin idea ni descartar');
    };

    try {
        return await run();
    } catch (err) {
        logger.warn('developIdea reintentando tras error de parseo:', err);
        return await run(); // segundo intento; si vuelve a fallar, propaga al caller
    }
}
