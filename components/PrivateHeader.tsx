"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function PrivateHeader() {
    const { data: session } = useSession();
    if (!session?.user) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
            <div className="max-w-xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {session.user.image && (
                        <img
                            src={session.user.image}
                            alt=""
                            className="w-8 h-8 rounded-full"
                            referrerPolicy="no-referrer"
                        />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                        {session.user.name}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-sm text-gray-400 hover:text-[#C5A47E] transition-colors"
                    >
                        Inicio
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="text-sm text-gray-500 hover:text-[#C5A47E] transition-colors"
                    >
                        Cerrar sesion
                    </button>
                </div>
            </div>
        </div>
    );
}
