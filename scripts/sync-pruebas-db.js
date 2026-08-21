const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const PROD_URI = process.env.MONGODB_URI;
// Nunca una credencial en el codigo: este repo es publico.
const PRUEBAS_URI = process.env.MONGODB_URI_PRUEBAS;

async function sync() {
    console.log('🔄 Sincronizando datos de Producción a Pruebas...');

    if (!PROD_URI) {
        console.error('❌ Error: MONGODB_URI no está definida en .env.local');
        process.exit(1);
    }

    if (!PRUEBAS_URI) {
        console.error('❌ Error: MONGODB_URI_PRUEBAS no está definida en .env.local');
        process.exit(1);
    }

    // Conectar a Prod
    const prodConn = await mongoose.createConnection(PROD_URI).asPromise();
    console.log('✅ Conectado a Producción');

    // Conectar a Pruebas
    const pruebasConn = await mongoose.createConnection(PRUEBAS_URI).asPromise();
    console.log('✅ Conectado a Pruebas');

    const IdeaSchema = new mongoose.Schema({
        text: String,
        category: String,
        embedding: [Number],
    }, { timestamps: true });

    const ProdIdea = prodConn.model('Idea', IdeaSchema, 'ideas');
    const PruebasIdea = pruebasConn.model('Idea', IdeaSchema, 'ideas');

    const ideas = await ProdIdea.find({}).lean();
    console.log(`📝 Encontradas ${ideas.length} ideas en Producción.`);

    let count = 0;
    for (const idea of ideas) {
        const exists = await PruebasIdea.findOne({ text: idea.text });
        if (!exists) {
            delete idea._id; // Dejar que Pruebas genere nuevos IDs
            await PruebasIdea.create(idea);
            count++;
        }
    }

    console.log(`✅ Sincronizadas ${count} nuevas ideas a Pruebas.`);

    await prodConn.close();
    await pruebasConn.close();
}

sync().catch(console.error);
