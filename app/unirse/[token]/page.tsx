import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import Organization from '@/lib/models/Organization';
import Membership from '@/lib/models/Membership';

export default async function UnirsePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const session = await auth();

    // Not logged in — send to Google login, then back here
    if (!session?.user?.id) {
        redirect(`/privado?callbackUrl=/unirse/${token}`);
    }

    await connectDB();

    const org = await Organization.findOne({
        joinToken: token.toUpperCase(),
        status: 'active',
    }).lean();

    if (!org) {
        // Invalid or expired token — land on a simple error page
        return (
            <main className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4">
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#8a7f72', marginBottom: 16 }}>
                    Enlace de invitación
                </p>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 300, color: '#181714', letterSpacing: '-0.02em', marginBottom: 12 }}>
                    Este enlace no es válido
                </h1>
                <p style={{ fontSize: 14, color: '#8a7f72' }}>
                    El programa puede haber finalizado o el enlace estar incorrecto. Contacta con quien te lo envió.
                </p>
            </main>
        );
    }

    // Already a member? Just send them in
    const existing = await Membership.findOne({
        userId: session.user.id,
        organizationId: (org as any)._id,
        status: 'active',
    }).lean();

    if (existing) {
        redirect(`/org/${org.slug}`);
    }

    // Create membership
    await Membership.create({
        userId: session.user.id,
        organizationId: (org as any)._id,
        role: 'participant',
        status: 'active',
    });

    redirect(`/org/${org.slug}`);
}
