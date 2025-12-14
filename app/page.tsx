"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "@/components/ChatMessage";
import Link from "next/link";

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: React.ReactNode | string;
  plainText?: string; // Para memoria del contexto
};

type Idea = {
  id: number;
  title: string;
  summary: string;
};

const INITIAL_MESSAGE: Message = {
  id: 0,
  role: 'assistant',
  content: "" // Empty initial message to keep the clean look
};

export default function Home() {
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || loading) return;

    if (!hasInteracted) setHasInteracted(true);

    const userText = inputValue.trim();
    setInputValue("");

    // Add User Message
    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: userText,
      plainText: userText // Guardamos el texto plano del usuario
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Process Logic
    try {
      if (!currentIdea) {
        // Step 1: User submitted an idea
        setCurrentIdea(userText);

        // 🔥 GUARDAR IDEA EN LOCALSTORAGE (Persistencia Real Client-Side)
        const newIdea = { id: Date.now(), text: userText, category: 'user', date: new Date().toISOString() };
        const savedIdeas = JSON.parse(localStorage.getItem("ideas_bank_v1") || "[]");
        savedIdeas.push(newIdea);
        localStorage.setItem("ideas_bank_v1", JSON.stringify(savedIdeas));

        // Intentar también persistencia en servidor (aunque sea efímera en Vercel)
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", idea: userText }),
        }).catch(err => console.error("Error guardando idea:", err));

        setTimeout(() => {
          const reply: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: `¿Quieres escuchar 3 ideas similares o profundizar en esta idea?`,
            plainText: `¿Quieres escuchar 3 ideas similares o profundizar en esta idea?` // Guardamos el texto plano
          };
          setMessages(prev => [...prev, reply]);
          setLoading(false);
          setAwaitingDecision(true);
        }, 800);
      } else if (awaitingDecision) {
        // Simple Intent Detection (Client-side)
        const lowerText = userText.toLowerCase();
        let action = "";

        if (lowerText.includes("similar") || lowerText.includes("ideas") || lowerText.includes("conectar") || lowerText.includes("dame") || lowerText.includes("generar")) {
          action = "similar";
        } else if (lowerText.includes("profundiz") || lowerText.includes("analiz") || lowerText.includes("criti")) {
          action = "analysis";
        } else {
          // Fallback: Si no detectamos keywords claras, asumimos que es una continuación de la conversación (Chat Mode)
          action = "chat";
        }

        if (action) {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action,
              idea: action === 'chat' ? userText : currentIdea, // En chat enviamos lo que escribió ahora. En otros, la idea original.
              history: messages
            }),
          });
          const data = await response.json();
          const result = data.result;

          let content: React.ReactNode;
          let plainTextForContext = "";

          if (action === "similar" && Array.isArray(result)) {
            // Construir representación visual
            content = (
              <div className="flex flex-col gap-4 mt-2">
                <p className="font-medium text-gray-800">Aquí tienes 3 ideas similares:</p>
                {result.map((idea: Idea) => (
                  <div key={idea.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="font-bold text-gray-800 mb-1">{idea.title}</div>
                    <div className="text-gray-600 text-sm leading-relaxed">{idea.summary}</div>
                  </div>
                ))}
              </div>
            );

            // 🔥 DEBUG LOGS
            console.log("Action:", action);
            console.log("Result received:", result);
            console.log("Is Array?", Array.isArray(result));

            // Construir representación textual para la memoria
            plainTextForContext = "Aquí tienes 3 ideas similares:\n" +
              result.map((idea: Idea, i: number) => `${i + 1}. ${idea.title}: ${idea.summary}`).join("\n");

            // 🔥 GUARDAR BISOCIACIONES AUTOMÁTICAMENTE EN LOCALSTORAGE
            try {
              if (Array.isArray(result)) {
                const savedIdeas = JSON.parse(localStorage.getItem("ideas_bank_v1") || "[]");
                result.forEach((idea: Idea, i: number) => {
                  const newBisociation = {
                    id: Date.now() + i + 100, // Offset ID to avoid collision
                    text: `${idea.title}: ${idea.summary}`,
                    category: 'bisociation',
                    date: new Date().toISOString()
                  };
                  savedIdeas.push(newBisociation);
                });
                localStorage.setItem("ideas_bank_v1", JSON.stringify(savedIdeas));
                console.log("✅ Bisociaciones guardadas EXTERNAMENTE en LocalStorage:", savedIdeas);
              } else {
                console.warn("⚠️ Resultado no es array, no se guarda.");
              }
            } catch (err) {
              console.error("❌ Error guardando bisociaciones:", err);
            }

          } else {
            // Analysis AND Chat result (Both are text based)
            content = (
              <div className="prose prose-sm prose-stone max-w-none text-gray-700 leading-relaxed bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="whitespace-pre-wrap">{typeof result === 'string' ? result : JSON.stringify(result)}</div>
              </div>
            );
            plainTextForContext = typeof result === 'string' ? result : "Respuesta completada.";
          }

          const reply: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: content,
            plainText: plainTextForContext // Guardamos el texto plano
          };

          setMessages(prev => [...prev, reply]);

          if (action === "similar") {
            // Nuevo flujo: Preguntar sobre las similares o la original
            const followUpText = "¿Qué opinas? ¿Cuál te parece más interesante? ¿O prefieres profundizar en tu idea original?";
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: Date.now() + 2,
                role: 'assistant',
                content: followUpText,
                plainText: followUpText
              }]);
              // Mantenemos currentIdea y awaitingDecision (o un flag similar) para procesar la siguiente respuesta
              // Reusemos awaitingDecision pero sabiendo que el contexto ha cambiado ligeramente.
              // Lo más simple es dejar awaitingDecision = true. 
              // Si el usuario dice "profundizar en la mía", el detector de keywords de "analysis" lo captará.
              setAwaitingDecision(true);
            }, 1500);
          } else {
            // Si es Chat o Analysis, nos quedamos en el estado conversacional
            // No reseteamos currentIdea para permitir que siga el hilo sobre "la idea actual"
            setAwaitingDecision(true);
          }

        }
        setLoading(false);
      } else {
        // Restarting loop
        setCurrentIdea(userText);
        setTimeout(() => {
          const reply: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: `¿Quieres escuchar 3 ideas similares o profundizar en esta idea?`
          };
          setMessages(prev => [...prev, reply]);
          setLoading(false);
          setAwaitingDecision(true);
        }, 800);
      }

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };


  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 relative overflow-hidden transition-all duration-700 bg-background">

      {/* Top Link: Lightbulb Button */}
      <a
        href="https://estudioprompt.com/banco-de-ideas/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          // Force navigation if default fails for some reason
          // e.preventDefault(); // Don't prevent default unless we are 100% sure href is broken, but let's leave default behavior and just add log or backup
          console.log("Lightbulb clicked");
        }}
        className="fixed top-10 left-1/2 -translate-x-1/2 z-[99999] p-4 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full cursor-pointer shadow-sm transition-all duration-300"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-600 hover:text-[#C5A47E] transition-colors">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18h6"></path>
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 22h4"></path>
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"></path>
        </svg>
      </a>

      {/* Center Content */}
      <div className="w-full flex flex-col items-center justify-center flex-1 max-w-xl gap-8">

        {/* Message History (appears above) */}
        {hasInteracted && (
          <div className="w-full flex-1 overflow-y-auto max-h-[40vh] space-y-4 px-2 scroll-smooth mask-fade-top mb-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}
            {loading && (
              <div className="pl-4 text-sm text-gray-400 animate-pulse">Escribiendo...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* The Big Card */}
        <form
          onSubmit={handleSendMessage}
          className={`bg-white w-full rounded-3xl shadow-sm border border-black/5 p-4 md:p-8 flex flex-col justify-end transition-all duration-500
              ${hasInteracted ? 'h-[160px]' : 'h-[320px] shadow-xl'}
            `}
        >
          <div className="flex items-center gap-2 md:gap-4 w-full">
            {/* Plus Button */}
            <button
              type="button"
              className="w-10 h-10 md:w-12 md:h-12 flex-none rounded-xl border border-gray-100 bg-white hover:bg-gray-50 text-gray-400 flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>

            {/* Input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Idea..."
              className="flex-1 text-2xl bg-transparent border-none outline-none text-foreground placeholder:text-gray-300 font-medium h-12 min-w-0"
              disabled={loading}
              autoFocus={!hasInteracted}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className={`w-14 h-10 md:w-16 md:h-11 flex-none flex items-center justify-center rounded-xl transition-all duration-200 ${inputValue.trim()
                ? "bg-[#C5A47E] text-white hover:bg-[#b08e68]"
                : "bg-gray-100 text-gray-300"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
            </button>
          </div>
          {/* Divider Line */}
          <div className="w-full h-px bg-gray-100 mt-6 mb-2"></div>
        </form>

      </div>

      {/* Bottom Icon: Folder */}
      <div className="pb-8 opacity-80 text-gray-700 hover:text-[#C5A47E] transition-colors cursor-pointer">
        <Link href="/banco">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#333] hover:text-[#C5A47E]">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path>
          </svg>
        </Link>
      </div>

    </main>
  );
}
