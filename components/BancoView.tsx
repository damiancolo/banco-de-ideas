"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Definición local del tipo para no importar desde lib/db (que tiene 'fs')
type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category?: 'user' | 'bisociation';
};

export default function BancoView({ initialIdeas }: { initialIdeas: SavedIdea[] }) {
    const [view, setView] = useState<'user' | 'bisociation'>('user');
    const [localIdeas, setLocalIdeas] = useState<SavedIdea[]>([]);

    // Cargar ideas de LocalStorage al iniciar
    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem("ideas_bank_v1") || "[]");
            // Mapear al formato interno si es necesario (el guardado en page.tsx tiene date en vez de createdAt)
            const formatted = stored.map((item: any) => ({
                id: item.id.toString(),
                text: item.text,
                createdAt: item.date || new Date().toISOString(), // Fallback a hoy si no hay fecha
                category: item.category || 'user'
            }));
            setLocalIdeas(formatted);
        } catch (e) {
            console.error("Error loading local ideas", e);
        }
    }, []);

    // Combinar ideas del servidor (si las hubiera) con las locales
    // Damos prioridad a las locales para la vista de usuario para garantizar inmediatez
    // Para bisociaciones, si vienen del servidor, las mostramos. Si no, quizá habría que migrarlas a local también.
    // Por ahora, fusionamos todo.
    const allIdeas = [...initialIdeas, ...localIdeas];

    // Eliminar duplicados por ID (aunque los IDs son timestamps y es dificil que choquen)
    const uniqueIdeas = Array.from(new Map(allIdeas.map(item => [item.id, item])).values());

    // Ordenar por fecha descendente
    uniqueIdeas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filtrar ideas según la vista
    const visibleIdeas = uniqueIdeas.filter(idea => {
        // Compatibilidad hacia atrás: si no tiene category, es user
        const category = idea.category || 'user';
        return category === view;
    });

    return (
        <div className="max-w-4xl mx-auto">
            {/* Navigation / Breadcrumbsish */}
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
                        <span className="text-gray-800 font-medium">Bisociaciones</span>
                    </>
                )}
            </div>

            {/* Visually represented Folder Item if in User view */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 key={view}">
                {visibleIdeas.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        <p>No hay ideas en esta carpeta.</p>
                    </div>
                ) : (
                    visibleIdeas.map((idea) => (
                        <div key={idea.id} className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition-shadow group h-full flex flex-col">
                            <div className="text-xs text-gray-400 mb-3 font-mono flex justify-between">
                                <span>{new Date(idea.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                {/* Mostrar indicativo IA si estamos en visión global o por claridad */}
                                {idea.category === 'bisociation' && <span className="text-[#C5A47E] font-bold">IA</span>}
                            </div>
                            <p className="text-lg text-gray-800 font-medium leading-relaxed group-hover:text-[#C5A47E] transition-colors line-clamp-4 flex-1">
                                {idea.text}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
