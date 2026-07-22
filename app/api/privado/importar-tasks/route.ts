import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import ImportedTask from '@/lib/models/ImportedTask';
import { listAllTasks, ReauthRequiredError, type GoogleTask } from '@/lib/google/tasks';
import { developIdea } from '@/lib/ai/develop-idea';
import { generateEmbedding, cosineSimilarity } from '@/lib/utils/embeddings';
import { savePrivateIdeaFromTask, getSimilarityCorpus } from '@/lib/db';
import { isOwnerEmail } from '@/lib/owner';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Tasks desarrolladas por invocación. Se procesan EN PARALELO, así que el
// wall-clock ≈ la más lenta (no la suma). Con DeepSeek ~10s/llamada, 5 en
// paralelo entra holgado en los 60s de Vercel. El cliente itera hasta agotar.
const BATCH = 5;
const SIMILARITY_THRESHOLD = 0.8;

/** Exclusión determinista: entradas que no son ideas. Devuelve la razón o null. */
function deterministicExclude(t: GoogleTask): string | null {
    const title = (t.title || '').trim();
    if (!title) return 'empty';
    if (t.due) return 'due';                                  // acción agendada, no idea
    const hasNotes = (t.notes || '').trim().length > 0;
    if (!hasNotes && !/\s/.test(title)) return 'single-word'; // una sola palabra sin notas
    return null;
}

function topSimilar(
    embedding: number[],
    corpus: Array<{ id: string; text: string; embedding: number[] }>
): Array<{ ideaId: string; text: string; similarity: number }> {
    return corpus
        .map((c) => ({ ideaId: c.id, text: c.text, similarity: cosineSimilarity(embedding, c.embedding) }))
        .filter((s) => s.similarity >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map((s) => ({
            ideaId: s.ideaId,
            text: s.text.length > 90 ? s.text.slice(0, 90) + '…' : s.text,
            similarity: Math.round(s.similarity * 100) / 100,
        }));
}

export async function POST() {
    // 1. Auth + gate de owner
    const session = await auth().catch(() => null);
    const userId = session?.user?.id;
    const email = session?.user?.email;
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!isOwnerEmail(email)) return NextResponse.json({ error: 'No disponible' }, { status: 403 });

    try {
        await connectDB();

        // 2. Tasks ya procesadas (idempotencia)
        const processedIds = new Set<string>(
            (await ImportedTask.find({ userId }).distinct('taskId')) as string[]
        );

        // 3. Leer Google Tasks
        let tasks: GoogleTask[];
        try {
            tasks = await listAllTasks(userId);
        } catch (err) {
            if (err instanceof ReauthRequiredError) {
                return NextResponse.json({ error: 'reauth' }, { status: 401 });
            }
            throw err;
        }

        const unprocessed = tasks.filter((t) => !processedIds.has(t.id));

        // 4. Exclusiones deterministas (baratas, se registran todas ahora)
        const excluded: Array<{ original: string; reason: string }> = [];
        const toDevelop: GoogleTask[] = [];
        for (const t of unprocessed) {
            const reason = deterministicExclude(t);
            if (reason) {
                await ImportedTask.updateOne(
                    { userId, taskId: t.id },
                    { $set: { userId, taskId: t.id, listId: t.listId, outcome: 'excluded', reason, processedAt: new Date() } },
                    { upsert: true }
                );
                excluded.push({ original: t.title || '(vacío)', reason });
            } else {
                toDevelop.push(t);
            }
        }

        // 5. Desarrollar un lote con IA
        const batch = toDevelop.slice(0, BATCH);
        const corpus = batch.length ? await getSimilarityCorpus(userId) : [];
        const imported: Array<{ ideaId: string; original: string; idea: string; similarTo: any[] }> = [];
        const errors: Array<{ original: string; error: string }> = [];

        // Procesamiento EN PARALELO del lote: cada task es independiente.
        await Promise.all(batch.map(async (t) => {
            const raw = `${t.title || ''}${t.notes ? '\n' + t.notes : ''}`.trim();
            try {
                const result = await developIdea(raw);

                if ('descartar' in result) {
                    await ImportedTask.updateOne(
                        { userId, taskId: t.id },
                        { $set: { userId, taskId: t.id, listId: t.listId, outcome: 'excluded', reason: `ai-descartada: ${result.descartar}`, processedAt: new Date() } },
                        { upsert: true }
                    );
                    excluded.push({ original: raw, reason: `ai: ${result.descartar}` });
                    return;
                }

                const embedding = await generateEmbedding(result.idea);
                const similarTo = topSimilar(embedding, corpus);
                const saved = await savePrivateIdeaFromTask({
                    text: result.idea,
                    originalText: raw,
                    userId,
                    embedding,
                    similarTo,
                });
                await ImportedTask.updateOne(
                    { userId, taskId: t.id },
                    { $set: { userId, taskId: t.id, listId: t.listId, outcome: 'imported', ideaId: saved.id, processedAt: new Date() } },
                    { upsert: true }
                );
                imported.push({ ideaId: saved.id, original: raw, idea: result.idea, similarTo });
            } catch (err) {
                // No registrar: la task se reintenta en la próxima corrida.
                logger.error('Error importando task:', err);
                errors.push({ original: raw, error: err instanceof Error ? err.message : 'error desconocido' });
            }
        }));

        const remaining = toDevelop.length - batch.length;
        // progressed = hubo algún avance real este call (para que el cliente no cicle si todo falla)
        const progressed = imported.length + excluded.length > 0;

        return NextResponse.json({ imported, excluded, errors, remaining, progressed });
    } catch (error) {
        logger.error('importar-tasks fatal:', error);
        return NextResponse.json({ error: 'Error al importar tasks' }, { status: 500 });
    }
}
