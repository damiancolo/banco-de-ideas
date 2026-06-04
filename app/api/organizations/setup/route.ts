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

    const { name, context, organizerEmail, prizes, emails, inviteCode, files, logoBase64 } = await req.json();

    const validCode = process.env.SETUP_INVITE_CODE;
    if (!validCode || inviteCode !== validCode) {
      return NextResponse.json({ error: "Código de invitación inválido" }, { status: 400 });
    }

    if (!name || !organizerEmail || !organizerEmail.includes('@')) {
      return NextResponse.json({ error: "Faltan el nombre o el email del organizador" }, { status: 400 });
    }

    await connectDB();

    // Verificar que el código no se haya usado más de N veces
    const maxUses = parseInt(process.env.SETUP_INVITE_MAX_USES ?? '5', 10);
    const usedCount = await Organization.countDocuments({ createdViaInvite: true });
    if (usedCount >= maxUses) {
      return NextResponse.json({ error: "El código de invitación ya no está disponible." }, { status: 403 });
    }

    // Crear slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingOrg = await Organization.findOne({ slug });
    const finalSlug = existingOrg ? `${slug}-${Math.floor(Math.random() * 1000)}` : slug;

    const joinToken = `${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

    // Prizes: filter empty strings
    const validPrizes = (prizes as string[] ?? []).map((p: string) => p.trim()).filter(Boolean);

    const newOrg = await Organization.create({
      name,
      slug: finalSlug,
      joinToken,
      organizerEmail: organizerEmail.trim().toLowerCase(),
      prizes: validPrizes,
      logoUrl: logoBase64 || '',
      aiProvider: 'deepseek',
      aiModel: 'deepseek-v4-pro',
      status: 'active',
      createdViaInvite: true,
      programStartDate: new Date(),
      programEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      knowledgeBase: [
        ...(context?.trim() ? [{ filename: 'contexto_inicial.txt', content: context.trim(), uploadedAt: new Date() }] : []),
        ...((files as Array<{ filename: string; content: string }> | undefined) ?? []).map(f => ({
          filename: f.filename,
          content: f.content,
          uploadedAt: new Date()
        }))
      ]
    });

    // Membresía del organizador — usar ID real si ya está logueado, si no usar email (se reclamará al login)
    const session = await auth();
    const organizerDoc = await mongoose.connection.db?.collection('users').findOne({ email: organizerEmail.trim().toLowerCase() });
    const adminUserId = session?.user?.id ?? (organizerDoc ? organizerDoc._id.toString() : organizerEmail.trim().toLowerCase());

    await Membership.create({
      userId: adminUserId,
      organizationId: newOrg._id,
      role: 'admin',
      status: 'active'
    });

    // Membresías para emails de participantes invitados
    const validEmails = (emails as string[] ?? []).filter((e: string) => e && e.includes('@'));
    for (const email of validEmails) {
      const userDoc = await mongoose.connection.db?.collection('users').findOne({ email: email.trim().toLowerCase() });
      await Membership.create({
        userId: userDoc ? userDoc._id.toString() : email.trim().toLowerCase(),
        organizationId: newOrg._id,
        role: 'participant',
        status: 'active'
      });
    }

    return NextResponse.json({
      success: true,
      slug: finalSlug,
      joinToken,
      message: "Organización creada con éxito"
    });

  } catch (error: any) {
    console.error("Error en setup de organización:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
