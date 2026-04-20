"use client";

import { useState } from 'react';
import { logger } from '@/lib/logger';
import IdeaModal from './IdeaModal';

type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category?: 'user' | 'bisociation';
    highlightCount: number;
    comments: { text: string; createdAt: string }[];
};

function parseAuthor(text: string): { author: string | null; displayText: string } {
    const match = text.match(/^\[([^\]]+)\]: /);
    if (match) return { author: match[1], displayText: text.slice(match[0].length) };
    return { author: null, displayText: text };
}

export default function BancoView({
    initialIdeas,
    isConnected,
    apiPrefix = '/api',
    userName,
}: {
    initialIdeas: SavedIdea[];
    isConnected: boolean;
    apiPrefix?: string;
    userName?: string;
}) {
    const [view, setView] = useState<'user' | 'bisociation'>('user');
    const [ideas, setIdeas] = useState<SavedIdea[]>(initialIdeas);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);

    // Filtrar ideas según la vista
    const visibleIdeas = ideas.filter(idea => {
        const category = idea.category || 'user';
        return category === view;
    });

    const handleHighlight = async (id: string) => {
        setDeletingId(id);
        try {
            const response = await fetch(`${apiPrefix}/ideas?id=${id}`, {
                method: 'DELETE', // Sigue usando el mismo endpoint pero cambia el concepto
            });

            if (response.ok) {
                setIdeas(prev => prev.map(idea =>
                    idea.id === id
                        ? { ...idea, highlightCount: (idea.highlightCount || 0) + 1 }
                        : idea
                ));
                if (selectedIdea && selectedIdea.id === id) {
                    setSelectedIdea(prev => prev ? { ...prev, highlightCount: (prev.highlightCount || 0) + 1 } : null);
                }
            } else {
                const data = await response.json();
                alert(`Error al resaltar: ${data.error || 'Desconocido'}`);
            }
        } catch (error) {
            logger.error('Error highlighting idea:', error);
            alert('Error de conexión al intentar resaltar la idea.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Warning de Conexión */}
            {!isConnected && (
                <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="text-amber-500 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900 text-sm">Problema de Conexión con MongoDB</h4>
                        <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                            No pudimos conectar con la base de datos en la nube. Esto suele deberse a que tu dirección IP actual no está autorizada en MongoDB Atlas (Whitelist).
                            <br />
                            <span className="font-medium">Las ideas que veas aquí podrían no estar actualizadas o faltar por completo.</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-4 mb-8 text-gray-400">
                <button
                    onClick={() => setView('user')}
                    className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${view === 'user'
                        ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-105'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    Bisociaciones Artesanales
                </button>
                <button
                    onClick={() => setView('bisociation')}
                    className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${view === 'bisociation'
                        ? 'bg-[#C5A47E] text-white shadow-lg shadow-[#C5A47E]/20 scale-105'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    Bisociaciones Artificiales
                </button>
            </div>

            <div className="mb-8">
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter mb-4">
                    unban code ideas
                </h1>
                <p className="text-lg text-gray-500 font-medium">unbancodeideas.com</p>
            </div>

            {/* Tarjeta Sepia: Ideas Resaltadas - MOVED TO TOP */}
            {ideas.some(idea => (idea.highlightCount || 0) > 0) && (
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="bg-[#EBE0D0] p-8 rounded-[2.5rem] shadow-lg border border-[#D9C4A9] flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                        <div className="flex-1 relative z-10">
                            <h2 className="text-2xl font-bold text-[#594A3A] flex items-center gap-2">
                                Ideas
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                            </h2>
                        </div>

                        <div className="w-full md:w-80 space-y-2 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar relative z-10">
                            {ideas
                                .filter(idea => (idea.highlightCount || 0) > 0)
                                .sort((a, b) => b.highlightCount - a.highlightCount)
                                .map(idea => (
                                    <div
                                        key={idea.id}
                                        onClick={() => setSelectedIdea(idea)}
                                        className="flex justify-between items-center gap-4 p-3 rounded-2xl bg-white/40 border border-[#D9C4A9]/40 hover:bg-white/60 transition-all group backdrop-blur-sm cursor-pointer"
                                    >
                                        <p className="text-sm text-[#594A3A] line-clamp-1 font-medium">
                                            {idea.text.substring(0, 40)}{idea.text.length > 40 ? '...' : ''}
                                        </p>
                                        <div className="shrink-0 flex items-center gap-1 bg-[#D9C4A9] text-[#594A3A] text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                            <span>{idea.highlightCount}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Grid of Ideas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {visibleIdeas.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                        <p>No hay ideas en esta carpeta.</p>
                    </div>
                ) : (
                    visibleIdeas.map((idea) => {
                        const { author, displayText } = parseAuthor(idea.text);
                        return (
                        <div
                            key={idea.id}
                            onClick={() => setSelectedIdea(idea)}
                            className={`bg-white p-6 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition-all group h-full flex flex-col relative cursor-pointer ${deletingId === idea.id ? 'opacity-50 scale-[0.98]' : ''}`}
                        >
                            <div className="text-xs text-gray-400 mb-3 font-mono flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span>{new Date(idea.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                    {author && <span className="opacity-0 group-hover:opacity-100 text-gray-500 font-medium not-mono transition-opacity">{author}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {idea.category === 'bisociation' && <span className="text-[#C5A47E] font-bold">IA</span>}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleHighlight(idea.id);
                                        }}
                                        disabled={deletingId !== null}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-amber-400 transition-all rounded-md hover:bg-amber-50"
                                        title="Resaltar idea"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                    </button>
                                </div>
                            </div>
                            <p className="text-lg text-gray-800 font-medium leading-relaxed group-hover:text-[#C5A47E] transition-colors line-clamp-5 flex-1 break-words">
                                {displayText}
                            </p>
                        </div>
                        );
                    })
                )}
            </div>

            {/* Modal de Detalles */}
            {selectedIdea && (
                <IdeaModal
                    idea={selectedIdea}
                    isOpen={!!selectedIdea}
                    onClose={() => setSelectedIdea(null)}
                    onDelete={(id) => {
                        handleHighlight(id);
                    }}
                    apiPrefix={apiPrefix}
                    userName={userName}
                    onCommentAdded={(newComment) => {
                        setIdeas(prev => prev.map(idea =>
                            idea.id === selectedIdea.id
                                ? { ...idea, comments: [...idea.comments, newComment] }
                                : idea
                        ));
                        setSelectedIdea(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
                    }}
                />
            )}
        </div>
    );
}

