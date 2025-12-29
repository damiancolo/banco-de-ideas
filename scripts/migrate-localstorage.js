/**
 * Script de migración de LocalStorage a MongoDB
 * 
 * INSTRUCCIONES:
 * 1. Abrir la aplicación en el navegador
 * 2. Abrir DevTools (F12) → Console
 * 3. Copiar y pegar este código
 * 4. Ejecutar: migrateToMongoDB()
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
async function migrateToMongoDB() {
    try {
        // Leer datos de LocalStorage
        const stored = localStorage.getItem("ideas_bank_v1");
        if (!stored) {
            console.log("✅ No hay ideas en LocalStorage para migrar");
            return;
        }

        const ideas = JSON.parse(stored);
        console.log(`📦 Encontradas ${ideas.length} ideas para migrar`);

        // Enviar cada idea al servidor
        let migrated = 0;
        let errors = 0;

        for (const idea of ideas) {
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'save',
                        idea: idea.text,
                        history: []
                    })
                });

                if (response.ok) {
                    migrated++;
                    console.log(`✅ Migrada (${migrated}/${ideas.length}): ${idea.text.substring(0, 50)}...`);
                } else {
                    errors++;
                    console.error(`❌ Error migrando: ${idea.text.substring(0, 50)}...`);
                }
            } catch (err) {
                errors++;
                console.error(`❌ Error de red:`, err);
            }
        }

        console.log(`\n🎉 Migración completada: ${migrated}/${ideas.length} ideas migradas`);
        if (errors > 0) {
            console.warn(`⚠️  ${errors} ideas no se pudieron migrar`);
        }

        // Opcional: Limpiar LocalStorage
        if (migrated === ideas.length) {
            const shouldClear = confirm("¿Deseas limpiar LocalStorage ahora que los datos están en el servidor?");
            if (shouldClear) {
                localStorage.removeItem("ideas_bank_v1");
                console.log("🗑️  LocalStorage limpiado");
                console.log("🔄 Recarga la página para ver tus ideas desde MongoDB");
            }
        }
    } catch (error) {
        console.error("❌ Error durante la migración:", error);
    }
}

// Mensaje de ayuda
console.log("📝 Script de migración cargado.");
console.log("💡 Para migrar tus ideas de LocalStorage a MongoDB, ejecuta:");
console.log("   migrateToMongoDB()");
