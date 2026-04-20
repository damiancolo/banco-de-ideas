"use client";

import Link from "next/link";
import ChatEngine from "@/components/ChatEngine";
import PrivateHeader from "@/components/PrivateHeader";
import PWAInstallBanner from "@/components/PWAInstallBanner";

export default function PrivadoChat({ userId, userName }: { userId: string; userName?: string }) {
    return (
        <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 pt-20 relative overflow-hidden transition-all duration-700 bg-background">
            <PWAInstallBanner />
        <ChatEngine
                apiPrefix="/api/privado"
                userName={userName}
                headerSlot={<PrivateHeader />}
                footerSlot={
                    <div className="pb-8 flex items-center gap-4">
                        <Link href="/privado/banco" className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path>
                            </svg>
                        </Link>
                        <Link href="/" className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
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
