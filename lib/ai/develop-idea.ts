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
1. Distinguí IDEA de TAREA OPERATIVA. Descartá (no desarrolles) todo lo que sea
   un pendiente/recordatorio de gestión personal: reuniones, llamadas, mails,
   turnos y citas, compras, pagos, trámites, "mandar/enviar/avisar/confirmar X",
   arreglos, mudanzas, cosas con nombre propio de una gestión puntual. Eso NO es
   una idea para el banco.
2. Si en cambio hay una semilla conceptual —una propuesta, un proyecto, una
   forma distinta de mirar algo, algo colaborativo o de bien común— interpretala
   con generosidad: ¿qué idea metanoica simbiótica podría llegar a ser?
3. Desarrollala en 2-4 oraciones como idea del banco, en español, voz clara y
   concreta, sin tono de marketing. Mantené la intención original.

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
            max_tokens: 500,
        }, { timeout: 30000, maxRetries: 0 });
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
