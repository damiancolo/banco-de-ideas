"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function CuentaPage() {
    const [downloading, setDownloading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDownload() {
        setError(null);
        setDownloading(true);
        try {
            const res = await fetch("/api/privado/account");
            if (!res.ok) throw new Error("No se pudo exportar");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "mis-datos-banco-de-ideas.json";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            setError("No se pudieron descargar los datos. Probá de nuevo.");
        } finally {
            setDownloading(false);
        }
    }

    async function handleDelete() {
        setError(null);
        setDeleting(true);
        try {
            const res = await fetch("/api/privado/account", { method: "DELETE" });
            if (!res.ok) throw new Error("No se pudo eliminar");
            // Datos borrados: cerrar sesión y volver al inicio.
            await signOut({ callbackUrl: "/" });
        } catch {
            setError("No se pudo eliminar la cuenta. Probá de nuevo.");
            setDeleting(false);
            setConfirming(false);
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#F8F5F0] via-white to-[#EBE8E0] p-6 md:p-12">
            <div className="max-w-xl mx-auto pt-16">
                <Link href="/privado" className="text-sm text-gray-400 hover:text-[#C5A47E] transition-colors">
                    ← Volver
                </Link>

                <h1 className="text-3xl font-black text-[#C5A47E] mt-4 mb-2">Mi cuenta y mis datos</h1>
                <p className="text-gray-600 mb-8">
                    Gestioná tus datos personales. Podés descargar una copia o eliminar tu cuenta por completo.
                </p>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                        {error}
                    </div>
                )}

                {/* Exportar */}
                <section className="rounded-xl border border-gray-200 bg-white/70 p-5 mb-5">
                    <h2 className="font-bold text-gray-900 mb-1">Descargar mis datos</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Obtené una copia en formato JSON de tu perfil y todas tus ideas privadas.
                    </p>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="text-sm font-medium border border-gray-300 hover:border-[#C5A47E] hover:text-[#C5A47E] transition-colors rounded-lg px-4 py-2 disabled:opacity-50"
                    >
                        {downloading ? "Preparando…" : "Descargar (.json)"}
                    </button>
                </section>

                {/* Eliminar */}
                <section className="rounded-xl border border-red-200 bg-red-50/40 p-5">
                    <h2 className="font-bold text-gray-900 mb-1">Eliminar mi cuenta</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Borra de forma <strong>permanente e irreversible</strong> tu cuenta, tus ideas privadas y
                        tus datos de acceso. Esta acción no se puede deshacer.
                    </p>

                    {!confirming ? (
                        <button
                            onClick={() => setConfirming(true)}
                            className="text-sm font-medium text-red-600 border border-red-300 hover:bg-red-600 hover:text-white transition-colors rounded-lg px-4 py-2"
                        >
                            Eliminar mi cuenta
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-semibold text-red-700">
                                ¿Seguro? Se borrará todo y no se puede recuperar.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors rounded-lg px-4 py-2 disabled:opacity-50"
                                >
                                    {deleting ? "Eliminando…" : "Sí, eliminar definitivamente"}
                                </button>
                                <button
                                    onClick={() => setConfirming(false)}
                                    disabled={deleting}
                                    className="text-sm font-medium border border-gray-300 hover:border-gray-400 transition-colors rounded-lg px-4 py-2"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
