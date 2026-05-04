"use client";

import Link from "next/link";
import ChatEngine from "@/components/ChatEngine";
import PrivateHeader from "@/components/PrivateHeader";

interface OrgPublicFields {
    _id: string;
    name: string;
    slug: string;
    logoUrl: string;
}

export default function OrgEnvironment({ 
    organization, 
    userName 
}: { 
    organization: OrgPublicFields; 
    userName?: string 
}) {
    return (
        <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 pt-20 relative overflow-hidden transition-all duration-700 bg-background">
            <ChatEngine
                apiPrefix={`/api/organizations/${organization.slug}`}
                userName={userName}
                headerSlot={<PrivateHeader />}
                footerSlot={
                    <div className="pb-8 flex items-center gap-4">
                        <Link href={`/org/${organization.slug}/banco`} title="Repositorio de la empresa" className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
                            <img src={organization.logoUrl} alt={organization.name} className="w-6 h-6 object-contain rounded-sm" />
                        </Link>
                        <Link href="/privado" title="Espacio personal" className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </Link>
                        <Link href="/" title="Inicio público" className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        </Link>
                    </div>
                }
            />
        </main>
    );
}
