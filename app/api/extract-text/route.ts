import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 500 * 1024; // 500 KB
const ALLOWED_TYPES = ['text/plain', 'text/markdown', 'application/pdf'];

export async function POST(req: Request) {
    try {
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
        console.error('Error extracting text:', error);
        return NextResponse.json({ error: 'No se pudo extraer el texto del archivo' }, { status: 500 });
    }
}
