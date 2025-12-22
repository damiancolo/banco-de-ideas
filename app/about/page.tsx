export default function AboutPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#F8F5F0] via-white to-[#EBE8E0] p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                {/* Main Title */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-500">
                    <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#C5A47E] via-[#b08e68] to-[#C5A47E] mb-2 tracking-tight">
                        UNBAN CODE IDEAS
                    </h1>
                </div>

                {/* Header */}
                <div className="text-center mb-16 animate-in fade-in slide-in-from-top duration-700">
                    <div className="inline-block p-4 bg-gradient-to-br from-[#C5A47E] to-[#b08e68] rounded-2xl mb-6 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18h6"></path>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 22h4"></path>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"></path>
                        </svg>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Banco de Ideas</h1>
                    <p className="text-xl text-gray-600 font-light">Solsticio de Invierno 2025</p>
                </div>

                {/* El Banco de Ideas - Introduction */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">El Banco de Ideas</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Creemos que las ideas son la capital más importante de la humanidad y que la inteligencia artificial es un catalizador de su potencial.
                        Es urgente y necesario comenzar a explorar este maridaje por lo que proponemos un espacio para experimentar con las posibilidades.
                        Este espacio se llama el Banco de Ideas.
                    </p>
                </div>

                {/* Description */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Descripción del Banco de Ideas</h2>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        El Banco de Ideas es un espacio diseñado para facilitar la generación y desarrollo de ideas individuales y colectivas.
                        Utiliza tecnologías avanzadas de inteligencia artificial para asistir a los usuarios en la creación, co-creación,
                        refinamiento, expansión y colectivización de las Ideas.
                    </p>
                </div>

                {/* Justification */}
                <div className="bg-gradient-to-br from-[#C5A47E]/10 to-transparent rounded-3xl p-8 md:p-12 shadow-xl border border-[#C5A47E]/20 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Justificación</h2>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        El Banco de Ideas es una herramienta clave para un futuro con una cosmovisión más alineada con un sistema sostenible.
                    </p>
                </div>

                {/* Key Functionalities */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-250">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Funcionalidades Clave</h2>
                    <div className="space-y-6">
                        <div className="border-l-4 border-[#C5A47E] pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">1. Creación de Ideas</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Los usuarios pueden presentar sus ideas, optando por hacerlo de manera anónima o no. Esta flexibilidad
                                garantiza que todos puedan participar cómodamente, respetando su preferencia por la privacidad.
                            </p>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">2. Análisis Inteligente</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Al ingresar una idea, la plataforma emplea algoritmos de procesamiento de lenguaje natural para identificar
                                y reportar existencias de ideas similares dentro de la base de datos. Proporciona un resumen de coincidencias
                                y diferencias significativas, ofreciendo una perspectiva inicial sobre el contexto en que se inserta la nueva idea.
                            </p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">3. Colaboración y Evolución</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Las ideas en la plataforma están abiertas o no a la contribución de otros usuarios, permitiendo que se modifiquen,
                                expandan o adapten. Este proceso colaborativo está diseñado para enriquecer las propuestas y explorar nuevas
                                direcciones basadas en la interacción colectiva.
                            </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">4. Control y Personalización</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Los usuarios tienen control total sobre sus contribuciones, pudiendo personalizar la manera en que desean recibir
                                feedback y sugerencias. La plataforma también facilita el seguimiento de cómo otras personas han interactuado con
                                sus ideas, permitiendo a los usuarios gestionar activamente la evolución de sus propuestas.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Objectives */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Objetivos del Banco de Ideas</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="text-3xl flex-shrink-0">🎯</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Optimizar la Innovación</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    Mejorar la eficiencia en el proceso de generación de ideas, evitando duplicaciones y promoviendo un uso
                                    más efectivo de los recursos creativos disponibles.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="text-3xl flex-shrink-0">🌍</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Fomentar la Colaboración Global</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    Eliminar barreras para la colaboración, permitiendo que ideas de diversas partes del mundo sean
                                    compartidas y desarrolladas en conjunto.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Architecture */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Arquitectura Técnica</h2>

                    <div className="space-y-6">
                        <div className="border-l-4 border-[#C5A47E] pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">🧠 Motor de IA Generativa</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Powered by <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">GPT-4o-mini</span>,
                                el sistema no solo almacena ideas—las <span className="font-semibold">bisocía</span>. Inspirado en el concepto
                                de Arthur Koestler, genera conexiones inesperadas entre dominios aparentemente no relacionados,
                                el mismo proceso que impulsa los avances científicos y artísticos más revolucionarios.
                            </p>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">☁️ Persistencia Distribuida</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Construido sobre <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">MongoDB Atlas</span>,
                                garantiza que ninguna idea se pierda. Cada concepto, cada bisociación, cada iteración queda
                                registrada en una base de datos en la nube, accesible desde cualquier dispositivo, en cualquier momento.
                            </p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">⚡ Stack Moderno y Escalable</h3>
                            <p className="text-gray-700 leading-relaxed mb-3">
                                Desarrollado con <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">Next.js 16</span> y
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded ml-1">TypeScript</span>,
                                el código está diseñado para escalar desde un usuario individual hasta organizaciones completas.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Server-Side Rendering para performance óptima</li>
                                <li>• Type-safe architecture para prevenir errores</li>
                                <li>• Modular design para fácil extensibilidad</li>
                                <li>• Production-ready logging y error handling</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Impact Potential */}
                <div className="bg-gradient-to-br from-[#C5A47E]/10 to-transparent rounded-3xl p-8 md:p-12 shadow-xl border border-[#C5A47E]/20 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Potencial de Impacto</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100">
                            <div className="text-3xl mb-3">🚀</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Para Emprendedores</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Transforma conceptos vagos en propuestas de negocio estructuradas. La IA actúa como co-founder
                                que nunca duerme, generando variaciones y análisis críticos.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100">
                            <div className="text-3xl mb-3">🔬</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Para Investigadores</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Captura hipótesis emergentes y explora conexiones interdisciplinarias.
                                Cada idea puede ser el punto de partida de un paper revolucionario.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100">
                            <div className="text-3xl mb-3">🎨</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Para Creativos</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Rompe bloqueos creativos con bisociaciones inesperadas. La IA sugiere
                                combinaciones que tu mente consciente nunca consideraría.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100">
                            <div className="text-3xl mb-3">🌍</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Para Changemakers</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Desarrolla soluciones a problemas sociales complejos. Cada idea guardada
                                es una semilla potencial para impacto sistémico.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Philosophy */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Filosofía del Proyecto</h2>
                    <blockquote className="border-l-4 border-[#C5A47E] pl-6 italic text-lg text-gray-700 mb-6">
                        "Las mejores ideas no nacen completamente formadas. Emergen de la colisión de conceptos,
                        la iteración constante y la voluntad de explorar lo desconocido."
                    </blockquote>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Este proyecto nace en el <span className="font-semibold">Solsticio de Invierno de 2025</span>,
                        un momento simbólico de renovación y nuevos comienzos. Representa la creencia de que la tecnología
                        debe amplificar la creatividad humana, no reemplazarla.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Cada línea de código está escrita con la intención de que esta herramienta sea
                        <span className="font-semibold"> open source, escalable y accesible</span>—porque las mejores
                        ideas para cambiar el mundo pueden venir de cualquier persona, en cualquier lugar.
                    </p>
                </div>

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-[#C5A47E] to-[#b08e68] rounded-3xl p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                    <h2 className="text-3xl font-bold text-white mb-4">¿Listo para Amplificar tus Ideas?</h2>
                    <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                        Únete al experimento. Guarda tu primera idea. Deja que la IA te sorprenda con conexiones
                        que nunca imaginaste.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                            href="/"
                            className="px-8 py-4 bg-white text-[#C5A47E] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Empezar Ahora →
                        </a>
                        <a
                            href="https://estudioprompt.com/banco-de-ideas/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
                        >
                            Leer Más
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-12 text-gray-500 text-sm">
                    <p>Desarrollado con 💡 por Damián Lafferranderie</p>
                    <p className="mt-2">
                        <a href="https://github.com/damiancolo/banco-de-ideas" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A47E] transition-colors">
                            Ver en GitHub
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
}
