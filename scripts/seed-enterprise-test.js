/**
 * seed-enterprise-test.js
 *
 * Creates test data in banco-ideas-pruebas (the "main" DB for preview environments).
 * Uses MONGODB_URI_PRUEBAS locally to avoid hitting production.
 * NEVER runs against banco-ideas (production).
 *
 * Usage:
 *   node scripts/seed-enterprise-test.js <email>
 *
 * Example:
 *   node scripts/seed-enterprise-test.js tuusuario@gmail.com
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI_PRUEBAS;
if (!uri) {
    console.error('❌ MONGODB_URI_PRUEBAS no está definida en .env.local');
    process.exit(1);
}

// Safety guard: never run against production DB
if (uri.includes('/banco-ideas?') || uri.endsWith('/banco-ideas')) {
    console.error('❌ La URI apunta a la BD de producción. Este script no puede ejecutarse ahí.');
    process.exit(1);
}

const email = process.argv[2];
if (!email || !email.includes('@')) {
    console.error('❌ Debes pasar un email como argumento.');
    console.error('   Uso: node scripts/seed-enterprise-test.js tuusuario@gmail.com');
    process.exit(1);
}

// --- Schemas (inline CommonJS — ts-node not compatible with project tsconfig) ---

const OrganizationSchema = new mongoose.Schema(
    {
        name: String,
        slug: { type: String, unique: true },
        logoUrl: String,
        aiProvider: { type: String, default: 'claude' },
        aiModel: { type: String, default: 'claude-opus-4-6' },
        knowledgeBase: [
            {
                filename: String,
                content: String,
                embedding: { type: [Number], default: [] },
                uploadedAt: { type: Date, default: Date.now },
                _id: false,
            }
        ],
        programStartDate: Date,
        programEndDate: Date,
        status: { type: String, default: 'active' },
    },
    { timestamps: true, collection: 'organizations' }
);

const MembershipSchema = new mongoose.Schema(
    {
        userId: String,
        organizationId: mongoose.Schema.Types.ObjectId,
        role: { type: String, default: 'participant' },
        status: { type: String, default: 'active' },
    },
    { timestamps: { createdAt: true, updatedAt: false }, collection: 'memberships' }
);

async function run() {
    console.log(`\n🔗 Conectando a MongoDB (banco-ideas-pruebas)...`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Conectado a banco-ideas-pruebas');

    const db = mongoose.connection.db;

    const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
    const Membership = mongoose.models.Membership || mongoose.model('Membership', MembershipSchema);

    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    // --- 1. Create or update test organization ---
    console.log('\n📦 Creando organización de prueba...');

    const orgData = {
        name: '[TEST] Empresa de Prueba',
        logoUrl: 'https://placehold.co/64x64?text=TEST',
        aiProvider: 'claude',
        aiModel: 'claude-opus-4-6',
        status: 'active',
        programStartDate: now,
        programEndDate: thirtyDaysLater,
        knowledgeBase: [
            {
                filename: 'contexto-empresa.txt',
                content: [
                    'Empresa de Prueba es una startup tecnológica fundada en 2024.',
                    'Nuestros valores son la innovación, la transparencia y el impacto social.',
                    'Actualmente desarrollamos herramientas de IA para pymes.',
                    'El programa de ideas busca mejorar nuestro proceso de onboarding de clientes.',
                ].join(' '),
                embedding: [],
                uploadedAt: now,
            }
        ],
    };

    const org = await Organization.findOneAndUpdate(
        { slug: 'test-org' },
        { $set: orgData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Organización: "${org.name}" (slug: test-org)`);
    console.log(`   ID: ${org._id}`);

    // --- 2. Find user by email ---
    // Users live in the same DB (managed by NextAuth).
    console.log(`\n👤 Buscando usuario con email: ${email}...`);
    let userId;
    const user = await db.collection('users').findOne({ email });

    if (!user) {
        console.warn(`⚠️  Usuario no encontrado. Puede que aún no se haya logueado.`);
        console.warn(`   La membresía se creará con el email como userId temporal.`);
        console.warn(`   Vuelve a ejecutar este script después del primer login para corregirlo.`);
        userId = email;
    } else {
        userId = user._id.toString();
        console.log(`✅ Usuario encontrado: ${user.name || user.email} (id: ${userId})`);
    }

    // --- 3. Create or update membership ---
    console.log('\n🔗 Creando membresía...');

    const membership = await Membership.findOneAndUpdate(
        { userId, organizationId: org._id },
        {
            $set: { status: 'active', role: 'participant' },
            $setOnInsert: { userId, organizationId: org._id },
        },
        { upsert: true, new: true }
    );

    console.log(`✅ Membresía: userId=${userId} ↔ orgId=${org._id}`);
    console.log(`   ID membresía: ${membership._id}`);

    // --- 4. Summary ---
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 SEED COMPLETADO');
    console.log('═'.repeat(60));
    console.log(`\nOrganización ID: ${org._id}`);
    console.log(`Membresía ID:    ${membership._id}`);
    console.log(`\nPara verificar (en banco-ideas-pruebas):`);
    console.log(`  db.organizations.findOne({ slug: "test-org" })`);
    console.log(`  db.memberships.find({ organizationId: ObjectId("${org._id}") })`);
    console.log('═'.repeat(60) + '\n');

    await mongoose.disconnect();
    console.log('🔌 Desconectado.');
}

run().catch(err => {
    console.error('❌ Error durante el seed:', err);
    mongoose.disconnect().finally(() => process.exit(1));
});
