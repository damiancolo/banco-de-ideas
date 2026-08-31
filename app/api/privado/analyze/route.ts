import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '@/lib/auth-utils';
import { savePrivateIdea, saveIdeas } from '@/lib/db';
import { logger } from '@/lib/logger';
import { PROMPTS, API } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';

type SuggestedIdea = {
    id?: string;
    title?: string;
    summary?: string;
    text?: string;
};

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    plainText?: string;
};

/**
 * Saca el texto de una respuesta de Anthropic.
 *
 * NO uses content[0]: desde claude-opus-5 el razonamiento viene activado por
 * defecto (en opus-4.8 y anteriores venía apagado si no se pedía), así que el
 * primer bloque suele ser `thinking` y el texto está más abajo. Asumir el
 * índice cero devolvía null y dejaba la pantalla en blanco sin ningún error.
 */
function textoDe(completion: Anthropic.Message): string | null {
    const bloque = completion.content.find((b) => b.type === 'text');
    return bloque && 'text' in bloque ? bloque.text : null;
}

/**
 * Tope de tokens de las respuestas.
 *
 * Era 1024, heredado de cuando el área privada usaba claude-opus-4-6 — donde el
 * razonamiento venía APAGADO salvo que se pidiera, así que los 1024 eran 1024 de
 * texto. Al pasar a claude-opus-5 (que razona por defecto) ese mismo presupuesto
 * pasó a repartirse entre razonamiento y texto, y las respuestas empezaron a
 * cortarse a media palabra. El JSON quedaba inválido y la pantalla, vacía.
 *
 * Es un TECHO, no un consumo: se paga lo que el modelo genera, así que subirlo
 * no encarece nada por sí solo. 16000 es el valor recomendado para peticiones
 * sin streaming (por encima conviene usar stream para no agotar el timeout HTTP).
 */
const TOPE_TOKENS = 16000;

/**
 * Saca el array de ideas del texto del modelo.
 *
 * El modelo puede envolverlo en un bloque markdown y puede devolver un objeto o
 * un array suelto, según el modelo y el día. Hay que quedarse con el delimitador
 * que aparezca ANTES en el texto: probar el patrón de objeto primero se comía
 * los corchetes de fuera de un array y dejaba "{...}, {...}", que no es JSON.
 */
function extraerIdeas(content: string): SuggestedIdea[] {
    const limpio = content.replace(/```(?:json)?/gi, '').trim();
    let jsonStr = limpio;
    const inicio = limpio.search(/[[{]/);
    if (inicio !== -1) {
        const cierre = limpio[inicio] === '[' ? ']' : '}';
        const fin = limpio.lastIndexOf(cierre);
        if (fin > inicio) jsonStr = limpio.slice(inicio, fin + 1);
    }
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed)
        ? parsed
        : (parsed.ideas || parsed.result || parsed.bisociations || []);
}

export async function POST(request: Request) {
    let userId: string;
    try {
        userId = await requireAuth();
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Hubo un tiempo en que el owner tenía un modelo distinto al del resto. Desde
    // la auditoría de ago 2026 los dos usan claude-opus-5 —cuesta igual y es mejor—,
    // así que el ternario que quedaba comparaba dos constantes idénticas y no hacía
    // nada salvo hacer creer que había una distinción.
    const claudeModel = 'claude-opus-5';

    try {
        const ip = getIp(request);
        const rateLimit = await checkRateLimit(ip, 'privado-analyze', 15, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
                { status: 429 }
            );
        }

        const { action, idea, history } = await request.json();

        if (!action || typeof action !== 'string') {
            return NextResponse.json({ error: 'Acción requerida' }, { status: 400 });
        }

        const validActions = ['save', 'similar', 'analysis', 'chat'];
        if (!validActions.includes(action)) {
            return NextResponse.json({ error: `Acción inválida: "${action}"` }, { status: 400 });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
        }

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        if (!idea && action !== 'chat') {
            return NextResponse.json({ error: 'El campo "idea" es requerido' }, { status: 400 });
        }

        if (idea && typeof idea === 'string' && idea.trim().length > API.MAX_IDEA_LENGTH) {
            return NextResponse.json({ error: 'La idea no puede exceder 2000 caracteres' }, { status: 400 });
        }

        // Build message history (Anthropic only accepts user/assistant roles)
        let messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        if (history && Array.isArray(history)) {
            messages = history
                .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant'))
                .map((msg: ChatMessage) => ({
                    role: msg.role,
                    content: msg.plainText || (typeof msg.content === 'string' ? msg.content : 'Contenido visual')
                }));
        }

        if (action === 'save') {
            if (idea) {
                try {
                    await savePrivateIdea(idea, 'user', userId);
                    return NextResponse.json({ result: 'Idea guardada exitosamente' });
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
                    logger.error('Error saving private idea:', errorMessage);
                    // Mismo motivo que en /api/analyze: un 200 con texto de error se lee
                    // como éxito y la idea se pierde sin que nadie se entere.
                    return NextResponse.json({ result: 'No se pudo guardar la idea', error: errorMessage }, { status: 500 });
                }
            }
        }

        if (action === 'similar') {
            try {
                const userMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
                    ...messages,
                    { role: 'user', content: `La idea es: "${idea}". Dame 3 ideas similares en formato JSON.` }
                ];

                // Dos intentos. Si la respuesta llega cortada por el tope o el
                // JSON no parsea, se repite una vez pidiendo concisión. Antes no
                // había reintento y cualquier tropiezo puntual terminaba en una
                // lista vacía en pantalla, sin explicación.
                let result: SuggestedIdea[] = [];
                let motivoDelFallo = '';

                for (let intento = 1; intento <= 2 && result.length === 0; intento++) {
                    const completion = await anthropic.messages.create({
                        model: claudeModel,
                        max_tokens: TOPE_TOKENS,
                        system: intento === 1
                            ? PROMPTS.SIMILAR
                            : `${PROMPTS.SIMILAR}\n\nIMPORTANTE: sé breve. Cada summary, dos frases como mucho. Devuelve SÓLO el JSON, sin nada alrededor.`,
                        messages: userMessages,
                    });

                    // Esto es lo que faltaba: sin mirar stop_reason, un corte por
                    // tope era indistinguible de un modelo devolviendo basura.
                    if (completion.stop_reason === 'max_tokens') {
                        motivoDelFallo = `la respuesta se cortó al llegar al tope de ${TOPE_TOKENS} tokens`;
                        logger.error(`Claude·similar intento ${intento}: ${motivoDelFallo}`);
                        continue;
                    }

                    const content = textoDe(completion);
                    if (!content) {
                        motivoDelFallo = `el modelo no devolvió texto (stop_reason: ${completion.stop_reason})`;
                        logger.error(`Claude·similar intento ${intento}: ${motivoDelFallo}`);
                        continue;
                    }

                    try {
                        result = extraerIdeas(content);
                        if (result.length === 0) {
                            motivoDelFallo = 'el modelo devolvió un JSON válido pero sin ideas dentro';
                            logger.error(`Claude·similar intento ${intento}: ${motivoDelFallo} · crudo: ${content.slice(0, 300)}`);
                        }
                    } catch (parseErr) {
                        motivoDelFallo = 'el JSON del modelo no se pudo parsear';
                        // Con el texto crudo delante se ve de un vistazo qué pasó.
                        logger.error(`Claude·similar intento ${intento}: ${motivoDelFallo} · crudo: ${content.slice(0, 500)}`, parseErr);
                    }
                }

                if (result.length === 0) {
                    // Antes esto era `{ result: [] }` con HTTP 200, y el chat pintaba
                    // "Aquí tienes 3 ideas similares:" seguido de nada. Un fallo tiene
                    // que llegar como fallo.
                    return NextResponse.json(
                        { error: `No se pudieron generar las ideas: ${motivoDelFallo}` },
                        { status: 500 }
                    );
                }

                /**
                 * DECISIÓN DEL OWNER (31 ago 2026): las 3 ideas que genera la IA a
                 * partir de una idea privada van al banco PÚBLICO, a la pestaña
                 * «Bisociaciones Artificiales». Por eso se usa `saveIdeas` —que no
                 * lleva userId, o sea públicas— y no `savePrivateIdea`.
                 *
                 * NO es un descuido: parece uno, porque justo arriba la idea del
                 * usuario sí se guarda con `savePrivateIdea(..., userId)`, y porque
                 * este bloque llevaba un log que decía «bisociaciones privadas» y
                 * hacía pensar que la asimetría era un error. Lo era el log, no el
                 * comportamiento. Antes de «arreglar» esto, preguntar al owner.
                 *
                 * Lo que SÍ es privado es la idea del usuario: sólo salen al público
                 * las 3 derivadas que produce la IA.
                 */
                const ideasToSave = result.map((item: SuggestedIdea) => ({
                    text: item.summary || item.title || item.text || JSON.stringify(item),
                    category: 'bisociation' as const
                }));
                try {
                    await saveIdeas(ideasToSave);
                } catch (err: unknown) {
                    logger.error('Error publicando las bisociaciones de la IA en el banco público:', err);
                }

                return NextResponse.json({
                    result: result.map((item: SuggestedIdea, i: number) => ({
                        id: item.id || `temp-${Date.now()}-${i}`,
                        title: item.title || item.text?.substring(0, 50) || 'Idea Sugerida',
                        summary: item.summary || item.text || JSON.stringify(item)
                    }))
                });
            } catch (llmErr: unknown) {
                logger.error('Claude Error in similar action:', llmErr);
                return NextResponse.json({ error: 'Error de IA' }, { status: 500 });
            }

        } else if (action === 'analysis') {
            const userMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
                ...messages,
                { role: 'user', content: `Analiza esta idea: "${idea}"` }
            ];

            const completion = await anthropic.messages.create({
                model: claudeModel,
                max_tokens: TOPE_TOKENS,
                system: PROMPTS.ANALYSIS,
                messages: userMessages,
            });

            // Un análisis cortado se leía como un análisis que termina raro. Ahora
            // se avisa en vez de entregar media frase como si fuera la respuesta.
            if (completion.stop_reason === 'max_tokens') {
                logger.error(`Claude·analysis: cortado al llegar al tope de ${TOPE_TOKENS} tokens`);
                return NextResponse.json(
                    { error: 'El análisis salió demasiado largo y se cortó. Probá con una idea más corta.' },
                    { status: 500 }
                );
            }

            const analysisContent = textoDe(completion);
            if (!analysisContent) {
                return NextResponse.json({ error: 'La IA no pudo generar un análisis' }, { status: 500 });
            }
            return NextResponse.json({ result: analysisContent });

        } else if (action === 'chat') {
            const userMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
                ...messages,
                { role: 'user', content: idea }
            ];

            const completion = await anthropic.messages.create({
                model: claudeModel,
                max_tokens: TOPE_TOKENS,
                system: PROMPTS.CHAT,
                messages: userMessages,
            });

            if (completion.stop_reason === 'max_tokens') {
                logger.error(`Claude·chat: cortado al llegar al tope de ${TOPE_TOKENS} tokens`);
                return NextResponse.json(
                    { error: 'La respuesta salió demasiado larga y se cortó. Probá a preguntar algo más acotado.' },
                    { status: 500 }
                );
            }

            const chatContent = textoDe(completion);
            if (!chatContent) {
                return NextResponse.json({ error: 'La IA no pudo generar una respuesta' }, { status: 500 });
            }
            return NextResponse.json({ result: chatContent });
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        logger.error('Private API Error:', errorMsg);
        return NextResponse.json({ error: 'Error procesando solicitud' }, { status: 500 });
    }
}
