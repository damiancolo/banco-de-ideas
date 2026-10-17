/**
 * Diagnóstico de visitas — SÓLO LECTURA (sin insert, update ni delete).
 *
 * Uso (Node 22+):
 *   node --experimental-strip-types scripts/diagnostico-visitas.ts            # banco-ideas-pruebas
 *   node --experimental-strip-types scripts/diagnostico-visitas.ts --prod     # banco-ideas (real; pedir OK antes)
 *
 * Variables: MONGODB_URI_PRUEBAS (por defecto) o MONGODB_URI (con --prod).
 * No imprime la URI.
 */
import { MongoClient } from 'mongodb';

const usarProd = process.argv.includes('--prod');
const uri = usarProd ? process.env.MONGODB_URI : process.env.MONGODB_URI_PRUEBAS;
if (!uri) {
    console.error(`Falta ${usarProd ? 'MONGODB_URI' : 'MONGODB_URI_PRUEBAS'} en el entorno.`);
    process.exit(1);
}

const SITE = 'unbancodeideas';
const TZ = 'Europe/Madrid';
const DIA = 24 * 60 * 60 * 1000;

type Fila = { _id: unknown; count: number };
const tabla = (titulo: string, filas: Fila[]) => {
    console.log(`  ${titulo}`);
    if (!filas.length) console.log('    (sin datos)');
    for (const f of filas) console.log(`    ${String(f._id ?? 'null').padEnd(34)} ${f.count}`);
};

async function main() {
    const client = new MongoClient(uri!);
    await client.connect();
    const db = client.db();
    console.log(`Base: ${db.databaseName}  (${usarProd ? 'PRODUCCIÓN' : 'pruebas'}) — sólo lectura\n`);
    const visits = db.collection('visits');
    const ideas = db.collection('ideas');

    for (const dias of [7, 30]) {
        const desde = new Date(Date.now() - dias * DIA);
        const base = { site: SITE, timestamp: { $gte: desde } };
        const agrupar = (match: object, campo: string, limit = 50) =>
            visits
                .aggregate<Fila>([
                    { $match: match },
                    { $group: { _id: `$${campo}`, count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: limit },
                ])
                .toArray();

        console.log(`════ Últimos ${dias} días (desde ${desde.toISOString()}) ════`);
        const total = await visits.countDocuments(base);
        const humanos = await visits.countDocuments({ ...base, visitorType: 'human' });
        const bots = await visits.countDocuments({ ...base, visitorType: 'bot' });
        const humanosSinNavegador = await visits.countDocuments({
            ...base,
            visitorType: 'human',
            browser: null,
        });
        console.log(`  Registros: ${total}  | human: ${humanos}  | bot: ${bots}`);
        console.log(
            `  human con browser null: ${humanosSinNavegador} (${humanos ? ((100 * humanosSinNavegador) / humanos).toFixed(1) : 0}%)\n`
        );

        const humanosFiltro = { ...base, visitorType: 'human' };
        tabla('human por deviceType', await agrupar(humanosFiltro, 'deviceType'));
        tabla('human por país (top 15)', await agrupar(humanosFiltro, 'country', 15));
        tabla('bot por botName', await agrupar({ ...base, visitorType: 'bot' }, 'botName'));
        tabla('top 15 paths', await agrupar(base, 'path', 15));

        const porDia = await visits
            .aggregate<Fila>([
                { $match: base },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: TZ } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ])
            .toArray();
        tabla('registros por día (Madrid)', porDia);

        const porHora = await visits
            .aggregate<Fila>([
                { $match: base },
                { $group: { _id: { $hour: { date: '$timestamp', timezone: TZ } }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ])
            .toArray();
        const pico = porHora[0];
        console.log(`  hora (Madrid) con más registros: ${pico ? `${pico._id}h → ${pico.count}` : 'n/d'}`);
        console.log(`  reparto horario: ${porHora.sort((a, b) => Number(a._id) - Number(b._id)).map((h) => `${h._id}h:${h.count}`).join(' ')}\n`);

        const ideasNuevas = await ideas.countDocuments({ createdAt: { $gte: desde } });
        const comentarios = await ideas
            .aggregate<{ n: number }>([
                { $match: { 'comments.createdAt': { $gte: desde } } },
                { $unwind: '$comments' },
                { $match: { 'comments.createdAt': { $gte: desde } } },
                { $count: 'n' },
            ])
            .toArray();
        console.log(`  Actividad real: ideas nuevas ${ideasNuevas} | comentarios nuevos ${comentarios[0]?.n ?? 0}\n`);
    }
    await client.close();
}

main().catch((e) => {
    console.error('Error:', e instanceof Error ? e.message : e);
    process.exit(1);
});
