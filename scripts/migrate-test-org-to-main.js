/**
 * migrate-test-org-to-main.js
 *
 * Moves test-org and its memberships from banco-ideas-enterprise-dev
 * to banco-ideas-pruebas (the "main" DB for preview/staging environments).
 *
 * In Vercel preview (feature/enterprise-environment branch):
 *   MONGODB_URI → banco-ideas-pruebas  (main DB for that environment)
 *
 * Locally we use MONGODB_URI_PRUEBAS explicitly to avoid hitting production.
 *
 * Usage:
 *   node scripts/migrate-test-org-to-main.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const sourceUri = process.env.MONGODB_URI_ENTERPRISE_DEV;
const targetUri = process.env.MONGODB_URI_PRUEBAS; // = MONGODB_URI in preview

if (!sourceUri) {
    console.error('❌ MONGODB_URI_ENTERPRISE_DEV no está definida en .env.local');
    process.exit(1);
}
if (!targetUri) {
    console.error('❌ MONGODB_URI_PRUEBAS no está definida en .env.local');
    process.exit(1);
}

// Safety guard: never write to production
if (targetUri.includes('/banco-ideas?') || targetUri.endsWith('/banco-ideas')) {
    console.error('❌ El URI de destino apunta a la BD de producción. Abortando.');
    process.exit(1);
}

async function run() {
    console.log('\n🔗 Conectando a las dos BDs...');
    const sourceClient = new MongoClient(sourceUri);
    const targetClient = new MongoClient(targetUri);

    await Promise.all([sourceClient.connect(), targetClient.connect()]);
    console.log('✅ Conectado a banco-ideas-enterprise-dev (origen)');
    console.log('✅ Conectado a banco-ideas-pruebas (destino)');

    const sourceDb = sourceClient.db();
    const targetDb = targetClient.db();

    // --- 1. Read from source ---
    const org = await sourceDb.collection('organizations').findOne({ slug: 'test-org' });
    if (!org) {
        console.error('❌ No se encontró la organización test-org en la BD de staging. Abortando.');
        await Promise.all([sourceClient.close(), targetClient.close()]);
        process.exit(1);
    }

    const memberships = await sourceDb.collection('memberships')
        .find({ organizationId: org._id.toString() })
        .toArray();

    console.log(`\n📦 Origen: organización "${org.name}" + ${memberships.length} membresía(s)`);

    // --- 2. Check target doesn't already have test-org ---
    const existing = await targetDb.collection('organizations').findOne({ slug: 'test-org' });
    if (existing) {
        console.error('❌ Ya existe una organización con slug "test-org" en la BD de destino.');
        console.error('   Abortando para no sobrescribir. Bórrala manualmente si quieres re-migrar.');
        await Promise.all([sourceClient.close(), targetClient.close()]);
        process.exit(1);
    }

    // --- 3. Insert organization (without _id — let MongoDB assign a new one) ---
    const { _id: _sourceOrgId, ...orgData } = org;
    const newOrg = {
        ...orgData,
        name: '[TEST] Empresa de Prueba',   // prefix for easy identification
        slug: 'test-org',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const orgResult = await targetDb.collection('organizations').insertOne(newOrg);
    const newOrgId = orgResult.insertedId;
    console.log(`\n✅ Organización insertada en banco-ideas-pruebas`);
    console.log(`   Nuevo ID: ${newOrgId}`);

    // --- 4. Insert memberships with updated organizationId ---
    let membershipResult;
    if (memberships.length > 0) {
        const newMemberships = memberships.map(({ _id, organizationId, ...rest }) => ({
            ...rest,
            organizationId: newOrgId,
            createdAt: new Date(),
        }));
        membershipResult = await targetDb.collection('memberships').insertMany(newMemberships);
        console.log(`✅ ${Object.keys(membershipResult.insertedIds).length} membresía(s) insertada(s)`);
        Object.entries(membershipResult.insertedIds).forEach(([i, id]) => {
            console.log(`   Membresía [${i}] ID: ${id}`);
        });
    } else {
        console.warn('⚠️  No se encontraron membresías para migrar.');
    }

    // --- 5. Summary ---
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 MIGRACIÓN COMPLETADA');
    console.log('═'.repeat(60));
    console.log(`\nNuevo Org ID (banco-ideas-pruebas): ${newOrgId}`);
    console.log('\nPara verificar en MongoDB Atlas (banco-ideas-pruebas):');
    console.log(`  db.organizations.findOne({ slug: "test-org" })`);
    console.log(`  db.memberships.find({ organizationId: ObjectId("${newOrgId}") })`);
    console.log('\n⚠️  Los datos de banco-ideas-enterprise-dev NO se borraron todavía.');
    console.log('   Verifica que todo está bien arriba, luego limpia manualmente.');
    console.log('═'.repeat(60) + '\n');

    await Promise.all([sourceClient.close(), targetClient.close()]);
    console.log('🔌 Desconectado.');
}

run().catch(err => {
    console.error('❌ Error durante la migración:', err);
    process.exit(1);
});
