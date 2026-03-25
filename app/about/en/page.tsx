import Link from 'next/link';

export default function AboutPageEN() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#F8F5F0] via-white to-[#EBE8E0] p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                {/* Language Switcher */}
                <div className="flex justify-center gap-4 mb-8 text-sm font-medium text-gray-500">
                    <Link href="/about" className="hover:text-[#C5A47E] transition-colors">ES</Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/about/en" className="text-[#C5A47E] font-bold">EN</Link>
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
                        title="Back to home"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18h6"></path>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 22h4"></path>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"></path>
                        </svg>
                    </Link>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Idea Bank</h1>
                    <p className="text-xl text-gray-600 font-light">Winter Solstice 2025</p>
                </div>

                {/* El Banco de Ideas - Introduction */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">The Idea Bank</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        We believe that ideas are humanity&apos;s most important capital and that artificial intelligence is a catalyst for their potential. It is urgent and necessary to start exploring this marriage, so we propose a space to experiment with the possibilities. This space is called <span className="font-semibold text-[#C5A47E]">unban code Ideas.com</span>
                    </p>
                </div>

                {/* Description */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Idea Bank Description</h2>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        The Idea Bank is a space designed to facilitate the generation and development of individual and collective ideas. It uses advanced artificial intelligence technologies to assist users in the creation, co-creation, refinement, expansion, and collectivization of Ideas.
                    </p>
                </div>

                {/* Justification */}
                <div className="bg-gradient-to-br from-[#C5A47E]/5 to-transparent rounded-3xl p-8 md:p-12 shadow-xl border border-[#C5A47E]/10 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Justification</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                        This tool comes to solve a specific problem: where to save ideas? Generally, people save their ideas in a notebook, a planner, a mobile note app, a .doc, or a WhatsApp group with themselves; <span className="font-semibold">unbancodeideas.com</span> aims to be the tool for saving ideas.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        We want ideas to have direct action, so we also apply it as a meta-idea, which is why the idea bank has features that were once ideas; the idea bank evolves and has functionality.
                    </p>
                </div>

                {/* Key Functionalities */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-250">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Key Features</h2>
                    <div className="space-y-12">
                        <div className="border-l-4 border-[#C5A47E] pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Save Ideas</h3>
                            <p className="text-gray-700 leading-relaxed">
                                The system implements an optimized input flow to reduce cognitive load. It allows for agile registration of concepts through text interfaces or voice commands processed by neural transcription models (OpenAI Whisper), ensuring immediate data capture.
                            </p>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Analyze Ideas</h3>
                            <p className="text-gray-700 leading-relaxed">
                                The platform integrates a natural language processing engine (LLM) that acts as an analytical layer. This engine evaluates the feasibility of proposals, generates constructive criticism, and suggests technical iterations, transforming the repository into an active advisory system.
                            </p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Generate Ideas</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Based on principles of bisociation, the system automates the generation of synthetic ideas that complement the user&apos;s database. This works as an inspiration engine that expands the search domain and encourages the creation of new logical connections.
                            </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Search Ideas</h3>
                            <div className="text-gray-700 leading-relaxed space-y-4">
                                <p>Information retrieval moves away from the traditional keyword matching model. An embedding vector search architecture is used:</p>
                                <ul className="list-disc ml-6 space-y-2">
                                    <li><span className="font-semibold">Vectorization:</span> Each idea is converted into a high-dimensional dense vector using OpenAI embedding models.</li>
                                    <li><span className="font-semibold">Cosine Similarity:</span> The search engine calculates the mathematical proximity between vectors to find ideas with similar conceptual structures, regardless of the lexicon used.</li>
                                    <li><span className="font-semibold">Match Quantification:</span> A semantic similarity percentage is provided, allowing for the identification of conceptual duplicates or deep relationships between ideas dispersed over time.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Private Space */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-blue-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-275">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Private Space</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                        In addition to the shared public space, each user can access their own <span className="font-semibold text-[#C5A47E]">personal and private idea bank</span>. With a Google account, you get your own space where your ideas are yours alone: no one else can see or access them.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="text-2xl mb-2">🔐</div>
                            <h3 className="font-bold text-gray-800 mb-1">Sign in with Google</h3>
                            <p className="text-sm text-gray-600">One click to enter. No passwords, no forms. Your Google identity is your key.</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="text-2xl mb-2">🗂️</div>
                            <h3 className="font-bold text-gray-800 mb-1">Ideas only yours</h3>
                            <p className="text-sm text-gray-600">Your private ideas are linked to your account and invisible to other users and AI agents.</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="text-2xl mb-2">✨</div>
                            <h3 className="font-bold text-gray-800 mb-1">Full capabilities</h3>
                            <p className="text-sm text-gray-600">Chat, voice, bisociations and semantic search — all available in your private space.</p>
                        </div>
                    </div>
                </div>

                {/* Technical Architecture Deep Dive */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl text-white mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <h2 className="text-3xl font-bold mb-8">Technical Architecture and Stack</h2>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-[#C5A47E] mb-4 flex items-center gap-2">
                                <span>🧠</span> AI Engine, Multimodality, and Vectorization
                            </h3>
                            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                                <p><span className="text-white font-medium">Logical Processing:</span> Use of GPT-4o-mini for inference, feasibility analysis, and generation of bisociative ideas.</p>
                                <div className="pl-4 border-l border-gray-700">
                                    <p className="font-medium text-white mb-1">Voice Interaction (STT/TTS):</p>
                                    <ul className="space-y-2">
                                        <li>• <span className="text-white">Speech-to-Text (STT):</span> Integration of OpenAI Whisper API for precise idea transcription via audio input.</li>
                                        <li>• <span className="text-white">Text-to-Speech (TTS):</span> Use of voice synthesis models (OpenAI TTS-1) for reading responses.</li>
                                    </ul>
                                </div>
                                <p><span className="text-white font-medium">Embeddings API:</span> Implementation of vectorization models to transform each idea into a numerical vector, allowing the calculation of similarity based on structural essence.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                                <span>☁️</span> Data Persistence and Vector Search
                            </h3>
                            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                                <p><span className="text-white font-medium">Database:</span> Use of MongoDB Atlas as a distributed persistence layer.</p>
                                <p><span className="text-white font-medium">Atlas Vector Search:</span> Configuration of vector indexes for high-speed semantic queries directly in the database.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                                <span>⚡</span> Modern and Scalable Stack
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4 text-gray-300 text-sm">
                                <p><span className="text-white font-medium">Framework:</span> Next.js 16 with SSR and Server Components.</p>
                                <p><span className="text-white font-medium">Language:</span> TypeScript for a type-safe architecture.</p>
                                <p className="md:col-span-2"><span className="text-white font-medium">Infrastructure:</span> Modular design with production-ready logging and error handling.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Objectives */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-350">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Idea Bank Objectives</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="text-4xl mb-4">🎯</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Optimize Innovation</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Improve efficiency in the idea generation process, avoiding duplication and promoting more effective use of available creative resources.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="text-4xl mb-4">🌍</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Foster Global Collaboration</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Eliminate barriers to collaboration, allowing ideas from various parts of the world to be shared and developed together.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Impact Potential */}
                <div className="bg-gradient-to-br from-[#C5A47E]/10 to-transparent rounded-3xl p-8 md:p-12 shadow-xl border border-[#C5A47E]/20 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Impact Potential</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🚀</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">For Entrepreneurs</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Transforms vague concepts into structured business proposals. The AI acts as a co-founder that never sleeps.
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🔬</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">For Researchers</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Captures emerging hypotheses and explores interdisciplinary connections.
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🎨</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">For Creativos</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Breaks creative blocks with unexpected bisociations that your conscious mind would never consider.
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="text-3xl mb-3">🌍</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">For Changemakers</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Develops solutions to complex social problems. Each idea is a seed for systemic impact.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Philosophy */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-450">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        Project Philosophy
                    </h2>
                    <blockquote className="border-l-4 border-[#C5A47E] pl-6 italic text-xl text-gray-700 mb-8 leading-relaxed">
                        &quot;The best ideas are not born fully formed. They emerge from the collision of concepts, constant iteration, and the willingness to explore the unknown.&quot;
                    </blockquote>
                    <p className="text-gray-700 leading-relaxed">
                        Every line of code is written with the intention that this tool be <span className="font-semibold text-[#C5A47E]">open source, scalable, and accessible</span>—because the best ideas to change the world can come from anyone, anywhere.
                    </p>
                </div>

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-[#C5A47E] to-[#b08e68] rounded-3xl p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Amplify your Ideas?</h2>
                    <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                        Join the experiment. Save your first idea. Let AI surprise you with connections you never imagined.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/"
                            className="px-8 py-4 bg-white text-[#C5A47E] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Start Now →
                        </Link>
                        <a
                            href="https://estudioprompt.com/banco-de-ideas/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
                        >
                            Read More
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
                            Planned future functionality (ideas welcome)
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-12 text-gray-500 text-sm space-y-2">
                    <p>Developed with 💡 by Damián Lafferranderie</p>
                    <p>
                        <a href="https://github.com/damiancolo/banco-de-ideas" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A47E] transition-colors">
                            View on GitHub
                        </a>
                    </p>
                </div>
            </div>
        </main >
    );
}
