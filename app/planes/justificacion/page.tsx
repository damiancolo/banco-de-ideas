"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function JustificacionPage() {
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
        {/* Hero header */}
        <div
          style={{
            background: "#181714",
            borderRadius: "16px",
            padding: "56px 48px 48px",
            position: "relative",
            overflow: "hidden",
            marginBottom: "0",
          }}
        >
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0.06,
            }}
            viewBox="0 0 600 300"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="520" cy="60" r="180" fill="#fff" />
            <circle cx="80" cy="240" r="120" fill="#fff" />
          </svg>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "32px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "clamp(72px,14vw,108px)",
                  fontWeight: 300,
                  lineHeight: 0.9,
                  letterSpacing: "-0.05em",
                  color: "#3a3632",
                }}
              >
                95
                <span style={{ fontSize: "0.45em", color: "#4a4440" }}>%</span>
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#6a6460",
                  marginTop: "12px",
                }}
              >
                fracasan
              </div>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "clamp(36px,7vw,56px)",
                  fontWeight: 400,
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  color: "#c9a87a",
                }}
              >
                5<span style={{ fontSize: "0.5em" }}>%</span>
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#c9a87a",
                  marginTop: "12px",
                }}
              >
                lo logran
              </div>
            </div>
          </div>

          <div style={{ marginTop: "28px", position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "clamp(18px,3vw,24px)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "#8a8480",
                lineHeight: 1.3,
                letterSpacing: "-0.02em",
              }}
            >
              Lo que el director de una empresa necesita saber sobre la IA
              <br />
              antes de tomar la próxima decisión.
            </div>
          </div>
          <div
            style={{
              marginTop: "16px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "#5a5654",
              position: "relative",
              zIndex: 1,
            }}
          >
            Justificación científica · Banco de Ideas para Empresas
          </div>
        </div>

        {/* Article body */}
        <div
          style={{
            background: "#fff",
            borderRadius: "0 0 16px 16px",
            border: "1px solid #E8E5E0",
            borderTop: "none",
            padding: "48px 44px 56px",
          }}
        >
          {/* El dato */}
          <section style={{ marginBottom: "40px" }}>
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
              El dato
            </div>
            <p
              style={{
                fontSize: "clamp(15px,2vw,17px)",
                lineHeight: 1.7,
                color: "#181714",
                marginBottom: "16px",
                textAlign: "justify",
              }}
            >
              <strong>95 de cada 100 proyectos de IA en empresas fracasan.</strong>{" "}
              Sin valor medible. Sin retorno. Sin impacto en la cuenta de
              resultados.
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#8a7f72",
                marginBottom: "16px",
                textAlign: "justify",
              }}
            >
              No es una opinión. Es la conclusión de un estudio del MIT
              publicado en 2025 sobre 300 despliegues reales en empresas de
              todos los tamaños.
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#8a7f72",
                textAlign: "justify",
              }}
            >
              Solo 5 de cada 100 lo consiguen. La pregunta evidente es{" "}
              <strong style={{ color: "#181714" }}>qué hace ese 5%</strong>.
            </p>
          </section>

          <hr
            style={{
              border: "none",
              borderTop: "0.5px solid #ddd7cb",
              margin: "0 0 40px",
            }}
          />

          {/* Lo que distingue al 5% */}
          <section style={{ marginBottom: "40px" }}>
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
              Lo que distingue al 5%
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#8a7f72",
                marginBottom: "20px",
                textAlign: "justify",
              }}
            >
              No es el modelo de IA que usan. Todas las empresas tienen acceso
              a las mismas herramientas. No es el presupuesto: empresas que
              invierten millones fracasan, y empresas que invierten poco
              extraen valor real.
            </p>
            <div
              style={{
                background: "#f2ede3",
                borderRadius: "12px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {[
                [
                  "Las ideas vienen de los empleados, no de la dirección.",
                  "Los proyectos exitosos son los que propusieron las personas que ejecutan el trabajo. Las que saben dónde duele. La dirección ve ineficiencias en agregado; los empleados las viven en detalle.",
                ],
                [
                  "Atacan procesos invisibles, no campañas vistosas.",
                  "El mayor retorno está en lo aburrido: facturación, conciliaciones, gestión documental, comunicación interna. La IA que se luce en marketing rinde menos que la IA que ordena el back-office.",
                ],
                [
                  "Ejecutan rápido o no ejecutan.",
                  "Las empresas medianas pasan de prueba a uso real en 90 días. Las grandes tardan 9 meses y la mayoría muere por el camino.",
                ],
                [
                  "Sus empleados se sienten seguros.",
                  "Nadie propone cómo automatizar su propio trabajo si teme que ese trabajo se use contra él. Sin garantía explícita de empleo, lo que se recoge son ideas decorativas.",
                ],
              ].map(([title, body], i) => (
                <div key={i}>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#181714",
                      marginBottom: "6px",
                      lineHeight: 1.4,
                    }}
                  >
                    {title}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.65,
                      color: "#8a7f72",
                      textAlign: "justify",
                    }}
                  >
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr
            style={{
              border: "none",
              borderTop: "0.5px solid #ddd7cb",
              margin: "0 0 40px",
            }}
          />

          {/* La consecuencia incómoda */}
          <section style={{ marginBottom: "40px" }}>
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
              La consecuencia incómoda
            </div>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.7,
                color: "#181714",
                marginBottom: "16px",
                textAlign: "justify",
              }}
            >
              Si lo anterior es cierto,{" "}
              <strong>
                el problema no es comprar la IA correcta. Es construir las
                condiciones para que las personas correctas la usen
              </strong>
              .
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#8a7f72",
                marginBottom: "16px",
                textAlign: "justify",
              }}
            >
              Y esas condiciones no aparecen solas. La mayoría de las
              organizaciones tiene buzones de sugerencias que nadie revisa,
              reuniones donde solo habla quien siempre habla, y procesos de
              innovación opacos. La inteligencia colectiva existe en cada
              empresa. Pero rara vez encuentra dónde manifestarse.
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#8a7f72",
                textAlign: "justify",
              }}
            >
              Por eso el 95% fracasa. No por falta de tecnología. Por falta de
              un lugar donde las personas que conocen el trabajo puedan proponer
              cómo mejorarlo, y al hacerlo no se sientan expuestas.
            </p>
          </section>

          <hr
            style={{
              border: "none",
              borderTop: "0.5px solid #ddd7cb",
              margin: "0 0 40px",
            }}
          />

          {/* La propuesta */}
          <section style={{ marginBottom: "40px" }}>
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
              La propuesta
            </div>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.7,
                color: "#181714",
                marginBottom: "20px",
                textAlign: "justify",
              }}
            >
              <strong>Banco de Ideas Organizaciones</strong> es un programa
              diseñado para construir ese lugar de forma deliberada. No depende
              de que la cultura de la empresa lo genere espontáneamente.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {[
                "30 días. Un ciclo corto, acotado, con principio y fin claros.",
                "Hasta 10 participantes. Empleados de distintos niveles, incluidos mandos intermedios.",
                "IA entrenada con la documentación de su empresa. No una IA genérica. Una que conoce sus procesos, su lenguaje, sus áreas de mejora.",
                "Premios visibles desde el inicio. Definidos por la dirección.",
                "Compromiso firmado de cero despidos por IA. Si una función se automatiza, la organización reasigna o amplía el rol. Es la condición de entrada al programa.",
                "Reporte ejecutivo final. Con todas las propuestas, las tres ganadoras y recomendaciones de implementación.",
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      color: "#7a1a2e",
                      fontSize: "16px",
                      lineHeight: "1.5",
                      flexShrink: 0,
                    }}
                  >
                    ✦
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.65,
                      color: "#8a7f72",
                      textAlign: "justify",
                    }}
                  >
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr
            style={{
              border: "none",
              borderTop: "0.5px solid #ddd7cb",
              margin: "0 0 40px",
            }}
          />

          {/* Lo que un director gana */}
          <section style={{ marginBottom: "40px" }}>
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
              Lo que un director gana en 30 días
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {[
                [
                  "Un inventario priorizado de oportunidades reales de IA en su empresa.",
                  "No genéricas. Identificadas por las personas que conocen los procesos.",
                ],
                [
                  "Un equipo con experiencia práctica.",
                  "Los participantes salen del ciclo sabiendo usar IA en el contexto real de su trabajo. Ese aprendizaje queda en la organización.",
                ],
                [
                  "Una señal interna potente.",
                  "El compromiso firmado de no despido por IA cambia la conversación dentro de la empresa. Reduce el miedo. Aumenta la propuesta. Transforma a la IA, en el imaginario del equipo, de amenaza a herramienta.",
                ],
              ].map(([title, body], i) => (
                <div
                  key={i}
                  style={{
                    paddingLeft: "16px",
                    borderLeft: "2px solid #ddd7cb",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#181714",
                      marginBottom: "6px",
                    }}
                  >
                    {title}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.65,
                      color: "#8a7f72",
                      textAlign: "justify",
                    }}
                  >
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr
            style={{
              border: "none",
              borderTop: "0.5px solid #ddd7cb",
              margin: "0 0 40px",
            }}
          />

          {/* El experimento continúa */}
          <section style={{ marginBottom: "40px" }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "#7a1a2e",
                marginBottom: "20px",
              }}
            >
              Versión 1.0 · El experimento continúa
            </div>
            <h2
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "clamp(20px,3vw,26px)",
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                color: "#181714",
                marginBottom: "16px",
              }}
            >
              Lo que mediremos en las próximas versiones
            </h2>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#8a7f72",
                marginBottom: "16px",
                textAlign: "justify",
              }}
            >
              Este programa no es un producto terminado. Es una hipótesis de
              trabajo.
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#8a7f72",
                marginBottom: "24px",
                textAlign: "justify",
              }}
            >
              La hipótesis es esta: que en cualquier organización existe
              suficiente inteligencia colectiva para identificar las mejores
              oportunidades de aplicar IA, y que el problema no es la falta de
              ideas sino la falta de un entorno que las active. El diseño del
              programa —el ciclo de 30 días, el compromiso de no despido, los
              premios, la IA entrenada en contexto— es un conjunto de variables
              que en la versión 1.0 son fijas. En las versiones siguientes,
              serán ajustadas según lo que los datos de cada ciclo vayan
              revelando.
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#8a7f72",
                marginBottom: "28px",
                textAlign: "justify",
              }}
            >
              Para que ese ajuste sea riguroso, definimos de antemano qué
              mediremos.
            </p>

            {/* Variables de resultado */}
            <div style={{ marginBottom: "28px" }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#8a7f72",
                  marginBottom: "16px",
                }}
              >
                Variables de resultado
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {[
                  [
                    "Tasa de implementación de ideas",
                    "¿Cuántas de las ideas ganadoras se implementan en los 90 días siguientes al ciclo? Esta es la variable de mayor peso. Un programa que genera ideas pero no movimiento no valida la hipótesis.",
                  ],
                  [
                    "Diversidad jerárquica de las propuestas",
                    "¿De qué nivel organizacional provienen las mejores ideas? Si el 80% vienen de mandos intermedios hacia arriba, la hipótesis de que «quien conoce el trabajo propone la solución» necesita ser revisada.",
                  ],
                  [
                    "Retorno sobre la inversión de las ideas implementadas",
                    "¿Cuánto tiempo ahorra el proceso automatizado? ¿Cuánto cuesta el ciclo vs. el valor generado? Este número, recopilado ciclo a ciclo, construirá el caso de negocio para versiones posteriores.",
                  ],
                ].map(([title, body], i) => (
                  <div
                    key={i}
                    style={{
                      background: "#f2ede3",
                      borderRadius: "10px",
                      padding: "18px 20px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#181714",
                        marginBottom: "6px",
                        lineHeight: 1.4,
                      }}
                    >
                      {title}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        lineHeight: 1.65,
                        color: "#8a7f72",
                        textAlign: "justify",
                      }}
                    >
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Variables de proceso */}
            <div style={{ marginBottom: "28px" }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#8a7f72",
                  marginBottom: "16px",
                }}
              >
                Variables de proceso
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {[
                  [
                    "Tasa de participación activa",
                    "Porcentaje de los participantes invitados que proponen al menos una idea a lo largo del ciclo. Si queda por debajo del 60%, hay que revisar el onboarding o el encuadre del programa.",
                  ],
                  [
                    "Índice de miedo percibido",
                    "Encuesta de 3 preguntas, antes y después del ciclo: ¿sientes que proponer automatizaciones pone en riesgo tu puesto? La reducción de este índice es un indicador de que el compromiso de «cero despidos» funciona como palanca psicológica.",
                  ],
                  [
                    "Calidad de uso de la IA",
                    "Medida como la ratio entre preguntas genéricas y preguntas específicas de proceso. Un ratio alto en favor de las genéricas indica que la IA no está siendo usada como co-piloto sino como motor de búsqueda.",
                  ],
                ].map(([title, body], i) => (
                  <div
                    key={i}
                    style={{
                      background: "#f2ede3",
                      borderRadius: "10px",
                      padding: "18px 20px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#181714",
                        marginBottom: "6px",
                        lineHeight: 1.4,
                      }}
                    >
                      {title}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        lineHeight: 1.65,
                        color: "#8a7f72",
                        textAlign: "justify",
                      }}
                    >
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Variables de largo plazo */}
            <div style={{ marginBottom: "28px" }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#8a7f72",
                  marginBottom: "16px",
                }}
              >
                Variables de largo plazo · seguimiento a 6 meses
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {[
                  [
                    "Retención del conocimiento",
                    "¿Siguen usando IA para su trabajo los participantes 6 meses después? Esta variable determina si el programa genera aprendizaje durable o solo exposición puntual.",
                  ],
                  [
                    "Difusión interna",
                    "¿Cuántas personas no participantes han adoptado alguna práctica de IA tras observar el ciclo? Los programas más exitosos generan efectos de segunda ola sin coste adicional.",
                  ],
                ].map(([title, body], i) => (
                  <div
                    key={i}
                    style={{
                      background: "#f2ede3",
                      borderRadius: "10px",
                      padding: "18px 20px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#181714",
                        marginBottom: "6px",
                        lineHeight: 1.4,
                      }}
                    >
                      {title}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        lineHeight: 1.65,
                        color: "#8a7f72",
                        textAlign: "justify",
                      }}
                    >
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: "0.5px solid #7a1a2e",
                borderRadius: "12px",
                padding: "24px 28px",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#7a1a2e",
                  marginBottom: "12px",
                }}
              >
                Cómo se usa esto
              </div>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.7,
                  color: "#8a7f72",
                  marginBottom: "12px",
                  textAlign: "justify",
                }}
              >
                Al final de cada ciclo, el reporte ejecutivo incluirá estas
                métricas en crudo —sin interpretar, para que la dirección las
                evalúe con criterio propio. Con cada nuevo ciclo, las
                comparaciones entre organizaciones (anonimizadas) irán
                construyendo un benchmark de referencia.
              </p>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.7,
                  color: "#181714",
                  fontStyle: "italic",
                  textAlign: "justify",
                }}
              >
                El objetivo no es demostrar que el programa funciona. Es
                entender con precisión cuándo funciona, para quién, y bajo qué
                condiciones. Eso es lo que diferencia un experimento de un
                argumento de venta.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div style={{ textAlign: "center", paddingTop: "8px" }}>
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
