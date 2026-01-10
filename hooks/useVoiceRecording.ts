"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

interface UseVoiceRecordingProps {
    onTranscription: (text: string) => void;
    onTranscriptionError?: (error: unknown) => void;
}

// Detect supported audio mimeType for MediaRecorder
function getSupportedMimeType(): { mimeType: string; extension: string } {
    const types = [
        { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
        { mimeType: 'audio/webm', extension: 'webm' },
        { mimeType: 'audio/mp4', extension: 'mp4' },
        { mimeType: 'audio/aac', extension: 'aac' },
        { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
        { mimeType: 'audio/wav', extension: 'wav' },
    ];

    for (const type of types) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type.mimeType)) {
            logger.info(`Using audio mimeType: ${type.mimeType}`);
            return type;
        }
    }

    // Fallback - let browser decide
    logger.warn("No supported mimeType found, using browser default");
    return { mimeType: '', extension: 'webm' };
}

export function useVoiceRecording({ onTranscription, onTranscriptionError }: UseVoiceRecordingProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);
    const isPressingRef = useRef<boolean>(false);
    const audioFormatRef = useRef<{ mimeType: string; extension: string } | null>(null);

    const startRecording = async () => {
        try {
            isPressingRef.current = true;

            // Detect supported format on first use
            if (!audioFormatRef.current) {
                audioFormatRef.current = getSupportedMimeType();
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // If user released the button while we were getting permissions/stream
            if (!isPressingRef.current) {
                logger.info("Recording cancelled before start");
                stream.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                return;
            }

            // Create MediaRecorder with supported mimeType
            const options: MediaRecorderOptions = {};
            if (audioFormatRef.current.mimeType) {
                options.mimeType = audioFormatRef.current.mimeType;
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            recordingStartTimeRef.current = Date.now();

            logger.info(`MediaRecorder created with mimeType: ${mediaRecorder.mimeType}`);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                setIsRecording(false);
                const duration = Date.now() - recordingStartTimeRef.current;

                // Cleanup tracks when stopped
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                if (duration < 500) {
                    logger.info("Recording too short");
                    return;
                }

                // Use the actual mimeType from the recorder
                const mimeType = mediaRecorder.mimeType || audioFormatRef.current?.mimeType || 'audio/webm';
                const extension = audioFormatRef.current?.extension || 'webm';
                const audioBlob = new Blob(chunksRef.current, { type: mimeType });
                logger.info(`Audio blob created: ${audioBlob.size} bytes, type: ${mimeType}`);
                await handleTranscription(audioBlob, extension);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            isPressingRef.current = false;
            setIsRecording(false);
            logger.error("Microphone error:", err);
            if (onTranscriptionError) {
                onTranscriptionError(err);
            } else {
                alert("No se pudo acceder al micrófono.");
            }
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
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = null;
            if (mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
    };

    const handleTranscription = async (blob: Blob, extension: string = 'webm') => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append("file", blob, `recording.${extension}`);
            const res = await fetch("/api/transcribe", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Transcription failed");
            const data = await res.json();
            if (data.text?.trim()) {
                onTranscription(data.text);
            }
        } catch (err) {
            logger.error("Transcription error:", err);
            if (onTranscriptionError) {
                onTranscriptionError(err);
            } else {
                alert("Error al transcribir voz.");
            }
        } finally {
            setIsTranscribing(false);
        }
    };

    const handlePointerUp = (e: React.PointerEvent, buttonRef: React.RefObject<HTMLButtonElement | null>) => {
        if (!isRecording) return;
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
            const isInside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;
            if (!isInside) cancelRecording();
            else stopRecording();
        } else stopRecording();
    };

    useEffect(() => {
        if (isRecording) {
            const handler = () => stopRecording();
            window.addEventListener("pointerup", handler);
            return () => window.removeEventListener("pointerup", handler);
        }
    }, [isRecording]);

    return {
        isRecording,
        isTranscribing,
        startRecording,
        stopRecording,
        cancelRecording,
        handlePointerUp,
    };
}
