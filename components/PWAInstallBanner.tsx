"use client";

import { useEffect, useState } from "react";

type Platform = "ios-safari" | "ios-chrome" | "android" | null;

function detectPlatform(): Platform {
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    if (isIOS) {
        // CriOS = Chrome on iOS, FxiOS = Firefox on iOS
        const isNonSafari = /CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
        return isNonSafari ? "ios-chrome" : "ios-safari";
    }
    if (/android/i.test(ua)) return "android";
    return null;
}

function isStandalone(): boolean {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
    );
}

function isMobile(): boolean {
    return window.innerWidth < 768 || /mobi|android|iphone|ipad/i.test(navigator.userAgent);
}

export default function PWAInstallBanner() {
    const [platform, setPlatform] = useState<Platform>(null);
    const [visible, setVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt?: () => void } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isStandalone()) return;
        if (!isMobile()) return;
        if (sessionStorage.getItem("pwa-banner-dismissed")) return;

        const p = detectPlatform();
        if (!p) return;

        setPlatform(p);
        setVisible(true);

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as Event & { prompt?: () => void });
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const dismiss = () => {
        sessionStorage.setItem("pwa-banner-dismissed", "1");
        setVisible(false);
    };

    const installAndroid = () => {
        if (deferredPrompt?.prompt) deferredPrompt.prompt();
        dismiss();
    };

    const copyLink = async () => {
        await navigator.clipboard.writeText("https://www.unbancodeideas.com/privado");
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden">
            <div className="bg-white border border-[#C5A47E]/30 rounded-2xl shadow-lg p-4 relative">

                {/* Dismiss */}
                <button
                    onClick={dismiss}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Cerrar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-3 pr-6">
                    <div className="w-10 h-10 rounded-xl bg-[#F8F5F0] flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C5A47E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18h6"/><path d="M10 22h4"/>
                            <path d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Instalá como app</p>
                        <p className="text-xs text-gray-500">Un toque desde tu pantalla de inicio</p>
                    </div>
                </div>

                {/* iOS Safari */}
                {platform === "ios-safari" && (
                    <div className="bg-[#F8F5F0] rounded-xl p-3 text-xs text-gray-600 space-y-2">
                        <p className="flex items-center gap-2">
                            <span className="font-bold text-[#C5A47E]">1.</span>
                            Tocá
                            <span className="inline-flex items-center gap-1 font-semibold text-gray-800 bg-white rounded-lg px-1.5 py-0.5 border border-gray-200">
                                Compartir
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                                </svg>
                            </span>
                            (barra inferior)
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="font-bold text-[#C5A47E]">2.</span>
                            Elegí <strong className="text-gray-800">&ldquo;Agregar a pantalla de inicio&rdquo;</strong>
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="font-bold text-[#C5A47E]">3.</span>
                            Tocá <strong className="text-gray-800">Agregar</strong> — ¡listo!
                        </p>
                    </div>
                )}

                {/* iOS Chrome — necesita Safari */}
                {platform === "ios-chrome" && (
                    <div className="space-y-2">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1.5">
                            <p className="font-semibold flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                Solo se puede instalar desde Safari
                            </p>
                            <p className="text-amber-700">Apple no permite instalarlo desde Chrome en iPhone. Seguí estos pasos:</p>
                        </div>
                        <div className="bg-[#F8F5F0] rounded-xl p-3 text-xs text-gray-600 space-y-2">
                            <p className="flex items-start gap-2">
                                <span className="font-bold text-[#C5A47E] mt-0.5">1.</span>
                                <span>Copiá el link de esta app</span>
                            </p>
                            <button
                                onClick={copyLink}
                                className="w-full flex items-center justify-center gap-2 bg-[#C5A47E] hover:bg-[#b08e68] text-white text-xs font-medium rounded-lg py-2 transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                        ¡Copiado!
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                        </svg>
                                        Copiar link
                                    </>
                                )}
                            </button>
                            <p className="flex items-start gap-2">
                                <span className="font-bold text-[#C5A47E] mt-0.5">2.</span>
                                <span>Abrí <strong className="text-gray-800">Safari</strong> y pegá el link</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="font-bold text-[#C5A47E] mt-0.5">3.</span>
                                <span>Tocá <strong className="text-gray-800">Compartir</strong> → <strong className="text-gray-800">&ldquo;Agregar a pantalla de inicio&rdquo;</strong></span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Android */}
                {platform === "android" && (
                    <div className="space-y-2">
                        {deferredPrompt ? (
                            <button
                                onClick={installAndroid}
                                className="w-full bg-[#C5A47E] hover:bg-[#b08e68] text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
                            >
                                Instalar app
                            </button>
                        ) : (
                            <div className="bg-[#F8F5F0] rounded-xl p-3 text-xs text-gray-600 space-y-2">
                                <p className="flex items-center gap-2">
                                    <span className="font-bold text-[#C5A47E]">1.</span>
                                    Tocá el menú <strong className="text-gray-800">⋮</strong> de Chrome (arriba a la derecha)
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-bold text-[#C5A47E]">2.</span>
                                    Elegí <strong className="text-gray-800">&ldquo;Instalar app&rdquo;</strong>
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
