"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Organization {
    _id: string;
    name: string;
    slug: string;
    logoUrl: string;
}

export default function PrivateHeader() {
    const { data: session } = useSession();
    const [orgs, setOrgs] = useState<Organization[]>([]);

    useEffect(() => {
        if (session?.user) {
            fetch("/api/organizations/me")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setOrgs(data);
                    }
                })
                .catch(err => console.error("Error fetching organizations:", err));
        }
    }, [session]);

    if (!session?.user) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
            <div className="max-w-xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/privado" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        {session.user.image && (
                            <img
                                src={session.user.image}
                                alt=""
                                className="w-8 h-8 rounded-full"
                                referrerPolicy="no-referrer"
                            />
                        )}
                        <span className="text-sm font-medium text-gray-700 hidden sm:block">
                            {session.user.name}
                        </span>
                    </Link>

                    {/* Organization Logos */}
                    {orgs.length > 0 && (
                        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
                            {orgs.map(org => (
                                <Link 
                                    key={org._id} 
                                    href={`/org/${org.slug}`}
                                    title={org.name}
                                    className="transition-transform hover:scale-110"
                                >
                                    <img 
                                        src={org.logoUrl} 
                                        alt={org.name} 
                                        className="w-7 h-7 rounded bg-gray-50 object-contain border border-gray-100"
                                    />
                                </Link>
                            ))}
                        </div>
                    )}
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

