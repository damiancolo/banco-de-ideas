import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

/**
 * Topes de longitud por campo.
 *
 * Esta ruta escribe directo en MongoDB y no pide sesión. Sin rate limit ni topes,
 * cualquiera con curl podía insertar documentos ilimitados y del tamaño que
 * quisiera. El CORS de abajo no protege de eso: es cosa del navegador, curl lo
 * ignora por completo.
 */
const TOPES: Record<string, number> = {
  palabra: 100,
  idioma: 60,
  region: 100,
  categoria: 40,
  breve: 300,
  largo: 2000,
  perifrasis: 500,
  autor: 100,
};

const ALLOWED_ORIGINS = [
  'https://estudioprompt.com',
  'https://www.estudioprompt.com',
  'http://localhost:4321',
  'http://localhost:3000',
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    // 5 propuestas por minuto y por IP, como el resto de rutas que escriben.
    const rateLimit = await checkRateLimit(getIp(request), 'lacuna-propuesta', 5, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Demasiadas propuestas seguidas. Esperá un minuto.' },
        { status: 429, headers }
      );
    }

    const body = await request.json();
    const { palabra, idioma, region, categoria, breve, largo, perifrasis, autor } = body;

    if (!palabra?.trim() || !idioma?.trim() || !breve?.trim()) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400, headers });
    }

    for (const [campo, tope] of Object.entries(TOPES)) {
      const valor = body[campo];
      if (typeof valor === 'string' && valor.length > tope) {
        return NextResponse.json(
          { error: `El campo "${campo}" excede los ${tope} caracteres.` },
          { status: 400, headers }
        );
      }
    }

    await connectDB();

    const db = mongoose.connection.db!;
    await db.collection('lacuna_propuestas').insertOne({
      palabra: palabra.trim(),
      idioma: idioma.trim(),
      region: region?.trim() || '—',
      categoria: categoria || 'otras',
      breve: breve.trim(),
      largo: largo?.trim() || '',
      perifrasis: perifrasis?.trim() || '',
      autor: autor?.trim() || 'Anónimo',
      creadoEn: new Date(),
      revisada: false,
    });

    return NextResponse.json({ ok: true }, { status: 201, headers });
  } catch (error) {
    logger.error('Error guardando propuesta Lacuna:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500, headers });
  }
}
