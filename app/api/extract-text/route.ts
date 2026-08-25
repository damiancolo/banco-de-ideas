import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

const MAX_FILE_SIZE = 500 * 1024; // 500 KB
const ALLOWED_TYPES = ['text/plain', 'text/markdown', 'application/pdf'];

/**
 * 15 por minuto y por IP. Mas alto que las rutas que escriben (5/min) porque
 * /planes sube los archivos de a uno en un bucle: un usuario legitimo que
 * arrastra seis PDFs hace seis peticiones seguidas. El tope de 500 KB por
 * archivo ya acota el trabajo de pdf-parse; esto acota cuantas veces seguidas
 * se le puede pedir.
 */
const LIMITE_POR_MINUTO = 15;

export async function POST(req: Request) {
    try {
        const rateLimit = await checkRateLimit(getIp(req), 'extract-text', LIMITE_POR_MINUTO, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Demasiados archivos seguidos. Esperá un minuto.' },
                { status: 429 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'El archivo supera el límite de 500 KB' }, { status: 400 });
        }

        const mimeType = file.type || '';
        const name = file.name.toLowerCase();

        // TXT / MD — leer directamente como texto
        if (mimeType === 'text/plain' || mimeType === 'text/markdown' || name.endsWith('.txt') || name.endsWith('.md')) {
            const text = await file.text();
            return NextResponse.json({ filename: file.name, content: text.trim() });
        }

        // PDF — extraer con pdf-parse
        if (mimeType === 'application/pdf' || name.endsWith('.pdf')) {
            const pdfModule = await import('pdf-parse');
            const pdfParse = (pdfModule as any).default ?? pdfModule;
            const buffer = Buffer.from(await file.arrayBuffer());
            const data = await pdfParse(buffer);
            return NextResponse.json({ filename: file.name, content: data.text.trim() });
        }

        return NextResponse.json({ error: 'Tipo de archivo no soportado. Usa .txt, .md o .pdf' }, { status: 415 });

    } catch (error) {
        logger.error('Error extracting text:', error);
        return NextResponse.json({ error: 'No se pudo extraer el texto del archivo' }, { status: 500 });
    }
}
