import Link from 'next/link';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#F8F5F0] via-white to-[#EBE8E0] p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                {/* Language Switcher */}
                <div className="flex justify-center gap-4 mb-8 text-sm font-medium text-gray-500">
                    <Link href="/about" className="text-[#C5A47E] font-bold">ES</Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/about/en" className="hover:text-[#C5A47E] transition-colors">EN</Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/about/ca" className="hover:text-[#C5A47E] transition-colors">CA</Link>
                </div>

                {/* Main Title */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-500">
                    <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#C5A47E] via-[#b08e68] to-[#C5A47E] mb-2 tracking-tight">
                        UNBAN CODE IDEAS
                    </h1>
                </div>

                {/* Header */}
                <div className="text-center mb-16 animate-in fade-in slide-in-from-top duration-700">
                    <Link
                        href="/"
                        className="inline-block p-4 bg-gradient-to-br from-[#C5A47E] to-[#b08e68] rounded-2xl mb-6 shadow-lg hover:scale-110 transition-transform cursor-pointer group"
                        title="Volver al inicio"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18h6"></path>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 22h4"></path>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"></path>
                        </svg>
                    </Link>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Banco de Ideas</h1>
                    <p className="text-xl text-gray-600 font-light">Solsticio de Invierno 2025</p>
                </div>

                {/* El Banco de Ideas - Introduction */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">El Banco de Ideas</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Creemos que las ideas son la capital más importante de la humanidad y que la inteligencia artificial es un catalizador de su potencial. Es urgente y necesario comenzar a explorar este maridaje por lo que proponemos un espacio para experimentar con las posibilidades. Este espacio se llama <span className="font-semibold text-[#C5A47E]">unban code Ideas.com</span>
                    </p>
                </div>

                {/* Description */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Descripción del Banco de Ideas</h2>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        El Banco de Ideas es un espacio diseñado para facilitar la generación y desarrollo de ideas individuales y colectivas. Utiliza tecnologías avanzadas de inteligencia artificial para asistir a los usuarios en la creación, co-creación, refinamiento, expansión y colectivización de las Ideas.
                    </p>
                </div>

                {/* Justification */}
                <div className="bg-gradient-to-br from-[#C5A47E]/5 to-transparent rounded-3xl p-8 md:p-12 shadow-xl border border-[#C5A47E]/10 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Justificación</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                        Esta herramienta viene a solucionar un problema concreto, ¿donde guardar las ideas?, generalmente la gente guarda sus ideas en un cuaderno, una agenda, un bloc de notas en el móvil, un .doc, un grupo de whatsapp con sigo mismo; <span className="font-semibold">unbancodeideas.com</span> busca ser la herramienta para guardar ideas.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Queremos que las ideas tengan acción directa, así que también la aplicamos como metaidea, por lo que el banco de ideas tiene funcionalidades que alguna vez fueron ideas, el banco de ideas evoluciona y tiene funcionalidades.
                    </p>
                </div>

                {/* Key Functionalities */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-250">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Funcionalidades Clave</h2>
                    <div className="space-y-12">
                        <div className="border-l-4 border-[#C5A47E] pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Guardar Ideas</h3>
                            <p className="text-gray-700 leading-relaxed">
                                El sistema implementa un flux de entrada optimizado para reducir la carga cognitiva. Permite el registro de conceptos de forma ágil mediante interfaces de texto o comandos de voz procesados por modelos de transcripción neuronal (OpenAI Whisper), garantizando una captura inmediata de datos.
                            </p>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Analizar Ideas</h3>
                            <p className="text-gray-700 leading-relaxed">
                                La plataforma integra un motor de procesamiento de lenguaje natural (LLM) que actúa como capa analítica. Este motor evalúa la viabilidad de las propuestas, genera críticas constructivas y sugiere iteraciones técnicas, transformando el repositorio en un sistema activo de asesoría.
                            </p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Generar Ideas</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Basado en principios de bisociación, el sistema automatiza la generación de ideas sintéticas que complementan la base de datos del usuario. Esto funciona como un motor de inspiración que expande el dominio de búsqueda y fomenta la creación de nuevas clínicas lógicas.
                            </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Buscar Ideas</h3>
                            <div className="text-gray-700 leading-relaxed space-y-4">
                                <p>La recuperación de información se aleja del modelo tradicional de coincidencia de palabras clave. Se utiliza una arquitectura de búsqueda por vectores de embedding:</p>
                                <ul className="list-disc ml-6 space-y-2">
                                    <li><span className="font-semibold">Vectorización:</span> Cada idea se convierte en un vector denso de alta dimensionalidad mediante modelos de embedding de OpenAI.</li>
                                    <li><span className="font-semibold">Similitud del Coseno:</span> El buscador calcula la proximidad matemática entre vectores para encontrar ideas con estructuras conceptuales similares, independientemente del léxico utilizado.</li>
                                    <li><span className="font-semibold">Cuantificación de Coincidencia:</span> Se provee un porcentaje de similitud semántica, permitiendo identificar duplicados conceptuales o relaciones profundas entre ideas dispersas en el tiempo.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Architecture Deep Dive */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl text-white mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <h2 className="text-3xl font-bold mb-8">Arquitectura Técnica y Stack</h2>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-[#C5A47E] mb-4 flex items-center gap-2">
                                <span>🧠</span> Motor de IA, Multimodalidad y Vectorización
                            </h3>
                            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                                <p><span className="text-white font-medium">Procesamiento Lógico:</span> Empleo de GPT-4o-mini para la inferencia, análisis de viabilidad y generación de ideas bisociativas.</p>
                                <div className="pl-4 border-l border-gray-700">
                                    <p className="font-medium text-white mb-1">Interacción por Voz (STT/TTS):</p>
                                    <ul className="space-y-2">
                                        <li>• <span className="text-white">Speech-to-Text (STT):</span> Integración de la API OpenAI Whisper para la transcripción precisa de ideas mediante entrada de audio.</li>
                                        <li>• <span className="text-white">Text-to-Speech (TTS):</span> Uso de modelos de síntesis de voz (OpenAI TTS-1) para la lectura de respuestas.</li>
                                    </ul>
                                </div>
                                <p><span className="text-white font-medium">API de Embeddings:</span> Implementación de modelos de vectorización para transformar cada idea en un vector numérico, permitiendo el cálculo de similitud según la esencia estructural.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                                <span>☁️</span> Persistencia de Datos y Búsqueda Vectorial
                            </h3>
                            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                                <p><span className="text-white font-medium">Base de Datos:</span> Uso de MongoDB Atlas como capa de persistencia distribuida.</p>
                                <p><span className="text-white font-medium">Atlas Vector Search:</span> Configuración de índices vectoriales para consultas semánticas de alta velocidad directamente en la base de datos.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                                <span>⚡</span> Stack Moderno y Escalable
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4 text-gray-300 text-sm">
                                <p><span className="text-white font-medium">Framework:</span> Next.js 16 con SSR y Server Components.</p>
                                <p><span className="text-white font-medium">Lenguaje:</span> TypeScript para arquitectura type-safe.</p>
                                <p className="md:col-span-2"><span className="text-white font-medium">Infraestructura:</span> Diseño modular con logging y error handling de producción.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Objectives */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-350">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Objetivos del Banco de Ideas</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="text-4xl mb-4">🎯</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Optimizar la Innovación</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Mejorar la eficiencia en el proceso de generación de ideas, evitando duplicaciones y promoviendo un uso más efectivo de los recursos creativos disponibles.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="text-4xl mb-4">🌍</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Fomentar la Colaboración Global</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Eliminar barreras para la colaboración, permitiendo que ideas de diversas partes del mundo sean compartidas y desarrolladas en conjunto.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Impact Potential */}
                <div className="bg-gradient-to-br from-[#C5A47E]/10 to-transparent rounded-3xl p-8 md:p-12 shadow-xl border border-[#C5A47E]/20 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Potencial de Impacto</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🚀</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Para Emprendedores</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Transforma conceptos vagos en propuestas de negocio estructuradas. La IA actúa como co-founder que nunca duerme.
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🔬</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Para Investigadores</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Captura hipótesis emergentes y explora conexiones interdisciplinarias.
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🎨</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Para Creativos</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Rompe bloqueos creativos con bisociaciones inesperadas que tu mente consciente nunca consideraría.
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🌍</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Para Changemakers</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Desarrolla soluciones a problemas sociales complejos. Cada idea es una semilla para impacto sistémico.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Philosophy */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-450">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        Filosofía del Proyecto
                    </h2>
                    <blockquote className="border-l-4 border-[#C5A47E] pl-6 italic text-xl text-gray-700 mb-8 leading-relaxed">
                        &quot;Las mejores ideas no nacen completamente formadas. Emergen de la colisión de conceptos, la iteración constante y la voluntad de explorar lo desconocido.&quot;
                    </blockquote>
                    <p className="text-gray-700 leading-relaxed">
                        Cada línea de código está escrita con la intención de que esta herramienta sea <span className="font-semibold text-[#C5A47E]">open source, escalable y accesible</span>—porque las mejores ideas para cambiar el mundo pueden venir de cualquier persona, en cualquier lugar.
                    </p>
                </div>

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-[#C5A47E] to-[#b08e68] rounded-3xl p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                    <h2 className="text-3xl font-bold text-white mb-4">¿Listo para Amplificar tus Ideas?</h2>
                    <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                        Únete al experimento. Guarda tu primera idea. Deja que la IA te sorprenda con conexiones que nunca imaginaste.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/"
                            className="px-8 py-4 bg-white text-[#C5A47E] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Empezar Ahora →
                        </Link>
                        <a
                            href="https://estudioprompt.com/banco-de-ideas/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
                        >
                            Leer Más
                        </a>
                    </div>

                    <div className="mt-8">
                        <a
                            href="https://docs.google.com/document/d/1f9gPyeVa-QOIigMyLdfKVpkB--BmvH44q1bMKJZM5gU/edit?usp=sharing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all text-sm backdrop-blur-sm"
                        >
                            <span>🚀</span>
                            Futuras funcionalidades previstas (se aceptan ideas)
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-12 text-gray-500 text-sm space-y-2">
                    <p>Desarrollado con 💡 por Damián Lafferranderie</p>
                    <p>
                        <a href="https://github.com/damiancolo/banco-de-ideas" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A47E] transition-colors">
                            Ver en GitHub
                        </a>
                    </p>
                </div>
            </div>
        </main >
    );
}
