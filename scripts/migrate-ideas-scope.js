/**
 * migrate-ideas-scope.js
 *
 * Backfills the `scope` field on all existing ideas.
 *
 * Usage:
 *   MIGRATION_TARGET=staging  node scripts/migrate-ideas-scope.js
 *   MIGRATION_TARGET=production node scripts/migrate-ideas-scope.js  (requires explicit confirmation)
 *
 * Rules:
 *   - Ideas with userId set  → scope: { type: "private", userId: <userId> }
 *   - Ideas without userId   → scope: { type: "public" }
 *   - Ideas that already have scope.type set are skipped.
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const readline = require('readline');

const TARGET = process.env.MIGRATION_TARGET;

if (!TARGET) {
    console.error('❌ MIGRATION_TARGET no está definida.');
    console.error('   Uso: MIGRATION_TARGET=staging node scripts/migrate-ideas-scope.js');
    console.error('   Uso: MIGRATION_TARGET=production node scripts/migrate-ideas-scope.js');
    process.exit(1);
}

let uri;
if (TARGET === 'production') {
    uri = process.env.MONGODB_URI;
    if (!uri) { console.error('❌ MONGODB_URI no está definida en .env.local'); process.exit(1); }
} else if (TARGET === 'staging') {
    uri = process.env.MONGODB_URI_ENTERPRISE_DEV || process.env.MONGODB_URI_PRUEBAS;
    if (!uri) { console.error('❌ MONGODB_URI_ENTERPRISE_DEV no está definida en .env.local'); process.exit(1); }
} else {
    console.error(`❌ MIGRATION_TARGET="${TARGET}" no es válido. Usa "staging" o "production".`);
    process.exit(1);
}

async function confirm(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(question, answer => { rl.close(); resolve(answer.trim().toLowerCase()); });
    });
}

async function run() {
    if (TARGET === 'production') {
        console.warn('\n⚠️  ATENCIÓN: vas a migrar la base de datos de PRODUCCIÓN.');
        const answer = await confirm('¿Confirmas? Escribe "si" para continuar: ');
        if (answer !== 'si') {
            console.log('❌ Migración cancelada.');
            process.exit(0);
        }
    }

    console.log(`\n🔗 Conectando a MongoDB [${TARGET}]...`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Conectado.');

    const db = mongoose.connection.db;
    const ideas = db.collection('ideas');

    // Count total and already-migrated
    const total = await ideas.countDocuments({});
    const alreadyMigrated = await ideas.countDocuments({ 'scope.type': { $exists: true } });
    const pending = total - alreadyMigrated;

    console.log(`\n📊 Ideas totales:    ${total}`);
    console.log(`   Ya migradas:      ${alreadyMigrated}`);
    console.log(`   Pendientes:       ${pending}`);

    if (pending === 0) {
        console.log('\n✅ Todas las ideas ya tienen scope. Nada que hacer.');
        await mongoose.disconnect();
        return;
    }

    // Bulk update: private ideas (have userId)
    const privateResult = await ideas.updateMany(
        { userId: { $nin: [null, ''] }, 'scope.type': { $exists: false } },
        [{ $set: { scope: { type: 'private', userId: '$userId', organizationId: null } } }]
    );

    // Bulk update: public ideas (no userId)
    const publicResult = await ideas.updateMany(
        { $or: [{ userId: null }, { userId: { $exists: false } }, { userId: '' }], 'scope.type': { $exists: false } },
        { $set: { scope: { type: 'public', userId: null, organizationId: null } } }
    );

    const totalUpdated = privateResult.modifiedCount + publicResult.modifiedCount;

    console.log(`\n✅ Migración completada:`);
    console.log(`   → privadas actualizadas: ${privateResult.modifiedCount}`);
    console.log(`   → públicas actualizadas: ${publicResult.modifiedCount}`);
    console.log(`   → total:                 ${totalUpdated}`);

    // Verify
    const afterMigrated = await ideas.countDocuments({ 'scope.type': { $exists: true } });
    const afterPending = total - afterMigrated;
    if (afterPending > 0) {
        console.warn(`\n⚠️  Quedan ${afterPending} ideas sin scope. Revisa manualmente.`);
    } else {
        console.log(`\n🎉 Todas las ideas tienen scope ahora.`);
    }

    await mongoose.disconnect();
    console.log('🔌 Desconectado.');
}

run().catch(err => {
    console.error('❌ Error durante la migración:', err);
    mongoose.disconnect().finally(() => process.exit(1));
});
