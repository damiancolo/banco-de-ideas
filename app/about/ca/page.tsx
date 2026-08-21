import Link from 'next/link';

export default function AboutPageCA() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#F8F5F0] via-white to-[#EBE8E0] p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                {/* Language Switcher */}
                <div className="flex justify-center gap-4 mb-8 text-sm font-medium text-gray-500">
                    <Link href="/about" className="hover:text-[#C5A47E] transition-colors">ES</Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/about/en" className="hover:text-[#C5A47E] transition-colors">EN</Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/about/ca" className="text-[#C5A47E] font-bold">CA</Link>
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
                        title="Tornar a l'inici"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18h6"></path>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 22h4"></path>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"></path>
                        </svg>
                    </Link>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Banc d&apos;Idees</h1>
                    <p className="text-xl text-gray-600 font-light">Solstici d&apos;Hivern 2025</p>
                </div>

                {/* Justification - first thing to read */}
                <div className="bg-gradient-to-br from-[#C5A47E]/5 to-transparent rounded-3xl p-8 md:p-12 shadow-xl border border-[#C5A47E]/10 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Justificació</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                        On guardes les teves idees? 📝 Un bloc de notes, ✅ el Google Tasks, 💬 un grup de WhatsApp amb tu mateix... 💡 <span className="font-semibold">unbancodeideas.com</span> intenta ser l&apos;eina definitiva per a aquest cas d&apos;ús. Però el seu gran plus és la possibilitat d&apos;inspirar-se, cocreuar i compartir amb altres i les seves idees.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Volem que les idees tinguin acció directa, així que també l&apos;apliquem com a meta-idea, per la qual cosa el banc d&apos;idees té funcionalitats que algun cop van ser idees; el banc d&apos;idees evoluciona.
                    </p>
                </div>

                {/* El Banco de Ideas - Introduction */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">El Banc d&apos;Idees</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Creiem que les idees són el capital més important de la humanitat i que la intel·ligència artificial és un catalitzador del seu potencial. És urgent i necessari començar a explorar aquest maridatge, per la qual cosa proposem un espai per experimentar amb les possibilitats. Aquest espai es diu <span className="font-semibold text-[#C5A47E]">unban code Ideas.com</span>
                    </p>
                </div>

                {/* Description */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Descripció del Banc d&apos;Idees</h2>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        El Banc d&apos;Idees és un espai dissenyat per facilitar la generació i el desenvolupament d&apos;idees individuals i col·lectives. Utilitza tecnologies avançades d&apos;intel·ligència artificial per assistir els usuaris en la creació, co-creació, refinament, expansió i col·lectivització de les Idees.
                    </p>
                </div>

                {/* Key Functionalities */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-250">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Funcionalitats Clau</h2>
                    <div className="space-y-12">
                        <div className="border-l-4 border-[#C5A47E] pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Guardar Idees</h3>
                            <p className="text-gray-700 leading-relaxed">
                                El sistema implementa un flux d&apos;entrada optimitzat per reduir la càrrega cognitiva. Permet el registre àgil de conceptes per text —i si prefereixes parlar, amb el dictat del mateix teclat del telèfon—, garantint una captura immediata de dades.
                            </p>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Analitzar Idees</h3>
                            <p className="text-gray-700 leading-relaxed">
                                La plataforma integra un motor de processament de llenguatge natural (LLM) que actua com a capa analítica. Aquest motor avalua la viabilitat de les propostes, genera crítiques constructives i suggereix iteracions tècniques, transformant el repositori en un sistema actiu d&apos;assessoria.
                            </p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Generar Idees</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Basat en principis de bisociació, el sistema automatitza la generació d&apos;idees sintètiques que complementen la base de dades de l&apos;usuari. Això funciona com un motor d&apos;inspiració que expandeix el domini de cerca i fomenta la creació de noves connexions lògiques.
                            </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Buscar Idees</h3>
                            <div className="text-gray-700 leading-relaxed space-y-4">
                                <p>La recuperació d&apos;informació s&apos;allunya del model tradicional de coincidència de paraules clau. S&apos;utilitza una arquitectura de cerca per vectors d&apos;embedding:</p>
                                <ul className="list-disc ml-6 space-y-2">
                                    <li><span className="font-semibold">Vectorització:</span> Cada idea es converteix en un vector dens d&apos;alta dimensionalitat mitjançant models d&apos;embedding d&apos;OpenAI.</li>
                                    <li><span className="font-semibold">Similitud del Cosenus:</span> El cercador calcula la proximitat matemàtica entre vectors per trobar idees amb estructures conceptuals similars, independentment del lèxic utilitzat.</li>
                                    <li><span className="font-semibold">Quantificació de Coincidència:</span> Es proveeix un percentatge de similitud semàntica, permetent identificar duplicats conceptuals o relacions profundes entre idees disperses en el temps.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Private Space */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-blue-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-275">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Espai Privat</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                        A més de l&apos;espai públic compartit, cada usuari pot accedir al seu propi <span className="font-semibold text-[#C5A47E]">banc d&apos;idees personal i privat</span>. Amb un compte de Google, obtens un espai propi on les teves idees són només teves: ningú més les pot veure ni accedir-hi.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="text-2xl mb-2">🔐</div>
                            <h3 className="font-bold text-gray-800 mb-1">Accés amb Google</h3>
                            <p className="text-sm text-gray-600">Un clic per entrar. Sense contrasenyes, sense formularis. La teva identitat Google és la teva clau.</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="text-2xl mb-2">🗂️</div>
                            <h3 className="font-bold text-gray-800 mb-1">Idees només teves</h3>
                            <p className="text-sm text-gray-600">Les teves idees privades estan vinculades al teu compte i són invisibles per a la resta d&apos;usuaris i agents d&apos;IA.</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="text-2xl mb-2">✨</div>
                            <h3 className="font-bold text-gray-800 mb-1">Mateixes capacitats</h3>
                            <p className="text-sm text-gray-600">Xat, veu, bisociacions i cerca semàntica, tot disponible al teu espai privat.</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="text-2xl mb-2">📱</div>
                            <h3 className="font-bold text-gray-800 mb-1">App al teu mòbil</h3>
                            <p className="text-sm text-gray-600">Instal·la el banc com a app a l&apos;iPhone o Android. Un toc i ets al teu espai privat, sense obrir el navegador.</p>
                        </div>
                    </div>
                </div>

                {/* Custom AI */}
                <div className="bg-gradient-to-br from-[#C5A47E]/5 to-transparent rounded-3xl p-8 md:p-12 shadow-xl border border-[#C5A47E]/20 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-280">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">La teva IA, al teu estil</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                        L&apos;espai privat funciona amb un model d&apos;IA d&apos;última generació com a gestor de les teves idees. Si vols utilitzar un model diferent —un altre proveïdor, una altra personalitat, un altre estil d&apos;anàlisi— escriu-nos. Amb molt de gust configurem l&apos;API que prefereixis per al teu entorn.
                    </p>
                    <a
                        href="mailto:damian@estudioprompt.com?subject=Vull%20configurar%20la%20meva%20IA%20al%20Banc%20d%27Idees"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A47E] hover:bg-[#b08e68] text-white rounded-xl font-medium transition-colors text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Escriu-nos per personalitzar la teva IA
                    </a>
                </div>

                {/* Technical Architecture Deep Dive */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl text-white mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <h2 className="text-3xl font-bold mb-8">Arquitectura Tècnica i Stack</h2>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-[#C5A47E] mb-4 flex items-center gap-2">
                                <span>🧠</span> Motor d&apos;IA, Multimodalitat i Vectorització
                            </h3>
                            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                                <p><span className="text-white font-medium">Espai públic:</span> Motor DeepSeek (deepseek-chat) per a la inferència, anàlisi i generació de bisociacions col·lectives.</p>
                                <p><span className="text-white font-medium">Espai privat:</span> Claude Opus 4.6 (Anthropic) com a gestor personal d&apos;idees — el model més avançat disponible per a l&apos;anàlisi profunda i la generació creativa.</p>
                                <div className="pl-4 border-l border-gray-700">
                                    <p className="font-medium text-white mb-1">Lectura en veu alta (TTS):</p>
                                    <ul className="space-y-2">
                                        <li>• <span className="text-white">Text-to-Speech (TTS):</span> Ús de models de síntesi de veu (OpenAI gpt-4o-mini-tts) per a la lectura de respostes.</li>
                                    </ul>
                                </div>
                                <p><span className="text-white font-medium">API d&apos;Embeddings:</span> Implementació de models de vectorització per transformar cada idea en un vector numèric, permetent el càlcul de la similitud segons l&apos;essència estructural.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                                <span>☁️</span> Persistència de Dades i Cerca Vectorial
                            </h3>
                            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                                <p><span className="text-white font-medium">Base de Dades:</span> Ús de MongoDB Atlas com a capa de persistència distribuïda.</p>
                                <p><span className="text-white font-medium">Atlas Vector Search:</span> Configuració d&apos;índexs vectorials per a consultes semàntiques d&apos;alta velocitat directament a la base de dades.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                                <span>⚡</span> Stack Modern i Escalable
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4 text-gray-300 text-sm">
                                <p><span className="text-white font-medium">Framework:</span> Next.js 16 amb SSR i Server Components.</p>
                                <p><span className="text-white font-medium">Llenguatge:</span> TypeScript per a una arquitectura type-safe.</p>
                                <p className="md:col-span-2"><span className="text-white font-medium">Infraestructura:</span> Disseny modular amb logging i gestió d&apos;errors de producció.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Objectives */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-350">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Objectius del Banc d&apos;Idees</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="text-4xl mb-4">🎯</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Optimitzar la Innovació</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Millorar l&apos;eficiència en el procés de generació d&apos;idees, evitant duplicacions i promovent un ús més efectiu dels recursos creatius disponibles.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="text-4xl mb-4">🌍</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Fomentar la Col·laboració Global</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Eliminar barreres per a la col·laboració, permetent que idees de diverses parts del món siguin compartides i desenvolupades en conjunt.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Impact Potential */}
                <div className="bg-gradient-to-br from-[#C5A47E]/10 to-transparent rounded-3xl p-8 md:p-12 shadow-xl border border-[#C5A47E]/20 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Potencial d&apos;Impacte</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🚀</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Per a Emprenedors</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Transforma conceptes vagues en propostes de negoci estructurades. L&apos;IA actua com a co-founder que mai dorm.
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🔬</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Per a Investigadors</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Capta hipòtesis emergents i explora connexions interdisciplinàries.
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🎨</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Per a Creatius</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Trenca bloquejos creatius amb bisociacions inesperades que la teva ment conscient mai consideraria.
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🌍</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Per a Changemakers</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Desenvolupa solucions a problemes socials complexos. Cada idea és una llavor per a un impacte sistèmic.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Philosophy */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-450">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        Filosofia del Projecte
                    </h2>
                    <blockquote className="border-l-4 border-[#C5A47E] pl-6 italic text-xl text-gray-700 mb-8 leading-relaxed">
                        &quot;Les millors idees no neixen completament formades. Emergeixen de la colisió de conceptes, la iteració constant i la voluntat d&apos;explorar el desconegut.&quot;
                    </blockquote>
                    <p className="text-gray-700 leading-relaxed">
                        Cada línia de codi està escrita amb la intenció que aquesta eina sigui <span className="font-semibold text-[#C5A47E]">open source, escalable i accessible</span>—perquè les millors idees per canviar el món poden venir de qualsevol persona, a qualsevol lloc.
                    </p>
                </div>

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-[#C5A47E] to-[#b08e68] rounded-3xl p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                    <h2 className="text-3xl font-bold text-white mb-4">Llest per Amplificar les teves Idees?</h2>
                    <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                        Uneix-te a l&apos;experiment. Guarda la teva primera idea. Deixa que l&apos;IA et sorprengui amb connexions que mai vas imaginar.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/"
                            className="px-8 py-4 bg-white text-[#C5A47E] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Començar Ara →
                        </Link>
                        <a
                            href="https://estudioprompt.com/banco-de-ideas/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
                        >
                            Llegir Més
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
                            Futures funcionalitats previstes (s&apos;accepten idees)
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-12 text-gray-500 text-sm space-y-2">
                    <p>Desenvolupat amb 💡 per Damián Lafferranderie</p>
                    <p>
                        <a href="https://github.com/damiancolo/banco-de-ideas" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A47E] transition-colors">
                            Veure a GitHub
                        </a>
                    </p>
                </div>
            </div>
        </main >
    );
}
