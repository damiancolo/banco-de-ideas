"use client";

import { useState, useRef, useEffect } from "react";
import { logger } from "@/lib/logger";

interface UseVoiceRecordingProps {
    onTranscription: (text: string) => void;
    onTranscriptionError?: (error: unknown) => void;
}

export function useVoiceRecording({ onTranscription, onTranscriptionError }: UseVoiceRecordingProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);
    const isPressingRef = useRef<boolean>(false);

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
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                await handleTranscription(audioBlob);
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

    const handleTranscription = async (blob: Blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append("file", blob, "recording.webm");
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
