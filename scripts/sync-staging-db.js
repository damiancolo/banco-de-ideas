const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const PROD_URI = process.env.MONGODB_URI;
const STAGING_URI = "mongodb+srv://bancodeideas:nvX3Di4ua3i4NceS@bancodeideas.0qdelgq.mongodb.net/banco-ideas-staging?retryWrites=true&w=majority&appName=bancodeideas";

async function sync() {
    console.log('🔄 Sincronizando datos de Producción a Staging...');

    // Conectar a Prod
    const prodConn = await mongoose.createConnection(PROD_URI).asPromise();
    console.log('✅ Conectado a Producción');

    // Conectar a Staging
    const stagingConn = await mongoose.createConnection(STAGING_URI).asPromise();
    console.log('✅ Conectado a Staging');

    const IdeaSchema = new mongoose.Schema({
        text: String,
        category: String,
        embedding: [Number],
    }, { timestamps: true });

    const ProdIdea = prodConn.model('Idea', IdeaSchema, 'ideas');
    const StagingIdea = stagingConn.model('Idea', IdeaSchema, 'ideas');

    const ideas = await ProdIdea.find({}).lean();
    console.log(`📝 Encontradas ${ideas.length} ideas en Producción.`);

    let count = 0;
    for (const idea of ideas) {
        const exists = await StagingIdea.findOne({ text: idea.text });
        if (!exists) {
            delete idea._id; // Dejar que Staging genere nuevos IDs si es necesario, o mantenerlos
            await StagingIdea.create(idea);
            count++;
        }
    }

    console.log(`✅ Sincronizadas ${count} nuevas ideas a Staging.`);

    await prodConn.close();
    await stagingConn.close();
}

sync().catch(console.error);
