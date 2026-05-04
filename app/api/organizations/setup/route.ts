import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Organization from "@/lib/models/Organization";
import Membership from "@/lib/models/Membership";
import mongoose from "mongoose";
import { checkRateLimit } from "@/lib/rate-limit";
import { getIp } from "@/lib/request-utils";

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    const rateLimit = await checkRateLimit(ip, 'org-setup', 3, 60);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Demasiados intentos. Inténtalo más tarde." }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { name, context, emails, inviteCode, files, logoBase64 } = await req.json();

    const validCode = process.env.SETUP_INVITE_CODE;
    if (!validCode || inviteCode !== validCode) {
      return NextResponse.json({ error: "Código de invitación inválido" }, { status: 400 });
    }

    if (!name || !context) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    await connectDB();

    // Verificar que el código no se haya usado más de 5 veces
    const maxUses = parseInt(process.env.SETUP_INVITE_MAX_USES ?? '5', 10);
    const usedCount = await Organization.countDocuments({ createdViaInvite: true });
    if (usedCount >= maxUses) {
      return NextResponse.json({ error: "El código de invitación ya no está disponible." }, { status: 403 });
    }

    // 1. Crear la Organización
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Verificar si el slug existe
    const existingOrg = await Organization.findOne({ slug });
    const finalSlug = existingOrg ? `${slug}-${Math.floor(Math.random() * 1000)}` : slug;

    const newOrg = await Organization.create({
      name,
      slug: finalSlug,
      logoUrl: logoBase64 || '',
      aiProvider: 'deepseek',
      aiModel: 'deepseek-chat',
      status: 'active',
      createdViaInvite: true,
      programStartDate: new Date(),
      programEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días de prueba
      knowledgeBase: [
        // Contexto libre del formulario (solo si no está vacío)
        ...(context?.trim() ? [{ filename: 'contexto_inicial.txt', content: context.trim(), uploadedAt: new Date() }] : []),
        // Archivos subidos
        ...((files as Array<{ filename: string; content: string }> | undefined) ?? []).map(f => ({
          filename: f.filename,
          content: f.content,
          uploadedAt: new Date()
        }))
      ]
    });

    // 2. Crear membresía para el creador (como admin)
    await Membership.create({
      userId: session.user.id,
      organizationId: newOrg._id,
      role: 'admin',
      status: 'active'
    });

    // 3. Crear membresías para los emails invitados
    const validEmails = emails.filter((e: string) => e && e.includes('@'));
    
    for (const email of validEmails) {
      // Intentar encontrar al usuario por email para obtener su ID real
      // Nota: Esto asume que el sistema de auth usa el email como identificador o permite buscarlo
      const userDoc = await mongoose.connection.db?.collection('users').findOne({ email });
      
      await Membership.create({
        userId: userDoc ? userDoc._id.toString() : email, // Si no existe, guardamos el email temporalmente
        organizationId: newOrg._id,
        role: 'participant',
        status: 'active'
      });
    }

    return NextResponse.json({ 
      success: true, 
      slug: finalSlug,
      message: "Organización creada con éxito" 
    });

  } catch (error: any) {
    console.error("Error en setup de organización:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
