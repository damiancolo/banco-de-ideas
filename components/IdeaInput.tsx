"use client";

import { useState } from "react";

interface IdeaInputProps {
    onSubmit: (idea: string) => void;
    isLoading?: boolean;
}

export default function IdeaInput({ onSubmit, isLoading = false }: IdeaInputProps) {
    const [idea, setIdea] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (idea.trim()) {
            onSubmit(idea);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-card w-full max-w-2xl p-6 md:p-12 rounded-3xl shadow-sm border border-black/5 flex flex-col gap-4 relative transition-all duration-300 hover:shadow-md"
        >
            <div className="min-h-[200px] flex flex-col justify-end">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
                        title="Añadir contexto (opcional)"
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
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>

                    <input
                        type="text"
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="Idea..."
                        className="flex-1 text-2xl md:text-3xl bg-transparent border-none outline-none text-foreground placeholder:text-gray-300 font-medium"
                        disabled={isLoading}
                        autoFocus
                    />

                    <button
                        type="submit"
                        disabled={!idea.trim() || isLoading}
                        className={`w-14 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${idea.trim()
                                ? "bg-gold text-white shadow-gold/20 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95"
                                : "bg-gold/50 text-white/50 cursor-not-allowed"
                            }`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        )}
                    </button>
                </div>
                <div className="h-px w-full bg-gray-100 mt-4" />
            </div>
        </form>
    );
}
