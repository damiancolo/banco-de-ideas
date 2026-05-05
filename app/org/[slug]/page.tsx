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

    try {
        const membership = await requireMembership(slug, session);
        return (
            <OrgEnvironment
                organization={membership.organization}
                userName={session.user.name ?? undefined}
                role={membership.role}
            />
        );
    } catch (error) {
        redirect(`/privado?callbackUrl=/org/${slug}`);
    }
}
