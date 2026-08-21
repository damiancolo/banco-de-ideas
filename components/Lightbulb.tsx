"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { playSwitch } from "@/lib/sounds/lightbulb";

/** Cuánto dura el destello del guardado, en ms. */
const DURACION_DESTELLO = 600;

/**
 * Los estados de la lamparita viven en CSS y no en React a propósito: el hover
 * tiene que funcionar antes de que hidrate el JS, y `@media (hover: hover)`
 * resuelve solo el problema del móvil, donde un toque dejaría la luz pegada.
 * React sólo agrega la clase del destello.
 *
 * Las reglas de `.encendida` van después de las de `:hover` y con la misma
 * especificidad, así que ganan por orden: el destello del guardado siempre
 * pisa al hover.
 */
const CSS = `
.lampara-svg { color: #4b5563; filter: drop-shadow(0 0 0 rgba(242,200,121,0)); }
.lampara-vidrio, .lampara-filamento { opacity: 0; }
.lampara-svg, .lampara-vidrio, .lampara-filamento {
  transition: color 500ms ease-out, filter 500ms ease-out, opacity 500ms ease-out;
}

@media (hover: hover) {
  .lampara:hover .lampara-svg {
    color: #C5A47E;
    filter: drop-shadow(0 0 6px rgba(242,200,121,.75));
  }
  .lampara:hover .lampara-vidrio { opacity: .28; }
  .lampara:hover .lampara-filamento { opacity: 1; }
  /* Encender es rápido, como el filamento que salta; apagar es lento, como el
     filamento que se enfría. Por eso la duración corta va sólo en el hover. */
  .lampara:hover .lampara-svg,
  .lampara:hover .lampara-vidrio,
  .lampara:hover .lampara-filamento { transition-duration: 300ms; }
}

.lampara.encendida .lampara-svg {
  color: #C5A47E;
  filter: drop-shadow(0 0 10px rgba(242,200,121,.95)) drop-shadow(0 0 22px rgba(242,200,121,.55));
}
.lampara.encendida .lampara-vidrio { opacity: .5; }
.lampara.encendida .lampara-filamento { opacity: 1; }
.lampara.encendida .lampara-svg,
.lampara.encendida .lampara-vidrio,
.lampara.encendida .lampara-filamento { transition-duration: 120ms; }

@media (prefers-reduced-motion: reduce) {
  .lampara-svg, .lampara-vidrio, .lampara-filamento { transition-duration: 1ms !important; }
}
`;

interface LightbulbProps {
    /**
     * Contador que el padre incrementa cuando se guarda una idea. Cada cambio
     * dispara un destello. Es un número y no un booleano a propósito: dos
     * guardados seguidos tienen que encender la lamparita dos veces, y con un
     * booleano el segundo se perdería.
     */
    pulse?: number;
}

/**
 * La lamparita de arriba. Es el enlace a /about, y también el indicador de que
 * una idea entró.
 *
 * Al pasar el mouse se enciende y suena el clac de un interruptor. Al guardar una
 * idea da un destello más fuerte, a la par del arpegio de recompensa que dispara
 * el ChatEngine.
 *
 * El sonido del hover queda mudo hasta que el usuario haga el primer clic o pulse
 * una tecla en la página: los navegadores no habilitan el audio antes, y pasar el
 * mouse no cuenta como gesto. Es una limitación del navegador, no un fallo.
 */
export default function Lightbulb({ pulse = 0 }: LightbulbProps) {
    const [destello, setDestello] = useState(false);

    // El clac sólo en dispositivos con puntero de verdad. En una pantalla táctil
    // mouseenter se dispara con el toque, y sonaría al ir a /about.
    const sonarInterruptor = () => {
        if (typeof window === "undefined") return;
        if (!window.matchMedia?.("(hover: hover)").matches) return;
        playSwitch();
    };

    useEffect(() => {
        if (!pulse) return;
        setDestello(true);
        const t = setTimeout(() => setDestello(false), DURACION_DESTELLO);
        return () => clearTimeout(t);
    }, [pulse]);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <Link
                href="/about"
                aria-label="Sobre el proyecto"
                className={`lampara${destello ? " encendida" : ""} fixed top-10 left-1/2 -translate-x-1/2 z-[99999] p-4 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full cursor-pointer shadow-sm transition-all duration-300`}
                style={{ WebkitTapHighlightColor: "transparent" }}
                onMouseEnter={sonarInterruptor}
            >
                <svg
                    className="lampara-svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    {/* El vidrio, que se tiñe de luz cálida al encenderse */}
                    <path
                        className="lampara-vidrio"
                        d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"
                        fill="#F2C879"
                        stroke="none"
                    />

                    {/* El filamento: sólo se ve cuando hay corriente */}
                    <path
                        className="lampara-filamento"
                        d="M9.8 10.6l1.1-1.6 1.1 1.6 1.1-1.6 1.1 1.6"
                        stroke="#F2C879"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* El contorno de siempre */}
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18h6" />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 22h4" />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5" />
                </svg>
            </Link>
        </>
    );
}
