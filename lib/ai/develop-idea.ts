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

const SYSTEM_PROMPT = `Sos el curador del Banco de Ideas (unbancodeideas.com). Clasificás entradas de
una lista de tareas personal. Tu ÚNICO trabajo es DECIDIR si una entrada es una
IDEA para el banco, o no. NO reescribas, NO desarrolles, NO resumas nada.

Es IDEA para el banco si es una semilla conceptual: una propuesta, un proyecto,
una pregunta o forma distinta de mirar algo, algo colaborativo o de bien común
—potencialmente "metanoica simbiótica" (que corre el paradigma y suma al tejido
humano-humano, humano-naturaleza o humano-IA)—, aunque esté escrita de forma
telegráfica.

NO es idea (descartar) si es una tarea operativa o de gestión personal: reunión,
llamada, mail, turno, cita, compra, pago, trámite, recordatorio puntual,
"mandar/enviar/avisar/confirmar/arreglar X"; o si está vacía o es incomprensible.

Respondé SOLO JSON, sin texto adicional:
{"mantener": true}  o  {"descartar": "<razón breve>"}`;

export type ClassifyResult = { keep: true } | { descartar: string };

/**
 * Clasifica el texto crudo de una task: ¿es una idea para el banco o no?
 * NO modifica el texto — la idea se guarda tal cual. Reintenta una vez si el
 * JSON viene malformado.
 */
export async function classifyTask(rawText: string): Promise<ClassifyResult> {
    const client = getDeepSeek();

    const run = async (): Promise<ClassifyResult> => {
        const response = await client.chat.completions.create({
            model: 'deepseek-v4-pro',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: rawText },
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
            max_tokens: 60,
        }, { timeout: 30000, maxRetries: 0 });
        const content = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        if (parsed.mantener === true) return { keep: true };
        if (typeof parsed.descartar === 'string') {
            return { descartar: parsed.descartar.trim() || 'no es una idea' };
        }
        // Si no dijo nada claro, por las dudas la mantenemos (mejor falso positivo
        // que perder una idea; el usuario filtra después).
        return { keep: true };
    };

    try {
        return await run();
    } catch (err) {
        logger.warn('classifyTask reintentando tras error:', err);
        return await run();
    }
}
