"use client";

import { useState } from 'react';
import Link from 'next/link';

interface SearchResult {
    id: string;
    title: string;
    summary: string;
    similarity: number;
}

export default function SemanticSearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const res = await fetch('/api/search/semantic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error en la búsqueda');
            }

            setResults(data.result || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const getSimilarityColor = (similarity: number): string => {
        if (similarity >= 0.8) return 'text-green-600 bg-green-50';
        if (similarity >= 0.6) return 'text-yellow-600 bg-yellow-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <main className="min-h-screen bg-[#F8F5F0] p-6 md:p-12 relative">
            {/* Header */}
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Búsqueda por esencia</h1>
                    <p className="text-gray-500 mt-2">Encuentra ideas por su esencia, no solo por palabras.</p>
                </div>
                <Link
                    href="/banco"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-800 hover:border-gray-400 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </Link>
            </div>

            {/* Search Form */}
            <div className="max-w-4xl mx-auto mb-10">
                <form onSubmit={handleSearch} className="relative">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex items-center gap-3">
                        <div className="pl-4 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Busca por esencia, no por palabras..."
                            className="flex-1 text-lg bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400 py-3"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="px-6 py-3 bg-[#C5A47E] text-white rounded-xl font-medium hover:bg-[#b08e68] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Buscar'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Error */}
            {error && (
                <div className="max-w-4xl mx-auto mb-6">
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                        <strong>Error:</strong> {error}
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="max-w-4xl mx-auto">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center gap-3 text-gray-500">
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Buscando conexiones por esencia...
                        </div>
                    </div>
                ) : hasSearched && results.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg">
                            No se encontraron ideas similares.
                        </div>
                        <p className="text-gray-400 mt-2 text-sm">
                            Asegúrate de haber ejecutado el script de migración para generar embeddings.
                        </p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 mb-4">
                            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                        </p>
                        {results.map((result, index) => (
                            <div
                                key={result.id}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-gray-300 font-mono text-sm">#{index + 1}</span>
                                            <span className={`px-2 py-1 rounded-lg text-sm font-medium ${getSimilarityColor(result.similarity)}`}>
                                                {Math.round(result.similarity * 100)}% coincidencia
                                            </span>
                                        </div>
                                        <p className="text-gray-800 leading-relaxed">{result.summary}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <p className="text-gray-400 text-lg">
                            Escribe una idea o concepto para buscar
                        </p>
                        <p className="text-gray-400 mt-2 text-sm">
                            La búsqueda por esencia encuentra ideas relacionadas por significado, no solo por palabras exactas.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
