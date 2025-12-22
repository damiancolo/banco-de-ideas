/**
 * Custom hook for managing chat state and logic
 * Extracted from app/page.tsx to reduce component complexity
 */

"use client";

import { useState, useRef, useEffect } from "react";
import type { Message, Idea } from "@/types";
import { analyzeIdea, saveIdeaAsync } from "@/services/ideaService";
import { detectIntent } from "@/lib/utils/intentDetector";
import { MESSAGES } from "@/lib/constants";
import { logger } from "@/lib/logger";

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentIdea, setCurrentIdea] = useState<string | null>(null);
    const [awaitingDecision, setAwaitingDecision] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const addMessage = (role: 'user' | 'assistant', content: React.ReactNode | string, plainText?: string) => {
        const message: Message = {
            id: Date.now() + Math.random(),
            role,
            content,
            plainText: plainText || (typeof content === 'string' ? content : '')
        };
        setMessages(prev => [...prev, message]);
        return message;
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || loading) return;

        if (!hasInteracted) setHasInteracted(true);

        const userText = inputValue.trim();
        setInputValue("");

        // Add user message
        addMessage('user', userText, userText);
        setLoading(true);

        try {
            if (!currentIdea) {
                // Step 1: User submitted a new idea
                setCurrentIdea(userText);

                // Save idea asynchronously (fire and forget)
                saveIdeaAsync(userText);

                // Ask what they want to do
                setTimeout(() => {
                    addMessage('assistant', MESSAGES.INITIAL_QUESTION, MESSAGES.INITIAL_QUESTION);
                    setLoading(false);
                    setAwaitingDecision(true);
                }, 800);

            } else if (awaitingDecision) {
                // Step 2: User responded to the question
                const action = detectIntent(userText);

                const response = await analyzeIdea({
                    action,
                    idea: action === 'chat' ? userText : currentIdea,
                    history: messages
                });

                const result = response.result;

                // Build response content
                let content: React.ReactNode;
                let plainTextForContext = "";

                if (action === "similar" && Array.isArray(result)) {
                    // Display similar ideas
                    content = (
                        <div className= "flex flex-col gap-4 mt-2" >
                        <p className="font-medium text-gray-800" > { MESSAGES.SIMILAR_INTRO } </p>
                    {
                        result.map((idea: Idea) => (
                            <div key= { idea.id } className = "bg-white p-5 rounded-xl border border-gray-100 shadow-sm" >
                            <div className="font-bold text-gray-800 mb-1" > { idea.title } </div>
                        < div className = "text-gray-600 text-sm leading-relaxed" > { idea.summary } </div>
                        </div>
                        ))
                    }
                    </div>
          );

    plainTextForContext = `${MESSAGES.SIMILAR_INTRO}\n` +
        result.map((idea: Idea, i: number) => `${i + 1}. ${idea.title}: ${idea.summary}`).join("\n");

    logger.debug("Bisociaciones recibidas:", result);

} else if (typeof result === 'string' && (result.includes("⚠️") || result.includes("Error"))) {
    // Backend error
    logger.error("Backend Error:", result);
    content = (
        <div className= "bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 mt-2" >
        <p><strong>Error del Sistema: </strong></p >
            <div dangerouslySetInnerHTML={ { __html: result.replace(/\*\*/g, '') } } />
                </div>
          );
    plainTextForContext = result;

} else {
    // Analysis or chat result
    content = (
        <div className= "prose prose-sm prose-stone max-w-none text-gray-700 leading-relaxed bg-white p-6 rounded-2xl shadow-sm border border-gray-100" >
        <div className="whitespace-pre-wrap" > { typeof result === 'string' ? result : JSON.stringify(result) } </div>
            </div>
          );
    plainTextForContext = typeof result === 'string' ? result : "Respuesta completada.";
}

addMessage('assistant', content, plainTextForContext);

if (action === "similar") {
    // Ask follow-up question
    setTimeout(() => {
        addMessage('assistant', MESSAGES.FOLLOW_UP, MESSAGES.FOLLOW_UP);
        setAwaitingDecision(true);
    }, 1500);
} else {
    setAwaitingDecision(true);
}

setLoading(false);
      }

    } catch (error) {
    logger.error("Error in handleSendMessage:", error);
    setLoading(false);
}
  };

return {
    messages,
    inputValue,
    setInputValue,
    loading,
    hasInteracted,
    messagesEndRef,
    handleSendMessage
};
}
