"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import ChatEngine from "@/components/ChatEngine";
import Lightbulb from "@/components/Lightbulb";

export default function Home() {
  const MESSAGES = [
    "Revisa las ideas del banco aquí",
    "Lee las increíbles ideas de otros",
    "Bisociaciones ajenas",
    "Lo que piensa la gente",
    "Las ideas son patrimonio humano",
    "ideas, ideas, ideas!!!",
    "Ideario colectivo",
    "Repositorio de ideas previas",
    "divagues hermosos",
    "Pensamientos sueltos de gente real",
    "El caos organizado de las ideas",
    "Mentes en ebullición",
    "Colectivo de mentes inquietas",
    "Lo que se les ocurrió a otros",
    "Chispazos colectivos",
    "El diván de las ideas",
    "El caldo de ideas",
    "Pensar en voz alta, juntos",
    "Destellos de creatividad colectiva",
    "Ideas que no caben en la cabeza de uno solo",
  ];

  const [tooltipState, setTooltipState] = useState<"hidden" | "visible" | "fading">("hidden");
  const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);
  const [tooltipBottom, setTooltipBottom] = useState<number | null>(null);
  /** Cuánto hubo que correr el cartel para que no se saliera de la pantalla. */
  const [tooltipDesvio, setTooltipDesvio] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const bancoRef = useRef<HTMLAnchorElement>(null);
  // Se incrementa cuando una idea entra de verdad en la base: enciende la lamparita.
  const [ideasGuardadas, setIdeasGuardadas] = useState(0);

  useEffect(() => {
    const show = () => {
      // Se mide en cada aparición y no una sola vez al montar: así el cartel
      // queda bien puesto aunque la ventana haya cambiado de tamaño.
      const rect = bancoRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltipLeft(rect.left + rect.width / 2);
      // Anclado al borde superior del icono, con 10 px de aire para la flecha.
      // Antes era un `bottom-20` fijo y el cartel se apoyaba encima de los iconos.
      setTooltipBottom(window.innerHeight - rect.top + 10);

      setTooltipDesvio(0);
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setTooltipState("visible");
      setTimeout(() => setTooltipState("fading"), 5000);
      setTimeout(() => setTooltipState("hidden"), 5700);
    };

    const t1 = setTimeout(show, 400);
    const t2 = setTimeout(show, 15000);
    const t3 = setTimeout(show, 30000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // El cartel se centra en el icono del banco, pero el más largo ("Ideas que no
  // caben en la cabeza de uno solo") se salía 11 px por la izquierda en un móvil
  // de 375 px. Se mide ya renderizado y se corre lo justo para que entre; la
  // flecha se compensa en sentido contrario para seguir apuntando al icono.
  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el || tooltipLeft === null) return;

    const MARGEN = 8;
    const mitad = el.offsetWidth / 2;
    const centroPermitido = Math.min(
      Math.max(tooltipLeft, MARGEN + mitad),
      window.innerWidth - MARGEN - mitad,
    );
    setTooltipDesvio(centroPermitido - tooltipLeft);
  }, [message, tooltipLeft]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-between p-4 md:p-6 relative overflow-hidden transition-all duration-700 bg-background">
      {/* Semantic Content for SEO & Screen Readers */}
      <div className="sr-only">
        <h1>Banco de Ideas - Potenciando la Creatividad con IA</h1>
        <p>
          Herramienta inteligente para capturar ideas, generar bisociaciones (conexiones creativas)
          y recibir análisis de viabilidad en tiempo real. Tu co-piloto para la innovación.
        </p>
      </div>

      <Lightbulb pulse={ideasGuardadas} />

      {/* Onboarding Tooltip */}
      {tooltipState !== "hidden" && tooltipLeft !== null && tooltipBottom !== null && (
        <div
          ref={tooltipRef}
          className={`fixed z-[9999] pointer-events-none transition-opacity duration-700 -translate-x-1/2 ${tooltipState === "visible" ? "opacity-100" : "opacity-0"}`}
          style={{ left: tooltipLeft + tooltipDesvio, bottom: tooltipBottom }}
        >
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
            {message}
          </div>
          <div
            className="absolute top-full -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"
            style={{ left: `calc(50% - ${tooltipDesvio}px)` }}
          />
        </div>
      )}

      <ChatEngine
        apiPrefix="/api"
        onIdeaSaved={() => setIdeasGuardadas((n) => n + 1)}
        footerSlot={
          <div className="pb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            {/* Bottom Icons: Folder + Analytics + Private Space */}
            <Link href="/banco" ref={bancoRef} className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
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
            <Link href="/planes" className="opacity-80 text-[#333] hover:text-[#C5A47E] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </Link>
          </div>
          <Link href="/privacidad" className="text-[11px] text-gray-400 hover:text-[#C5A47E] transition-colors">
            Privacidad
          </Link>
          </div>
        }
      />
    </main>
  );
}
