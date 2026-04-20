"use client";

import { useEffect, useState } from "react";

type Platform = "ios" | "android" | null;

function detectPlatform(): Platform {
    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua)) return "ios";
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

    useEffect(() => {
        // Don't show if: already installed, desktop, or dismissed before
        if (isStandalone()) return;
        if (!isMobile()) return;
        if (sessionStorage.getItem("pwa-banner-dismissed")) return;

        const p = detectPlatform();
        if (!p) return;

        setPlatform(p);
        setVisible(true);

        // Android: capture native install prompt
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
        if (deferredPrompt?.prompt) {
            deferredPrompt.prompt();
        }
        dismiss();
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

                {/* Icon + title */}
                <div className="flex items-center gap-3 mb-3 pr-6">
                    <div className="w-10 h-10 rounded-xl bg-[#F8F5F0] flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C5A47E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18h6"/><path d="M10 22h4"/>
                            <path d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Instalá la app</p>
                        <p className="text-xs text-gray-500">Accedé con un toque desde tu pantalla de inicio</p>
                    </div>
                </div>

                {/* Instructions */}
                {platform === "ios" && (
                    <div className="bg-[#F8F5F0] rounded-xl p-3 text-xs text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                            <span className="text-base">1.</span>
                            Tocá el botón
                            <span className="inline-flex items-center gap-0.5 font-medium text-gray-800">
                                Compartir
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                                </svg>
                            </span>
                            en Safari
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-base">2.</span>
                            Elegí <strong className="text-gray-800">&ldquo;Agregar a pantalla de inicio&rdquo;</strong>
                        </p>
                        <p className="text-[10px] text-gray-400 pt-1">Debe abrirse en Safari (no Chrome) para poder instalarlo</p>
                    </div>
                )}

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
                            <div className="bg-[#F8F5F0] rounded-xl p-3 text-xs text-gray-600 space-y-1">
                                <p className="flex items-center gap-2">
                                    <span>1.</span> Tocá el menú <strong className="text-gray-800">⋮</strong> de Chrome
                                </p>
                                <p className="flex items-center gap-2">
                                    <span>2.</span> Elegí <strong className="text-gray-800">&ldquo;Instalar app&rdquo;</strong> o <strong className="text-gray-800">&ldquo;Agregar a pantalla de inicio&rdquo;</strong>
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
