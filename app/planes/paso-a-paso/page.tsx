"use client";

import { useEffect } from "react";
import Link from "next/link";

const STEPS = [
  {
    n: "01",
    phase: "Semana previa al lanzamiento",
    title: "Carga el material de tu empresa",
    badge: "Entrena tu IA",
    what: "La dirección sube los documentos que definen cómo funciona la organización: descripciones de procesos, objetivos estratégicos, áreas de mejora identificadas, documentación interna relevante. También puede pegar texto directamente.",
    why: "La diferencia entre una IA genérica y una IA que conoce tu empresa es la diferencia entre un consultor que nunca ha pisado tu oficina y uno que lleva tres años trabajando contigo. El mismo modelo de lenguaje, entrenado con el contexto de tu organización, identifica oportunidades que uno genérico jamás detectaría. Cada documento que subes no solo informa a la IA: construye el vocabulario compartido con el que tus empleados podrán articular mejor sus ideas.",
    generates: "Una IA especialista en tu organización, lista para acompañar a los participantes durante los 30 días del ciclo.",
  },
  {
    n: "02",
    phase: "Día 0 — Configuración del programa",
    title: "Define los premios",
    badge: "Motor de motivación",
    what: "La dirección establece qué recibirán las tres mejores ideas al final del ciclo. Puede ser una cena, días libres extra, un bono económico, un regalo, o cualquier reconocimiento que tenga sentido para el equipo.",
    why: "Los incentivos visibles y tangibles cambian el comportamiento de participación de forma medible. No porque los empleados sean transaccionales, sino porque los premios públicos actúan como señal de que la dirección toma el programa en serio. Un buzón de sugerencias sin consecuencias se ignora. Un concurso con ganadores reales, no. Además, los premios crean conversación interna antes de que empiece el ciclo: cuando el equipo ya sabe qué está en juego, llega al día 1 habiendo pensado.",
    generates: "Una participación activa desde el primer día y una competencia sana que eleva la calidad de las propuestas.",
  },
  {
    n: "03",
    phase: "Días 1 a 3 — Activación",
    title: "Los participantes reciben su acceso",
    badge: "El pacto que lo cambia todo",
    what: "Cada persona seleccionada recibe una invitación personalizada al entorno privado de la organización. Junto con el acceso, recibe el documento de compromiso firmado por la dirección: cero despidos por causa de la IA durante y después del programa. Si una función se automatiza, la organización reasignará o ampliará el rol de quien la desempeña.",
    why: "Este es el paso más crítico del diseño. Sin él, el programa recoge ideas decorativas. La investigación en psicología organizacional es consistente: las personas no proponen cómo automatizar su propio trabajo si existe aunque sea una probabilidad percibida de que ese trabajo se use en su contra. El compromiso firmado no es cosmético. Es el mecanismo que desactiva el autoboicot y permite que los empleados propongan las mejoras reales —las que saben que funcionarían pero que nunca habían dicho en voz alta.",
    generates: "Seguridad psicológica real. Sin ella, el resto del programa no tiene base.",
  },
  {
    n: "04",
    phase: "Días 1 a 30 — El ciclo",
    title: "30 días de propuestas asistidas por IA",
    badge: "El corazón del programa",
    what: "Los participantes acceden al banco de ideas de su organización: proponen ideas, desarrollan las de sus compañeros, debaten, refinan. La IA entrenada en los documentos de la empresa los acompaña en todo momento —no sugiere ideas genéricas, sino que ayuda a profundizar en cada propuesta con el contexto específico de la organización.",
    why: "30 días es el intervalo óptimo por dos razones opuestas: suficientemente largo para que emerjan ideas elaboradas (no solo las que se tienen en el momento de abrir una encuesta), y suficientemente corto para mantener la energía y el foco. Los programas más largos se diluyen; los más cortos solo captan las ideas más superficiales. La IA en este contexto no reemplaza el criterio humano: lo amplifica. Un empleado que sabe dónde duele el proceso, asistido por una IA que conoce el contexto organizacional, produce propuestas con un nivel de concreción que no alcanzaría solo.",
    generates: "Entre 15 y 40 ideas concretas, diversas en origen jerárquico y en ámbito de aplicación.",
  },
  {
    n: "05",
    phase: "Día 31 — Cierre",
    title: "Reporte ejecutivo y selección de ganadoras",
    badge: "De ideas a decisiones",
    what: "Al final del ciclo, la dirección recibe un reporte completo: todas las propuestas recogidas, un análisis por área de impacto, las tres ideas ganadoras según los criterios predefinidos, y recomendaciones de implementación con estimaciones de esfuerzo.",
    why: "El reporte no es una lista de ideas. Es inteligencia organizacional estructurada. La dirección necesita poder tomar decisiones —no leer una lista de 30 propuestas sin contexto. El análisis de distribución jerárquica (¿de qué nivel vinieron las mejores ideas?) y temática (¿qué áreas concentran las oportunidades?) tiene valor estratégico independiente del programa: revela dónde vive el conocimiento real de la organización y dónde están los cuellos de botella.",
    generates: "3 ideas listas para implementar en los 90 días siguientes. Más: un mapa de oportunidades de IA específico para tu empresa.",
  },
];

const RESULTS = [
  {
    icon: "◈",
    title: "Inventario de oportunidades reales",
    desc: "No oportunidades genéricas sacadas de un informe de McKinsey sobre tu sector. Oportunidades identificadas por las personas que ejecutan los procesos de tu empresa, articuladas con el contexto real de cómo funciona tu organización. Esa especificidad es la que hace que una idea pase de «interesante» a implementable.",
  },
  {
    icon: "◇",
    title: "Un equipo que sabe usar IA",
    desc: "Los participantes salen del ciclo habiendo usado la IA como co-piloto en el contexto real de su trabajo —no en un taller teórico. Ese aprendizaje queda en la organización. Cuando llegue el momento de implementar las ideas ganadoras, el equipo que las propuso tiene la capacidad práctica de acompañar la implementación.",
  },
  {
    icon: "○",
    title: "Una señal interna que cambia la narrativa",
    desc: "El compromiso firmado de cero despidos por IA no es solo un documento. Es una declaración de intenciones que circula internamente. Modifica cómo el equipo percibe la IA: de amenaza a herramienta. Ese cambio de narrativa tiene valor más allá del programa —condiciona cómo se recibirán todas las iniciativas de IA que vengan después.",
  },
  {
    icon: "△",
    title: "Datos propios para calibrar el siguiente ciclo",
    desc: "Tasa de participación, distribución jerárquica de ideas, índice de miedo percibido antes y después del ciclo, ratio de ideas implementadas en los 90 días siguientes. Estos datos no sirven para justificar el programa: sirven para mejorarlo. Con cada ciclo, la dirección tiene información más precisa sobre qué palancas funcionan en su organización específica.",
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
  }, []);

  return (
    <main
      className="min-h-screen bg-[#FAFAF8] flex flex-col items-center px-4 py-12 relative"
      style={{ fontFamily: "'Fraunces', serif" }}
    >
      {/* Back */}
      <Link
        href="/planes"
        className="fixed top-6 left-6 p-2 rounded-full bg-white/60 hover:bg-white/90 backdrop-blur-sm shadow-sm transition-all text-[#666] hover:text-[#333] z-10"
        aria-label="Volver a planes"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12" style={{ paddingTop: "32px" }}>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "#8a7f72",
              marginBottom: "16px",
            }}
          >
            Programa Organizaciones · unbancodeideas.com
          </p>
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(28px,5vw,42px)",
              fontWeight: 300,
              color: "#181714",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              marginBottom: "16px",
            }}
          >
            El programa,{" "}
            <em style={{ fontStyle: "italic", color: "#8a7f72" }}>
              paso a paso.
            </em>
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#8a7f72",
              lineHeight: 1.6,
              maxWidth: "480px",
              margin: "0 auto",
              textAlign: "justify",
            }}
          >
            Cada paso tiene una razón de ser. Aquí está la lógica detrás del
            diseño, qué genera cada fase y por qué está pensada así.
          </p>
        </div>

        {/* Steps */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0" }}
        >
          {STEPS.map((step, i) => (
            <div key={i} style={{ position: "relative" }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: "27px",
                    top: "100%",
                    width: "1px",
                    height: "24px",
                    background: "#ddd7cb",
                    zIndex: 0,
                  }}
                />
              )}

              <div
                style={{
                  background: "#fff",
                  border: "1px solid #E8E5E0",
                  borderRadius: "16px",
                  padding: "32px",
                  marginBottom: "24px",
                  position: "relative",
                }}
              >
                {/* Step number + phase */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid #181714",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Fraunces', serif",
                        fontSize: "14px",
                        fontWeight: 300,
                        color: "#7a1a2e",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {step.n}
                    </span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        color: "#8a7f72",
                        marginBottom: "2px",
                      }}
                    >
                      {step.phase}
                    </div>
                    <h2
                      style={{
                        fontFamily: "'Fraunces', serif",
                        fontSize: "clamp(17px,2.5vw,21px)",
                        fontWeight: 500,
                        color: "#181714",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.15,
                      }}
                    >
                      {step.title}
                    </h2>
                  </div>
                </div>

                {/* Badge */}
                <div style={{ marginBottom: "20px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "#7a1a2e",
                      border: "0.5px solid #7a1a2e",
                      padding: "3px 10px",
                      borderRadius: "100px",
                    }}
                  >
                    {step.badge}
                  </span>
                </div>

                {/* Qué sucede */}
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#8a7f72",
                      marginBottom: "10px",
                    }}
                  >
                    Qué sucede
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.7,
                      color: "#8a7f72",
                      textAlign: "justify",
                    }}
                  >
                    {step.what}
                  </p>
                </div>

                {/* Por qué */}
                <div
                  style={{
                    background: "#f2ede3",
                    borderRadius: "10px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#8a7f72",
                      marginBottom: "10px",
                    }}
                  >
                    Por qué está diseñado así
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.7,
                      color: "#181714",
                      textAlign: "justify",
                    }}
                  >
                    {step.why}
                  </p>
                </div>

                {/* Genera */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    paddingTop: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "#7a1a2e",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      flexShrink: 0,
                    }}
                  >
                    ✦
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.6,
                      color: "#7a1a2e",
                      fontStyle: "italic",
                      textAlign: "justify",
                    }}
                  >
                    {step.generates}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resultados esperados */}
        <div style={{ marginTop: "16px" }}>
          <div
            style={{
              background: "#181714",
              borderRadius: "16px",
              padding: "48px 40px 40px",
              marginBottom: "0",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "#8a7f72",
                marginBottom: "20px",
              }}
            >
              Al completar el ciclo
            </div>
            <h2
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "clamp(24px,4vw,34px)",
                fontWeight: 300,
                color: "#f2ede3",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: "36px",
              }}
            >
              Resultados{" "}
              <em style={{ fontStyle: "italic", color: "#c9a87a" }}>
                esperados.
              </em>
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {RESULTS.map((r, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px",
                    }}
                  >
                    <span
                      style={{
                        color: "#c9a87a",
                        fontSize: "16px",
                        lineHeight: "1.5",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      {r.icon}
                    </span>
                    <div>
                      <p
                        style={{
                          fontFamily: "'Fraunces', serif",
                          fontSize: "16px",
                          fontWeight: 500,
                          color: "#f2ede3",
                          marginBottom: "8px",
                          lineHeight: 1.3,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {r.title}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.7,
                          color: "#8a8480",
                          textAlign: "justify",
                        }}
                      >
                        {r.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nota experimental */}
            <div
              style={{
                marginTop: "28px",
                borderTop: "0.5px solid rgba(255,255,255,0.1)",
                paddingTop: "24px",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#7a1a2e",
                  marginBottom: "10px",
                }}
              >
                Nota · Versión 1.0
              </div>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.7,
                  color: "#6a6460",
                  fontStyle: "italic",
                  textAlign: "justify",
                }}
              >
                Estos son resultados esperados basados en el diseño del
                programa, no resultados garantizados. El programa está en su
                versión 1.0. Cada ciclo generará datos reales que permitirán
                ajustar el diseño. Los resultados descritos aquí son la
                hipótesis de trabajo —no el argumento de venta.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #E8E5E0",
              borderTop: "none",
              borderRadius: "0 0 16px 16px",
              padding: "32px 40px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#8a7f72",
                lineHeight: 1.6,
                marginBottom: "20px",
                textAlign: "justify",
              }}
            >
              Si el diseño tiene sentido para tu organización, el siguiente paso
              es una conversación. Sin formularios, sin demos automáticas.
            </p>
            <a
              href="mailto:damianlafferranderie@gmail.com?subject=Consulta Programa Organización"
              style={{
                display: "inline-block",
                background: "#181714",
                color: "#fff",
                padding: "16px 40px",
                borderRadius: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                textDecoration: "none",
              }}
            >
              Consultar el programa →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
