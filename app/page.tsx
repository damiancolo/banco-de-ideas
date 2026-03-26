"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ChatEngine from "@/components/ChatEngine";

export default function Home() {
  const [tooltipState, setTooltipState] = useState<"hidden" | "visible" | "fading">("hidden");

  useEffect(() => {
    const t1 = setTimeout(() => setTooltipState("visible"), 400);
    const t2 = setTimeout(() => setTooltipState("fading"), 5400);
    const t3 = setTimeout(() => setTooltipState("hidden"), 6100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 relative overflow-hidden transition-all duration-700 bg-background">
      {/* Semantic Content for SEO & Screen Readers */}
      <div className="sr-only">
        <h1>Banco de Ideas - Potenciando la Creatividad con IA</h1>
        <p>
          Herramienta inteligente para capturar ideas, generar bisociaciones (conexiones creativas)
          y recibir análisis de viabilidad en tiempo real. Tu co-piloto para la innovación.
        </p>
      </div>

      {/* Top Link: Lightbulb Button */}
      <Link
        href="/about"
        className="fixed top-10 left-1/2 -translate-x-1/2 z-[99999] p-4 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full cursor-pointer shadow-sm transition-all duration-300"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-600 hover:text-[#C5A47E] transition-colors">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18h6"></path>
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 22h4"></path>
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"></path>
        </svg>
      </Link>

      {/* Onboarding Tooltip */}
      {tooltipState !== "hidden" && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-opacity duration-700 ${tooltipState === "visible" ? "opacity-100" : "opacity-0"}`}
        >
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
            Revisa las ideas del banco aquí
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}

      <ChatEngine
        apiPrefix="/api"
        footerSlot={
          <div className="pb-8 flex items-center gap-4">
            {/* Bottom Icons: Folder + Analytics + Private Space */}
            <Link href="/banco" className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path>
              </svg>
            </Link>
            <Link href="/tracker" className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
              </svg>
            </Link>
            <Link href="/privado" className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </Link>
          </div>
        }
      />
    </main>
  );
}
