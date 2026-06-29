import Link from 'next/link';
import type { Metadata } from 'next';

// Datos del responsable rellenados (jun 2026). Pendiente: validación legal del texto
// y confirmar la base de transferencia internacional.
export const metadata: Metadata = {
    title: 'Política de Privacidad — Banco de Ideas',
    description:
        'Cómo Banco de Ideas trata los datos: analítica anónima, datos de conexión, cuentas del espacio privado, proveedores y tus derechos según el RGPD.',
};

const LAST_UPDATED = '29 de junio de 2026';

export default function PrivacidadPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#F8F5F0] via-white to-[#EBE8E0] p-6 md:p-12">
            <article className="max-w-3xl mx-auto text-gray-700 leading-relaxed">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                    Última actualización: {LAST_UPDATED}
                </p>
                <h1 className="text-4xl md:text-5xl font-black text-[#C5A47E] mb-6">
                    Política de Privacidad
                </h1>

                <p className="mb-6">
                    En Banco de Ideas nos tomamos en serio la privacidad. Esta página explica qué datos
                    tratamos, con qué finalidad, durante cuánto tiempo y qué derechos tenés.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">1. Responsable del tratamiento</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Responsable:</strong> Damián Lafferranderie (persona física), creador de Banco de Ideas</li>
                    <li>
                        <strong>Contacto:</strong>{' '}
                        <a href="mailto:damianlafferranderie@gmail.com" className="text-[#C5A47E] underline">
                            damianlafferranderie@gmail.com
                        </a>
                    </li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">2. Qué datos tratamos</h2>

                <h3 className="font-semibold text-gray-900 mt-4 mb-1">Analítica de visitas (anónima)</h3>
                <p>
                    Registramos de forma agregada si la visita es de una persona o de un agente de IA, el
                    navegador y dispositivo, el país aproximado, la página y la web de procedencia.{' '}
                    <strong>No almacenamos tu IP, no usamos cookies y no creamos identificadores</strong>, por lo
                    que estos datos no permiten identificarte. Se eliminan automáticamente a los 90 días.
                    Base jurídica: interés legítimo.
                </p>

                <h3 className="font-semibold text-gray-900 mt-4 mb-1">Datos de conexión</h3>
                <p>
                    Para proteger el servicio frente a abusos procesamos tu IP de forma{' '}
                    <strong>transitoria, sin almacenarla</strong>. Base jurídica: interés legítimo en la seguridad.
                </p>

                <h3 className="font-semibold text-gray-900 mt-4 mb-1">Cuenta del espacio privado</h3>
                <p>
                    Si iniciás sesión con Google en el espacio privado, tratamos tu nombre, email, foto e
                    identificador de Google, y guardamos las ideas que crees. Sirve únicamente para prestarte
                    ese espacio personal. Base jurídica: ejecución del servicio que solicitás. Podés pedir la
                    supresión de tu cuenta y tus datos en cualquier momento (ver sección 6).
                </p>

                <h3 className="font-semibold text-gray-900 mt-4 mb-1">Herramientas de IA</h3>
                <p>
                    El chat, el análisis y la voz envían el texto o el audio que generás a proveedores de IA
                    para producir la respuesta. <strong>Te pedimos que no introduzcas datos personales
                    sensibles</strong> en el chat.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">3. Cookies</h2>
                <p>
                    No usamos cookies de analítica ni de publicidad. El espacio privado utiliza una cookie
                    estrictamente técnica de sesión, necesaria para mantenerte identificado tras iniciar sesión;
                    está exenta de consentimiento.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">4. Proveedores y transferencias internacionales</h2>
                <p>
                    Trabajamos con encargados del tratamiento: alojamiento (Vercel), base de datos (MongoDB
                    Atlas), proveedores de IA (DeepSeek para el chat/análisis; OpenAI para la voz) e inicio de
                    sesión (Google). Algunos están ubicados fuera del Espacio Económico Europeo y aplicamos las
                    garantías que exige la normativa. A los proveedores de IA solo les enviamos el texto o el
                    audio necesarios para generar la respuesta, no tu identidad; los datos de tu cuenta (nombre
                    y email de Google) se tratan únicamente para el inicio de sesión y se conservan en nuestra
                    base de datos.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">5. Plazos de conservación</h2>
                <p>
                    La analítica se elimina automáticamente a los 90 días. Los datos de conexión no se almacenan.
                    Los datos de tu cuenta se conservan mientras la cuenta exista.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">6. Tus derechos</h2>
                <p>
                    Podés ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y
                    portabilidad escribiendo a nuestro contacto de privacidad. También podés reclamar ante la
                    Agencia Española de Protección de Datos (AEPD,{' '}
                    <a href="https://www.aepd.es" target="_blank" rel="noopener" className="text-[#C5A47E] underline">
                        www.aepd.es
                    </a>
                    ) o ante la autoridad de control competente.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">7. Cambios en esta política</h2>
                <p>
                    Podemos actualizar esta política. Publicaremos cualquier cambio en esta misma página,
                    indicando la fecha de la última actualización.
                </p>

                <div className="mt-12">
                    <Link href="/" className="text-[#C5A47E] underline">← Volver al inicio</Link>
                </div>
            </article>
        </main>
    );
}
