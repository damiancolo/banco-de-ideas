import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

// Singleton nativo para el MongoDB Adapter de Auth.js
// No reutilizamos la conexión de Mongoose porque el adapter
// necesita un MongoClient propio para garantizar compatibilidad.

/**
 * Los mismos timeouts que lib/mongodb.ts.
 *
 * Sin esto el cliente usaba los valores por defecto del driver, y el de
 * selección de servidor son 30 segundos: cuando Atlas tenía un bache, /privado
 * y /banco se quedaban colgadas medio minuto antes de fallar. Pasó cuatro veces
 * en producción entre junio y agosto de 2026 (MongoServerSelectionError,
 * ReplicaSetNoPrimary). Es mejor fallar en 2 segundos y que el usuario reintente.
 */
const OPCIONES = {
    connectTimeoutMS: 2000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 2000,
};

declare global {
    // eslint-disable-next-line no-var
    var _authMongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * La conexión se abre la primera vez que alguien la pide, NO al importar este
 * archivo.
 *
 * Hasta nov 2026 se abría al cargar el módulo, sin que nadie la esperara. En
 * Vercel eso tumbaba el proceso: una petición que no usaba la base (un
 * `initialize` de /mcp, una página con sesión JWT) respondía antes de que la
 * conexión terminara, Vercel congelaba la instancia con la conexión a medias y,
 * al despertarla la petición siguiente, saltaba el timeout de 2 s sin nadie que
 * capturara el error → `unhandledRejection` → `Node.js process exited with exit
 * status: 128`. Eran ~125 caídas al día; cada una mataba la petición en curso y
 * obligaba a un arranque en frío, que es lo que se comió el cupo de CPU de
 * Vercel (aviso del 90 % del 10 nov 2026).
 *
 * Si se vuelve a conectar al importar, vuelve el problema.
 */
export function getMongoClient(): Promise<MongoClient> {
    if (!global._authMongoClientPromise) {
        const promesa = new MongoClient(MONGODB_URI, OPCIONES).connect();
        // Si falla, se olvida para que la próxima llamada reintente en vez de
        // quedarse con un rechazo guardado para siempre. Este catch además deja
        // el rechazo atendido; quien espere la promesa recibe el error igual.
        promesa.catch(() => {
            if (global._authMongoClientPromise === promesa) {
                global._authMongoClientPromise = undefined;
            }
        });
        global._authMongoClientPromise = promesa;
    }
    return global._authMongoClientPromise;
}
