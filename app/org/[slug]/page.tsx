import { auth } from "@/auth";
import { requireMembership } from "@/lib/enterprise/auth";
import { redirect } from "next/navigation";
import OrgEnvironment from "./OrgEnvironment";

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect(`/privado?callbackUrl=/org/${slug}`);
    }

    let membership;
    try {
        membership = await requireMembership(slug, session);
    } catch (error: any) {
        console.error('[OrgPage] requireMembership error:', error?.message ?? error);
        redirect(`/privado?callbackUrl=/org/${slug}`);
    }

    // Serialize only the fields OrgEnvironment needs (no Date objects)
    const org = {
        _id: membership.organization._id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        logoUrl: membership.organization.logoUrl ?? '',
        joinToken: membership.organization.joinToken,
    };

    return (
        <OrgEnvironment
            organization={org}
            userName={session!.user!.name ?? undefined}
            role={membership.role}
        />
    );
}
