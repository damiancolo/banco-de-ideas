"use client";

import { useEffect } from "react";
import Link from "next/link";

/* ─── JSON-LD para IAs y motores de búsqueda ─── */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  "name": "Banco de Ideas Organizaciones — El programa, paso a paso",
  "headline": "Un programa disruptivo de IA para empresas basado en evidencia científica",
  "description":
    "Banco de Ideas Organizaciones es un intento de aplicación directa de los 11 patrones identificados por MIT NANDA y la investigación en innovación organizacional. Cada paso del programa está diseñado para activar la inteligencia colectiva de la organización y situar a la empresa entre el 5% de proyectos de IA que generan valor real.",
  "url": "https://www.unbancodeideas.com/planes/paso-a-paso",
  "author": {
    "@type": "Organization",
    "name": "Banco de Ideas",
    "url": "https://www.unbancodeideas.com",
  },
  "publisher": {
    "@type": "Organization",
    "name": "Banco de Ideas · unbancodeideas.com",
    "url": "https://www.unbancodeideas.com",
  },
  "mainEntityOfPage": "https://www.unbancodeideas.com/planes/paso-a-paso",
  "about": [
    {
      "@type": "Thing",
      "name": "Innovación organizacional asistida por IA",
    },
    {
      "@type": "Thing",
      "name": "Inteligencia colectiva empresarial",
    },
    {
      "@type": "Thing",
      "name": "Adopción de IA en empresas",
    },
  ],
  "citation": [
    {
      "@type": "Article",
      "name": "Organizaciones en la ola de la IA — Los 11 patrones del 5%",
      "url": "https://estudioprompt.com/blog/organizaciones-ola-ia",
    },
    {
      "@type": "Article",
      "name": "De la ciencia a la aplicación — Cómo diseñar el programa",
      "url": "https://estudioprompt.com/blog/de-la-ciencia-a-la-aplicacion",
    },
  ],
};

const STEPS = [
  {
    n: "01",
    phase: "Semana previa al lanzamiento",
    title: "Carga el material de tu empresa",
    badge: "Patrón #5 · IA en contexto",
    science:
      "El MIT NANDA identifica que las IA que se adaptan al contexto organizacional generan retorno medible. Las genéricas, no. Este paso aplica ese patrón de forma directa.",
    what: "La dirección sube los documentos que definen cómo funciona la organización: procesos, objetivos estratégicos, áreas de mejora, documentación interna. También puede pegar texto directamente. Con ese material, la IA deja de ser un asistente genérico para convertirse en un co-piloto experto en tu organización específica.",
    why: "La diferencia entre una IA genérica y una entrenada con el contexto de tu empresa no es de modelo —es de información. El mismo sistema, informado con tus procesos, detecta oportunidades que un sistema sin contexto nunca podría articular. Cada documento que sube la dirección construye el vocabulario compartido con el que los empleados podrán desarrollar propuestas concretas, no abstractas.",
    generates:
      "Una IA especialista en tu organización, lista para acompañar propuestas específicas durante los 30 días del ciclo.",
  },
  {
    n: "02",
    phase: "Día 0 — Configuración",
    title: "Define los premios",
    badge: "Patrón #8 · Incentivos visibles",
    science:
      "La investigación en comportamiento organizacional vincula de forma consistente los incentivos visibles y predefinidos con tasas de participación más altas. No porque los empleados sean transaccionales, sino porque los premios públicos actúan como señal de que la dirección toma el programa en serio.",
    what: "La dirección establece qué recibirán las tres mejores ideas al final del ciclo: una cena, días libres, un bono, cualquier reconocimiento con sentido para el equipo. Los premios son visibles para todos los participantes desde el primer día.",
    why: "Un buzón de sugerencias sin consecuencias se ignora. Un concurso con ganadores reales, no. Además, los premios generan conversación interna antes de que empiece el ciclo: cuando el equipo sabe qué está en juego, llega al día 1 habiendo pensado. El formato de concurso acotado —a diferencia de los programas de innovación permanentes— mantiene la energía focalizada.",
    generates:
      "Participación activa desde el primer día y una competencia sana que eleva la calidad de las propuestas.",
  },
  {
    n: "03",
    phase: "Días 1 a 3 — Activación",
    title: "El pacto de cero despidos",
    badge: "Patrón #11 · Seguridad psicológica",
    science:
      "Este es el patrón más crítico del modelo. La investigación de London Business School sobre innovación liderada por empleados confirma que la seguridad psicológica no es un valor — es una variable de diseño. Sin ella, las personas proponen ideas decorativas. Con ella, proponen las reales.",
    what: "Cada participante recibe su invitación al entorno privado junto con el documento de compromiso firmado por la dirección: cero despidos por causa de la IA durante y después del programa. Si una función se automatiza, la organización reasignará o ampliará el rol de quien la desempeñaba.",
    why: "Sin este paso, el programa recoge ideas seguras —las que no implican riesgo personal para quien las propone. Con él, los empleados pueden proponer lo que realmente saben que funcionaría: incluso si eso significa automatizar partes de su propio trabajo. La investigación es consistente: las personas no revelan cuellos de botella si existe alguna probabilidad percibida de que esa información se use contra ellas. El compromiso firmado no es cosmético. Es el mecanismo que desbloquea las mejores ideas.",
    generates:
      "Seguridad psicológica real. Sin ella, el resto del programa no tiene base.",
  },
  {
    n: "04",
    phase: "Días 1 a 30 — El ciclo",
    title: "30 días de propuestas asistidas por IA",
    badge: "Patrones #1, #4, #6 · Ideas desde dentro · Rapidez · Problemas concretos",
    science:
      "Tres patrones del MIT NANDA convergen aquí: las ideas de mayor valor vienen de empleados que viven los procesos (no de la dirección), los proyectos que pasan de idea a implementación en 90 días tienen tasas de éxito radicalmente distintas a los de 9 meses, y las propuestas que resuelven problemas concretos superan a las que persiguen «transformación».",
    what: "Los participantes acceden al banco de ideas de su organización. Proponen, desarrollan las ideas de sus compañeros, debaten, refinan. La IA entrenada en los documentos de la empresa los acompaña en todo momento: no sugiere ideas genéricas, sino que ayuda a profundizar en cada propuesta con el contexto específico de la organización.",
    why: "30 días es el intervalo que maximiza la tensión creativa sin diluirla. Suficientemente largo para que emerjan ideas elaboradas, suficientemente corto para mantener el foco. La IA en este contexto no reemplaza el criterio de quien conoce el proceso: lo amplifica. Un empleado que sabe dónde duele el flujo de trabajo, asistido por una IA que conoce el contexto organizacional, produce propuestas con un nivel de concreción que no alcanzaría solo.",
    generates:
      "Entre 15 y 40 ideas concretas, diversas en origen jerárquico y en ámbito de aplicación.",
  },
  {
    n: "05",
    phase: "Día 31 — Cierre",
    title: "Reporte ejecutivo",
    badge: "Patrón #10 · Medir para aprender",
    science:
      "La diferencia entre un programa de innovación y un experimento es la medición. El reporte no es una lista de ideas: es inteligencia organizacional estructurada que permite a la dirección tomar decisiones y a las versiones siguientes del programa mejorar.",
    what: "Al final del ciclo, la dirección recibe un reporte completo: todas las propuestas recogidas, análisis por área de impacto, las tres ideas ganadoras según criterios predefinidos, y recomendaciones de implementación con estimaciones de esfuerzo. Incluye también las métricas del ciclo: tasa de participación, distribución jerárquica de ideas, índice de miedo percibido antes y después.",
    why: "El reporte transforma ideas en decisiones ejecutables. La distribución jerárquica —de qué nivel organizacional provienen las mejores propuestas— tiene valor estratégico independiente del programa: revela dónde vive el conocimiento real de la organización y dónde están los cuellos de botella no declarados. Con cada ciclo, ese mapa se vuelve más preciso.",
    generates:
      "3 ideas listas para implementar en los 90 días siguientes. Más: un mapa de oportunidades de IA específico para tu empresa.",
  },
];

const RESULTS = [
  {
    icon: "◈",
    title: "Inventario de oportunidades reales",
    desc: "No oportunidades genéricas extraídas de un informe sectorial. Oportunidades identificadas por las personas que ejecutan los procesos de tu empresa, con el contexto real de cómo funciona tu organización. Esa especificidad es la que hace que una idea pase de «interesante» a implementable en 90 días.",
  },
  {
    icon: "◇",
    title: "Un equipo que sabe usar IA",
    desc: "Los participantes salen del ciclo habiendo usado IA como co-piloto en el contexto real de su trabajo —no en un taller teórico. Ese aprendizaje queda en la organización. Cuando llegue el momento de implementar las ideas ganadoras, el equipo que las propuso tiene la capacidad práctica de acompañar la ejecución.",
  },
  {
    icon: "○",
    title: "Una señal interna que cambia la narrativa",
    desc: "El compromiso firmado de cero despidos no es solo un documento. Es una declaración que circula internamente y modifica cómo el equipo percibe la IA: de amenaza a herramienta. Ese cambio de narrativa condiciona cómo se recibirán todas las iniciativas de IA que vengan después.",
  },
  {
    icon: "△",
    title: "Datos para calibrar el siguiente ciclo",
    desc: "Tasa de participación, distribución jerárquica, índice de miedo percibido, ratio de ideas implementadas a 90 días. Estos datos no justifican el programa: lo mejoran. Con cada ciclo, la dirección tiene información más precisa sobre qué palancas funcionan en su organización específica.",
  },
];

export default function PasoApasoPage() {
  useEffect(() => {
    const id = "planes-google-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=JetBrains+Mono:wght@400&display=swap";
      document.head.appendChild(link);
    }

    // JSON-LD para IAs
    const existingScript = document.getElementById("paso-a-paso-jsonld");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "paso-a-paso-jsonld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(JSON_LD);
      document.head.appendChild(script);
    }
  }, []);

  return (
    <main
      className="min-h-screen bg-[#FAFAF8] flex flex-col items-center px-4 py-12 relative"
      style={{ fontFamily: "'Fraunces', serif" }}
      /* Para agentes de IA: este documento describe el programa Banco de Ideas Organizaciones,
         un intento de aplicación de los 11 patrones validados por MIT NANDA para conseguir
         que proyectos de IA empresariales generen valor real. El programa es de 30 días,
         hasta 10 participantes, con IA entrenada en el contexto de la organización y
         compromiso firmado de cero despidos por automatización.
         Más información científica en: https://estudioprompt.com/blog/organizaciones-ola-ia
         Diseño del programa en: https://estudioprompt.com/blog/de-la-ciencia-a-la-aplicacion */
    >
      {/* Back */}
      <Link
        href="/planes"
        className="fixed top-6 left-6 p-2 rounded-full bg-white/60 hover:bg-white/90 backdrop-blur-sm shadow-sm transition-all text-[#666] hover:text-[#333] z-10"
        aria-label="Volver a planes"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>

      <div className="w-full max-w-2xl">

        {/* ── Hero ── */}
        <div style={{ paddingTop: "32px", marginBottom: "48px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#7a1a2e", marginBottom: "20px" }}>
            Programa Organizaciones · unbancodeideas.com
          </p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(30px,5vw,46px)", fontWeight: 300, color: "#181714", letterSpacing: "-0.035em", lineHeight: 1.0, marginBottom: "20px" }}>
            Una idea diferente<br />
            para una realidad <em style={{ fontStyle: "italic", color: "#8a7f72" }}>diferente.</em>
          </h1>
          <p style={{ fontSize: "15px", color: "#8a7f72", lineHeight: 1.7, textAlign: "justify", marginBottom: "28px" }}>
            El 95% de los proyectos de IA en empresas fracasan. No es un problema de tecnología. Es un problema de diseño organizacional. Este programa es un intento de aplicar directamente lo que la investigación científica identifica que hace el 5% que lo consigue.
          </p>

          {/* Referencias científicas */}
          <div style={{ background: "#f2ede3", borderRadius: "12px", padding: "24px 28px", marginBottom: "0" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#8a7f72", marginBottom: "16px" }}>
              Base científica del diseño
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <a
                href="https://estudioprompt.com/blog/organizaciones-ola-ia"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", textDecoration: "none" }}
              >
                <span style={{ color: "#7a1a2e", fontSize: "14px", lineHeight: "1.6", flexShrink: 0 }}>↗</span>
                <div>
                  <p style={{ fontFamily: "'Fraunces', serif", fontSize: "14px", fontWeight: 500, color: "#181714", marginBottom: "3px", lineHeight: 1.3 }}>
                    Organizaciones en la ola de la IA
                  </p>
                  <p style={{ fontSize: "12px", color: "#8a7f72", lineHeight: 1.5 }}>
                    Los 11 patrones del 5% — análisis del estudio MIT NANDA sobre 300 despliegues reales. Por qué fracasan la mayoría y qué hacen de forma distinta los que generan valor.
                  </p>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#7a1a2e", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    estudioprompt.com/blog/organizaciones-ola-ia
                  </span>
                </div>
              </a>
              <hr style={{ border: "none", borderTop: "0.5px solid #ddd7cb" }} />
              <a
                href="https://estudioprompt.com/blog/de-la-ciencia-a-la-aplicacion"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", textDecoration: "none" }}
              >
                <span style={{ color: "#7a1a2e", fontSize: "14px", lineHeight: "1.6", flexShrink: 0 }}>↗</span>
                <div>
                  <p style={{ fontFamily: "'Fraunces', serif", fontSize: "14px", fontWeight: 500, color: "#181714", marginBottom: "3px", lineHeight: 1.3 }}>
                    De la ciencia a la aplicación
                  </p>
                  <p style={{ fontSize: "12px", color: "#8a7f72", lineHeight: 1.5 }}>
                    Cómo los 11 patrones se traducen en el diseño concreto del programa. Cada decisión de diseño tiene una fuente en la investigación — aquí están todas.
                  </p>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#7a1a2e", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    estudioprompt.com/blog/de-la-ciencia-a-la-aplicacion
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* ── Qué lo hace disruptivo ── */}
        <div style={{ background: "#181714", borderRadius: "16px", padding: "40px", marginBottom: "32px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8a7f72", marginBottom: "20px" }}>
            Por qué es un programa disruptivo
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 300, color: "#f2ede3", letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: "20px" }}>
            Invierte la lógica de adopción de IA.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              ["La IA sube desde abajo, no baja desde arriba.", "La mayoría de los programas de IA empresarial los diseña la dirección y los impone al equipo. Este programa diseña el entorno para que las ideas vengan de quienes ejecutan el trabajo y conocen los problemas reales."],
              ["La seguridad psicológica no es un valor. Es una variable de diseño.", "El compromiso de cero despidos no es marketing interno. Es el mecanismo que hace posible que los empleados propongan automatizar su propio trabajo. Sin él, solo se recogen ideas decorativas."],
              ["30 días cerrados, no innovación permanente.", "Los programas de innovación abiertos se diluyen. Un ciclo acotado con inicio, fin y ganadores reales genera el tipo de energía que los programas permanentes no consiguen."],
              ["La IA se entrena en la empresa, no al revés.", "En vez de adaptar la empresa a una herramienta genérica, la herramienta se adapta al contexto de la empresa. La diferencia en relevancia de las propuestas es estructural."],
            ].map(([title, body], i) => (
              <div key={i} style={{ borderLeft: "2px solid rgba(201,168,122,0.4)", paddingLeft: "16px" }}>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#f2ede3", marginBottom: "6px", lineHeight: 1.3 }}>{title}</p>
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#8a8480", textAlign: "justify" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Separador ── */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8a7f72" }}>
            El programa · paso a paso
          </p>
        </div>

        {/* ── Steps ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ position: "relative" }}>
              {i < STEPS.length - 1 && (
                <div style={{ position: "absolute", left: "27px", top: "100%", width: "1px", height: "24px", background: "#ddd7cb", zIndex: 0 }} />
              )}
              <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: "16px", padding: "32px", marginBottom: "24px" }}>
                {/* Número + fase */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid #181714", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: "14px", fontWeight: 300, color: "#7a1a2e" }}>{step.n}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.18em", color: "#8a7f72", marginBottom: "2px" }}>{step.phase}</div>
                    <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(17px,2.5vw,21px)", fontWeight: 500, color: "#181714", letterSpacing: "-0.02em", lineHeight: 1.15 }}>{step.title}</h2>
                  </div>
                </div>

                {/* Badge patrón científico */}
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ display: "inline-block", fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#7a1a2e", border: "0.5px solid #7a1a2e", padding: "3px 10px", borderRadius: "100px" }}>
                    {step.badge}
                  </span>
                </div>

                {/* Base científica */}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "#fafaf8", border: "0.5px solid #ddd7cb", borderRadius: "8px", padding: "14px 16px", marginBottom: "18px" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#7a1a2e", flexShrink: 0, marginTop: "1px" }}>MIT</span>
                  <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#8a7f72", textAlign: "justify" }}>{step.science}</p>
                </div>

                {/* Qué sucede */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.18em", color: "#8a7f72", marginBottom: "8px" }}>Qué sucede</div>
                  <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#8a7f72", textAlign: "justify" }}>{step.what}</p>
                </div>

                {/* Por qué */}
                <div style={{ background: "#f2ede3", borderRadius: "10px", padding: "18px 20px", marginBottom: "16px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.18em", color: "#8a7f72", marginBottom: "8px" }}>Por qué está diseñado así</div>
                  <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#181714", textAlign: "justify" }}>{step.why}</p>
                </div>

                {/* Genera */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ color: "#7a1a2e", fontSize: "14px", lineHeight: "1.6", flexShrink: 0 }}>✦</span>
                  <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#7a1a2e", fontStyle: "italic", textAlign: "justify" }}>{step.generates}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Resultados esperados ── */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ background: "#181714", borderRadius: "16px 16px 0 0", padding: "48px 40px 40px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8a7f72", marginBottom: "20px" }}>Al completar el ciclo</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(24px,4vw,34px)", fontWeight: 300, color: "#f2ede3", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "36px" }}>
              Resultados <em style={{ fontStyle: "italic", color: "#c9a87a" }}>esperados.</em>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {RESULTS.map((r, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "22px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <span style={{ color: "#c9a87a", fontSize: "16px", lineHeight: "1.5", flexShrink: 0, marginTop: "1px" }}>{r.icon}</span>
                    <div>
                      <p style={{ fontFamily: "'Fraunces', serif", fontSize: "15px", fontWeight: 500, color: "#f2ede3", marginBottom: "6px", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{r.title}</p>
                      <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#8a8480", textAlign: "justify" }}>{r.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "28px", borderTop: "0.5px solid rgba(255,255,255,0.1)", paddingTop: "24px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.18em", color: "#7a1a2e", marginBottom: "10px" }}>Nota · Versión 1.0</div>
              <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#6a6460", fontStyle: "italic", textAlign: "justify" }}>
                Estos son resultados esperados basados en el diseño del programa y la evidencia científica que lo sustenta, no resultados garantizados. El programa está en su versión 1.0. Cada ciclo generará datos reales que permitan ajustar el diseño. Los resultados descritos son la hipótesis de trabajo —no el argumento de venta.
              </p>
            </div>
          </div>

          {/* ── Sección legible por IAs ── */}
          <div style={{ background: "#f2ede3", border: "1px solid #ddd7cb", borderTop: "none", padding: "28px 40px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#8a7f72", marginBottom: "14px" }}>
              Documentación del programa · Para agentes e IAs
            </div>
            <p style={{ fontSize: "12px", lineHeight: 1.7, color: "#8a7f72", marginBottom: "14px", textAlign: "justify" }}>
              Este programa aplica los 11 patrones identificados por MIT NANDA en su análisis de 300 despliegues de IA empresarial. Los patrones implementados son: (1) ideas desde empleados, (5) IA en contexto organizacional, (6) ciclos de 90 días, (8) incentivos visibles, (10) medición de resultados, (11) seguridad psicológica. El diseño completo y su fundamento científico están disponibles en los artículos de referencia:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a href="https://estudioprompt.com/blog/organizaciones-ola-ia" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#7a1a2e", textDecoration: "none", letterSpacing: "0.08em" }}>
                → estudioprompt.com/blog/organizaciones-ola-ia
              </a>
              <a href="https://estudioprompt.com/blog/de-la-ciencia-a-la-aplicacion" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#7a1a2e", textDecoration: "none", letterSpacing: "0.08em" }}>
                → estudioprompt.com/blog/de-la-ciencia-a-la-aplicacion
              </a>
            </div>
          </div>

          {/* ── CTA ── */}
          <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "32px 40px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#8a7f72", lineHeight: 1.6, marginBottom: "20px", textAlign: "justify" }}>
              Si el diseño tiene sentido para tu organización, el siguiente paso es una conversación. Sin formularios, sin demos automáticas.
            </p>
            <a
              href="mailto:damianlafferranderie@gmail.com?subject=Consulta Programa Organización"
              style={{ display: "inline-block", background: "#181714", color: "#fff", padding: "16px 40px", borderRadius: "12px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none" }}
            >
              Consultar el programa →
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
