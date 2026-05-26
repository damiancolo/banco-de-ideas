import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

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
    const body = await request.json();
    const { palabra, idioma, region, categoria, breve, largo, perifrasis, autor } = body;

    if (!palabra?.trim() || !idioma?.trim() || !breve?.trim()) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400, headers });
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
    console.error('Error guardando propuesta Lacuna:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500, headers });
  }
}
