"use client";

import { useState, useRef, useEffect } from "react";
import { logger } from "@/lib/logger";

interface IdeaInputProps {
    onSubmit: (idea: string) => void;
    isLoading?: boolean;
}

export default function IdeaInput({ onSubmit, isLoading = false }: IdeaInputProps) {
    const [idea, setIdea] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const isPressingRef = useRef<boolean>(false);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (idea.trim()) {
            onSubmit(idea);
            setIdea("");
        }
    };

    const startRecording = async () => {
        try {
            isPressingRef.current = true;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // If user released the button while we were getting permissions/stream
            if (!isPressingRef.current) {
                logger.info("Recording cancelled before start");
                stream.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                return;
            }

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            recordingStartTimeRef.current = Date.now();

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const duration = Date.now() - recordingStartTimeRef.current;

                // Cleanup tracks when stopped
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                // Minimum duration check: 500ms
                if (duration < 500) {
                    logger.info("Recording too short, ignoring.");
                    return;
                }

                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                await handleTranscription(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            isPressingRef.current = false;
            logger.error("Error accessing microphone:", err);
            alert("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
        }
    };

    const stopRecording = () => {
        isPressingRef.current = false;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        } else if (streamRef.current) {
            // Fallback if recorder wasn't started yet
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
    };

    const cancelRecording = () => {
        isPressingRef.current = false;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.onstop = null; // Prevent transcription
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
        logger.info("Recording cancelled by user.");
    };

    const handleTranscription = async (blob: Blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append("file", blob, "recording.webm");

            const response = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Error en la transcripción");

            const data = await response.json();
            if (data.text && data.text.trim()) {
                onSubmit(data.text);
            }
        } catch (err) {
            logger.error("Transcription error:", err);
            alert("Hubo un error al procesar el audio.");
        } finally {
            setIsTranscribing(false);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isRecording) return;

        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
            const isInside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (!isInside) {
                cancelRecording();
            } else {
                stopRecording();
            }
        } else {
            stopRecording();
        }
    };

    // Global listener for pointer up if released outside
    useEffect(() => {
        if (isRecording) {
            const upHandler = () => stopRecording();
            window.addEventListener('pointerup', upHandler);
            return () => window.removeEventListener('pointerup', upHandler);
        }
    }, [isRecording]);

    const isPending = isLoading || isTranscribing;

    return (
        <form
            onSubmit={handleSubmit}
            className={`bg-card w-full max-w-2xl p-6 md:p-12 rounded-3xl shadow-sm border border-black/5 flex flex-col gap-4 relative transition-all duration-300 hover:shadow-md ${isRecording ? 'ring-2 ring-red-400 bg-red-50/10' : ''}`}
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
                        placeholder={isRecording ? "Grabando..." : "Idea..."}
                        className={`flex-1 text-2xl md:text-3xl bg-transparent border-none outline-none text-foreground placeholder:text-gray-300 font-medium ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
                        disabled={isPending || isRecording}
                        autoFocus
                    />

                    <button
                        ref={buttonRef}
                        type={idea.trim() ? "submit" : "button"}
                        onPointerDown={(e) => {
                            if (!idea.trim() && !isPending) {
                                e.preventDefault();
                                startRecording();
                            }
                        }}
                        onPointerUp={handlePointerUp}
                        // For accessibility and focus
                        onKeyDown={(e) => {
                            if (e.key === ' ' && !idea.trim()) startRecording();
                        }}
                        onKeyUp={(e) => {
                            if (e.key === ' ' && !idea.trim()) stopRecording();
                        }}
                        disabled={isPending}
                        className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${isRecording
                            ? "bg-red-500 scale-125 shadow-red-200 shadow-2xl"
                            : idea.trim()
                                ? "bg-gold text-white shadow-gold/20 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95"
                                : "bg-gold/50 text-white shadow-sm"
                            }`}
                        title={idea.trim() ? "Enviar" : "Mantener para grabar"}
                    >
                        {isPending ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isRecording ? (
                            <div className="relative">
                                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
                                </svg>
                            </div>
                        ) : idea.trim() ? (
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
                                className="text-white"
                            >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
                            </svg>
                        )}
                    </button>
                </div>
                <div className="h-px w-full bg-gray-100 mt-4" />
                {isRecording && (
                    <div className="text-xs text-red-400 mt-2 flex items-center gap-2 animate-in fade-in duration-300">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Grabando... Suelta para enviar. Mueve fuera para cancelar.
                    </div>
                )}
            </div>
        </form>
    );
}
