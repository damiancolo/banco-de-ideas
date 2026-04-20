"use client";

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

type SavedIdea = {
    id: string;
    text: string;
    createdAt: string;
    category?: 'user' | 'bisociation';
    highlightCount: number;
    comments: { text: string; createdAt: string }[];
};

interface IdeaModalProps {
    idea: SavedIdea;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (id: string) => void;
    onCommentAdded: (comment: { text: string, createdAt: string }) => void;
    apiPrefix?: string;
}

export default function IdeaModal({ idea, isOpen, onClose, onDelete, onCommentAdded, apiPrefix = '/api' }: IdeaModalProps) {
    const [copied, setCopied] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleHighlight = () => {
        onDelete(idea.id);
    };

    const handleCalendar = () => {
        const title = idea.text.slice(0, 80);
        const details = idea.text;
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!commentText.trim()) return;

        if (commentText.length > 1500) {
            alert("Resume por que es mucha letra");
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${apiPrefix}/ideas/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idea.id, text: commentText.trim() }),
            });

            if (response.ok) {
                const newComment = {
                    text: commentText.trim(),
                    createdAt: new Date().toISOString()
                };
                onCommentAdded(newComment);
                setCommentText('');
            } else {
                const data = await response.json();
                if (response.status === 400 && data.error && data.error.includes('1500')) {
                    alert("Resume por que es mucha letra");
                } else if (response.status === 429) {
                    alert(data.error || 'Estás comentando muy rápido');
                } else {
                    alert('No se pudo guardar el comentario');
                }
            }
        } catch (error) {
            logger.error('Error adding comment:', error);
            alert('Error al conectar con el servidor');
        } finally {
            setIsSubmitting(false);
        }
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${idea.category === 'bisociation'
                            ? 'bg-[#C5A47E]/10 text-[#C5A47E]'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {idea.category === 'bisociation' ? 'IA (Bisociación)' : 'Inteligencia Artesanal'}
                        </span>
                        <span className="text-sm text-gray-400">
                            {formatDate(idea.createdAt)}
                        </span>
                    </div>

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
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                        <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                            {idea.text}
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4 mb-6">
                            {idea.comments && idea.comments.length > 0 &&
                                idea.comments.map((comment, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-2xl animate-in slide-in-from-left-2 duration-300">
                                        <p className="text-gray-700 text-sm">{comment.text}</p>
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            {new Date(comment.createdAt).toLocaleString('es-ES', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                ))
                            }
                        </div>

                        <form onSubmit={handleAddComment} className="relative">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Feedback.."
                                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A47E]/30 focus:border-[#C5A47E] transition-all pr-12"
                                disabled={isSubmitting}
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim() || isSubmitting}
                                className="absolute right-2 top-2 bottom-2 w-10 bg-[#C5A47E] text-white rounded-xl flex items-center justify-center hover:bg-[#b08e68] transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={handleHighlight}
                        className="flex items-center justify-center w-10 h-10 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title={`Resaltar (${idea.highlightCount || 0})`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                    </button>

                    <div className="flex items-center gap-2">
                        {apiPrefix === '/api/privado' && (
                            <button
                                onClick={handleCalendar}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-[#4285F4] hover:bg-blue-50 transition-all"
                                title="Llevar a Google Calendar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </button>
                        )}

                    <button
                        onClick={handleCopy}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${copied
                            ? 'bg-green-100 text-green-600'
                            : 'bg-[#C5A47E] text-white hover:bg-[#b08e68]'
                            }`}
                        title={copied ? "Copiado" : "Copiar texto"}
                    >
                        {copied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        )}
                    </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
