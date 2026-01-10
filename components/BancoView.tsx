"use client";

import { useState } from 'react';
import { logger } from '@/lib/logger';
import IdeaModal from './IdeaModal';

type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category?: 'user' | 'bisociation';
    deletionAttempts: number;
};

export default function BancoView({
    initialIdeas,
    isConnected
}: {
    initialIdeas: SavedIdea[];
    isConnected: boolean;
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

    const handleDelete = async (id: string) => {
        // No confirm for deletion attempts tracking
        setDeletingId(id);
        try {
            const response = await fetch(`/api/ideas?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setIdeas(prev => prev.map(idea =>
                    idea.id === id
                        ? { ...idea, deletionAttempts: (idea.deletionAttempts || 0) + 1 }
                        : idea
                ));
                // Si la idea estaba seleccionada en el modal, actualizarla ahí también
                if (selectedIdea && selectedIdea.id === id) {
                    setSelectedIdea(prev => prev ? { ...prev, deletionAttempts: (prev.deletionAttempts || 0) + 1 } : null);
                }
            } else {
                const data = await response.json();
                alert(`Error al eliminar: ${data.error || 'Desconocido'}`);
            }
        } catch (error) {
            logger.error('Error deleting idea:', error);
            alert('Error de conexión al intentar eliminar la idea.');
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
                    className={`font-medium transition-colors ${view === 'user' ? 'text-gray-800' : 'hover:text-gray-600'}`}
                >
                    Mis Ideas
                </button>
                {view === 'bisociation' && (
                    <>
                        <span>/</span>
                        <button
                            onClick={() => setView('user')}
                            className="hover:text-gray-600 transition-colors"
                        >
                            Mis Ideas
                        </button>
                        <span>/</span>
                        <span className="text-gray-800 font-medium">Bisociaciones</span>
                    </>
                )}
            </div>

            {/* Folder Item */}
            {view === 'user' && (
                <div className="mb-8">
                    <button
                        onClick={() => setView('bisociation')}
                        className="flex items-center gap-4 bg-[#EBE8E0] hover:bg-[#E0DDD5] p-6 rounded-2xl w-full text-left transition-colors group border border-black/5"
                    >
                        <div className="w-12 h-12 flex items-center justify-center bg-[#C5A47E] text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Bisociaciones</h3>
                            <p className="text-sm text-gray-500">Ideas generadas por la IA</p>
                        </div>
                        <div className="ml-auto text-gray-400 group-hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </div>
                    </button>
                </div>
            )}

            {/* Grid of Ideas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {visibleIdeas.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                        <p>No hay ideas en esta carpeta.</p>
                    </div>
                ) : (
                    visibleIdeas.map((idea) => (
                        <div
                            key={idea.id}
                            onClick={() => setSelectedIdea(idea)}
                            className={`bg-white p-6 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition-all group h-full flex flex-col relative cursor-pointer ${deletingId === idea.id ? 'opacity-50 scale-[0.98]' : ''}`}
                        >
                            <div className="text-xs text-gray-400 mb-3 font-mono flex justify-between items-center">
                                <span>{new Date(idea.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                <div className="flex items-center gap-2">
                                    {idea.category === 'bisociation' && <span className="text-[#C5A47E] font-bold">IA</span>}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(idea.id);
                                        }}
                                        disabled={deletingId !== null}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-400 transition-all rounded-md hover:bg-red-50"
                                        title="Eliminar idea"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            </div>
                            <p className="text-lg text-gray-800 font-medium leading-relaxed group-hover:text-[#C5A47E] transition-colors line-clamp-5 flex-1 break-words">
                                {idea.text}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Tarjeta Sepia: Intentos de Borrado */}
            {ideas.some(idea => (idea.deletionAttempts || 0) > 0) && (
                <div className="mt-12 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="bg-[#EBE0D0] p-8 rounded-[2.5rem] shadow-lg border border-[#D9C4A9] flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D9C4A9]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                        <div className="flex-1 relative z-10">
                            <div className="flex items-center gap-3 mb-4 text-[#8C7A65]">
                                <div className="p-2 bg-[#D9C4A9]/30 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
                                </div>
                                <h3 className="font-bold text-xs uppercase tracking-[0.2em] opacity-70">Log de Resistencia</h3>
                            </div>
                            <h2 className="text-3xl font-serif italic text-[#594A3A] mb-4">Intentos de Borrado</h2>
                            <p className="text-[#8C7A65] text-sm leading-relaxed max-w-sm italic opacity-80">
                                "Lo que no se borra, se hace más fuerte. Estas ideas han resistido el pulso de la eliminación y permanecen aquí, latentes."
                            </p>
                        </div>

                        <div className="w-full md:w-80 space-y-2 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar relative z-10">
                            {ideas
                                .filter(idea => (idea.deletionAttempts || 0) > 0)
                                .sort((a, b) => b.deletionAttempts - a.deletionAttempts)
                                .map(idea => (
                                    <div key={idea.id} className="flex justify-between items-center gap-4 p-3 rounded-2xl bg-white/40 border border-[#D9C4A9]/40 hover:bg-white/60 transition-all group backdrop-blur-sm">
                                        <p className="text-sm text-[#594A3A] line-clamp-1 font-medium italic">
                                            {idea.text.substring(0, 40)}{idea.text.length > 40 ? '...' : ''}
                                        </p>
                                        <div className="shrink-0 flex items-center gap-1 bg-[#D9C4A9] text-[#594A3A] text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                            <span>{idea.deletionAttempts}</span>
                                            <span className="opacity-60">×</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalles */}
            {selectedIdea && (
                <IdeaModal
                    idea={selectedIdea}
                    isOpen={!!selectedIdea}
                    onClose={() => setSelectedIdea(null)}
                    onDelete={(id) => {
                        handleDelete(id);
                    }}
                />
            )}
        </div>
    );
}

