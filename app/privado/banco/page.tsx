import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserIdeas } from "@/lib/db";
import { isDBConnected } from "@/lib/mongodb";
import BancoView from "@/components/BancoView";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PrivadoBancoPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/privado");

    const ideas = await getUserIdeas(session.user.id);
    const connected = isDBConnected();

    return (
        <main className="min-h-screen bg-[#F8F5F0] p-6 md:p-12 relative">
            {/* Header */}
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                    {session.user.image && (
                        <img
                            src={session.user.image}
                            alt=""
                            className="w-8 h-8 rounded-full"
                            referrerPolicy="no-referrer"
                        />
                    )}
                    <span className="text-sm font-medium text-gray-600">Mis Ideas</span>
                </div>
                <Link
                    href="/privado"
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </Link>
            </div>

            <BancoView
                initialIdeas={ideas}
                isConnected={connected}
                apiPrefix="/api/privado"
                userName={session.user.name ?? undefined}
            />
        </main>
    );
}
