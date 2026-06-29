"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface Organization {
    _id: string;
    name: string;
    slug: string;
    logoUrl: string;
}

interface Props {
    /** When set, shows the org name/logo instead of the personal user name */
    activeOrg?: { name: string; logoUrl?: string; inviteUrl?: string };
}

export default function PrivateHeader({ activeOrg }: Props = {}) {
    const { data: session } = useSession();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [copied, setCopied] = useState(false);

    const handleCopyInvite = useCallback(() => {
        if (!activeOrg?.inviteUrl) return;
        navigator.clipboard.writeText(activeOrg.inviteUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [activeOrg?.inviteUrl]);

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
                        {activeOrg ? (
                            activeOrg.logoUrl ? (
                                <img
                                    src={activeOrg.logoUrl}
                                    alt={activeOrg.name}
                                    className="w-8 h-8 rounded bg-gray-50 object-contain border border-gray-100"
                                />
                            ) : null
                        ) : (
                            session.user.image && (
                                <img
                                    src={session.user.image}
                                    alt=""
                                    className="w-8 h-8 rounded-full"
                                    referrerPolicy="no-referrer"
                                />
                            )
                        )}
                        <span className="text-sm font-medium text-gray-700 hidden sm:block">
                            {activeOrg ? activeOrg.name : session.user.name}
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
                                    className="transition-opacity hover:opacity-70"
                                >
                                    {org.logoUrl ? (
                                        <img
                                            src={org.logoUrl}
                                            alt={org.name}
                                            className="w-7 h-7 rounded bg-gray-50 object-contain border border-gray-100"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-gray-400 hover:text-[#C5A47E] transition-colors font-medium tracking-wide leading-none">
                                            {org.name.length > 12 ? org.name.slice(0, 12) + '…' : org.name}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {activeOrg?.inviteUrl && (
                        <button
                            onClick={handleCopyInvite}
                            title="Copiar link de invitación"
                            className="text-xs text-gray-400 hover:text-[#C5A47E] transition-colors border border-gray-200 hover:border-[#C5A47E] rounded-md px-2 py-1"
                        >
                            {copied ? '✓ Copiado' : '+ Invitar'}
                        </button>
                    )}
                    <Link
                        href="/planes"
                        className="text-sm text-gray-400 hover:text-[#C5A47E] transition-colors"
                        title="Programas"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </Link>
                    <Link
                        href="/privado/cuenta"
                        className="text-sm text-gray-400 hover:text-[#C5A47E] transition-colors"
                        title="Mi cuenta y mis datos"
                    >
                        Mi cuenta
                    </Link>
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

