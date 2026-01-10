"use client";

import { useState, useEffect } from 'react';

type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category?: 'user' | 'bisociation';
    deletionAttempts: number;
};

interface IdeaModalProps {
    idea: SavedIdea;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (id: string) => void;
}

export default function IdeaModal({ idea, isOpen, onClose, onDelete }: IdeaModalProps) {
    const [copied, setCopied] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 150);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(idea.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            alert('No se pudo copiar al portapapeles');
        }
    };

    const handleDelete = () => {
        // No confirm needed for "soft-delete" logging
        onDelete(idea.id);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? 'animate-out fade-out duration-150' : 'animate-in fade-in duration-200'}`}
            onClick={handleClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden ${isClosing ? 'animate-out zoom-out-95 duration-150' : 'animate-in zoom-in-95 duration-200'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        {/* Category Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${idea.category === 'bisociation'
                            ? 'bg-[#C5A47E]/10 text-[#C5A47E]'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {idea.category === 'bisociation' ? 'IA (Bisociación)' : 'Propia'}
                        </span>
                        {/* Date */}
                        <span className="text-sm text-gray-400">
                            {formatDate(idea.createdAt)}
                        </span>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                        {idea.text}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50">
                    {/* Delete Button */}
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                        Eliminar
                    </button>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${copied
                            ? 'bg-green-100 text-green-600'
                            : 'bg-[#C5A47E] text-white hover:bg-[#b08e68]'
                            }`}
                    >
                        {copied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Copiado
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copiar texto
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
