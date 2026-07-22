"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ChatEngine from "@/components/ChatEngine";
import PrivateHeader from "@/components/PrivateHeader";
import PWAInstallBanner from "@/components/PWAInstallBanner";

type ImportedItem = {
    ideaId: string;
    original: string;
    idea: string;
    similarTo: Array<{ text: string; similarity: number }>;
};

type ImportResult =
    | { reauth: true }
    | { error: string }
    | { imported: number; excluded: number; errors: number; items: ImportedItem[] };

export default function PrivadoChat({
    userId,
    userName,
    isOwner = false,
}: {
    userId: string;
    userName?: string;
    isOwner?: boolean;
}) {
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState<{ imported: number; excluded: number; errors: number } | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    async function runImport() {
        if (importing) return;
        setImporting(true);
        setResult(null);
        setProgress({ imported: 0, excluded: 0, errors: 0 });

        let imported = 0;
        let excluded = 0;
        let errors = 0;
        const items: ImportedItem[] = [];

        try {
            // El endpoint procesa en lotes; iteramos hasta agotar (con tope de seguridad).
            for (let i = 0; i < 100; i++) {
                const res = await fetch("/api/privado/importar-tasks", { method: "POST" });

                if (res.status === 401) {
                    const j = await res.json().catch(() => ({}));
                    if (j.error === "reauth") {
                        setResult({ reauth: true });
                        return;
                    }
                    throw new Error("No autorizado");
                }
                if (!res.ok) throw new Error("Error del servidor al importar");

                const data = await res.json();
                imported += data.imported?.length ?? 0;
                excluded += data.excluded?.length ?? 0;
                errors += data.errors?.length ?? 0;
                items.push(...(data.imported ?? []));
                setProgress({ imported, excluded, errors });

                if ((data.remaining ?? 0) <= 0 || !data.progressed) break;
            }
            setResult({ imported, excluded, errors, items });
        } catch (e) {
            setResult({ error: e instanceof Error ? e.message : "Error desconocido" });
        } finally {
            setImporting(false);
        }
    }

    // Al volver del consent de Google Tasks (?tasks=connected), disparamos la
    // importación automáticamente y limpiamos la URL.
    useEffect(() => {
        if (!isOwner) return;
        const params = new URLSearchParams(window.location.search);
        const tasks = params.get("tasks");
        if (!tasks) return;
        window.history.replaceState({}, "", window.location.pathname);
        if (tasks === "connected") {
            runImport();
        } else if (tasks === "denied" || tasks === "error") {
            setResult({ error: "No se pudo conectar Google Tasks. Probá de nuevo." });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 pt-20 relative overflow-hidden transition-all duration-700 bg-background">
            <PWAInstallBanner />
            <ChatEngine
                apiPrefix="/api/privado"
                userName={userName}
                headerSlot={<PrivateHeader />}
                extraMenuOptions={
                    isOwner
                        ? [{ emoji: "📥", label: "Importar del Task", onClick: runImport }]
                        : undefined
                }
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

            {(importing || result) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 md:p-8">
                        {importing ? (
                            <div className="text-center py-6">
                                <div className="mx-auto w-10 h-10 border-3 border-[#C5A47E] border-t-transparent rounded-full animate-spin mb-5" />
                                <h2 className="text-lg font-bold text-gray-900 mb-1">Importando ideas de tu Task…</h2>
                                <p className="text-sm text-gray-500">
                                    {progress
                                        ? `${progress.imported} ideas · ${progress.excluded} descartadas${progress.errors ? ` · ${progress.errors} con error` : ""}`
                                        : "Leyendo tus tareas…"}
                                </p>
                                <p className="text-xs text-gray-400 mt-3">Puede tardar un rato si tenés muchas tareas.</p>
                            </div>
                        ) : result && "reauth" in result ? (
                            <div className="text-center py-4">
                                <div className="text-3xl mb-3">🔑</div>
                                <h2 className="text-lg font-bold text-gray-900 mb-2">Conectá Google Tasks</h2>
                                <p className="text-sm text-gray-500 mb-5">
                                    Una sola vez: autorizá el acceso de lectura a tus Google Tasks.
                                    Al volver, la importación arranca sola.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <a
                                        href="/api/privado/google-tasks/connect"
                                        className="px-5 py-2 rounded-xl bg-[#C5A47E] text-white text-sm font-medium hover:bg-[#b08e68] transition-colors"
                                    >
                                        Conectar Google Tasks
                                    </a>
                                    <button onClick={() => setResult(null)} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
                                        Ahora no
                                    </button>
                                </div>
                            </div>
                        ) : result && "error" in result ? (
                            <div className="text-center py-4">
                                <div className="text-3xl mb-3">⚠️</div>
                                <h2 className="text-lg font-bold text-gray-900 mb-2">Algo falló</h2>
                                <p className="text-sm text-gray-500 mb-5">{result.error}</p>
                                <button onClick={() => setResult(null)} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
                                    Cerrar
                                </button>
                            </div>
                        ) : result ? (
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Listo</h2>
                                        <p className="text-sm text-gray-500">
                                            {result.imported} ideas nuevas · {result.excluded} descartadas
                                            {result.errors ? ` · ${result.errors} con error` : ""}
                                        </p>
                                    </div>
                                    <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                                </div>

                                {result.items.length > 0 ? (
                                    <ul className="space-y-3 mb-5">
                                        {result.items.map((it) => (
                                            <li key={it.ideaId} className="border border-gray-100 rounded-xl p-3">
                                                <p className="text-sm text-gray-800">{it.idea}</p>
                                                <p className="text-xs text-gray-400 mt-1 italic">del task: “{it.original}”</p>
                                                {it.similarTo?.length > 0 && (
                                                    <p className="text-xs text-[#C5A47E] mt-1">
                                                        ≈ parecida a: {it.similarTo.map((s) => `“${s.text}” (${Math.round(s.similarity * 100)}%)`).join(" · ")}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500 mb-5">No hubo ideas nuevas para importar.</p>
                                )}

                                <div className="flex gap-3">
                                    <Link href="/privado/banco" className="flex-1 text-center px-5 py-2.5 rounded-xl bg-[#C5A47E] text-white text-sm font-medium hover:bg-[#b08e68] transition-colors">
                                        Ver en mi banco
                                    </Link>
                                    <button onClick={() => setResult(null)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </main>
    );
}
