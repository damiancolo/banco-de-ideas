#!/usr/bin/env node

/**
 * Script de migración para generar embeddings de ideas existentes
 * Uso: node scripts/generate-embeddings.js
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const OpenAI = require('openai');

// Configuración
const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DELAY_MS = 200; // Delay entre llamadas a la API para evitar rate limiting

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI no está configurada en .env.local');
    process.exit(1);
}

if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY no está configurada en .env.local');
    process.exit(1);
}

// Definir el esquema de Idea (simplificado para el script)
const IdeaSchema = new mongoose.Schema({
    text: String,
    category: String,
    embedding: [Number],
}, { timestamps: true });

const Idea = mongoose.model('Idea', IdeaSchema, 'ideas');

// Cliente OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Genera embedding para un texto
 */
async function generateEmbedding(text) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.trim(),
    });
    return response.data[0].embedding;
}

/**
 * Pausa la ejecución por un tiempo determinado
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Función principal
 */
async function main() {
    console.log('🚀 Iniciando generación de embeddings...\n');

    try {
        // Conectar a MongoDB
        console.log('📦 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Buscar ideas sin embedding
        const ideasWithoutEmbedding = await Idea.find({
            $or: [
                { embedding: { $exists: false } },
                { embedding: { $size: 0 } },
                { embedding: null }
            ]
        });

        const total = ideasWithoutEmbedding.length;

        if (total === 0) {
            console.log('✨ Todas las ideas ya tienen embeddings. Nada que hacer.');
            await mongoose.disconnect();
            return;
        }

        console.log(`📝 Encontradas ${total} ideas sin embedding\n`);

        let processed = 0;
        let errors = 0;

        for (const idea of ideasWithoutEmbedding) {
            processed++;
            const progress = `[${processed}/${total}]`;

            try {
                console.log(`${progress} Procesando: "${idea.text.substring(0, 40)}..."`);

                const embedding = await generateEmbedding(idea.text);

                await Idea.updateOne(
                    { _id: idea._id },
                    { $set: { embedding } }
                );

                console.log(`${progress} ✅ Embedding generado (${embedding.length} dimensiones)`);

            } catch (error) {
                errors++;
                console.error(`${progress} ❌ Error: ${error.message}`);
            }

            // Delay para evitar rate limiting
            if (processed < total) {
                await sleep(DELAY_MS);
            }
        }

        console.log('\n========================================');
        console.log(`✅ Proceso completado`);
        console.log(`   - Procesadas: ${processed}`);
        console.log(`   - Exitosas: ${processed - errors}`);
        console.log(`   - Errores: ${errors}`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Desconectado de MongoDB');
    }
}

// Ejecutar
main();
