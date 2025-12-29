"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "@/components/ChatMessage";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

type Message = {
  id: string | number;
  role: 'user' | 'assistant';
  content: React.ReactNode | string;
  plainText?: string;
};

type Idea = {
  id: string | number;
  title: string;
  summary: string;
};

// ID generator to avoid race conditions
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<string | null>(null);
  const [awaitingDecision, setAwaitingDecision] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isRecording,
    isTranscribing,
    startRecording,
    handlePointerUp
  } = useVoiceRecording({
    onTranscription: (text) => handleSendMessage(undefined, text, true),
    onTranscriptionError: (err) => {
      logger.error("Voice Error:", err);
      alert("Error con el audio o la transcripción.");
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isTranscribing]);

  const resetConversation = () => {
    stopSpeaking();
    setCurrentIdea(null);
    setAwaitingDecision(false);
    setVoiceEnabled(true);
    setInputValue("");
    setHasInteracted(false);
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleTTS = async (text: string) => {
    logger.info("handleTTS called with text:", text?.substring(0, 100));

    // Validation: check text exists
    if (!text || text.trim().length === 0) {
      logger.error("TTS Error: No text provided");
      alert("No hay texto para leer.");
      return;
    }

    // Validation: check text length
    if (text.length > 4000) {
      logger.warn("TTS Error: Text too long", text.length);
      alert(`El texto es demasiado largo para leer en voz alta (${text.length} caracteres, máximo 4000).`);
      return;
    }

    // Prevent audio overlap: stop any previous audio
    stopSpeaking();

    try {
      setIsSpeaking(true);
      logger.info("Fetching TTS audio...");

      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        logger.error("TTS API error:", res.status, errorText);
        throw new Error(`TTS failed: ${res.status}`);
      }

      const blob = await res.blob();
      logger.info("TTS audio received, size:", blob.size);

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        audioRef.current = null;
        logger.info("TTS playback ended");
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        audioRef.current = null;
        logger.error("TTS playback error:", e);
        alert("Error al reproducir el audio.");
      };

      await audio.play();
      logger.info("TTS playback started");
    } catch (err) {
      logger.error("TTS Error:", err);
      setIsSpeaking(false);
      alert("Error al generar el audio. Por favor, intenta de nuevo.");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, forcedText?: string, viaVoice = false) => {
    e?.preventDefault();
    const textToProcess = forcedText || inputValue.trim();
    if (!textToProcess || loading || isTranscribing) return;

    if (!hasInteracted) setHasInteracted(true);

    const userText = textToProcess;
    if (!forcedText) setInputValue("");

    // Add User Message
    const userMsg: Message = {
      id: generateMessageId(),
      role: 'user',
      content: userText,
      plainText: userText
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Process Logic
    try {
      if (!currentIdea) {
        // Step 1: User submitted an idea
        setCurrentIdea(userText);
        setVoiceEnabled(true); // Siempre habilitar voz para la primera fase de una nueva idea

        // Intentar persistencia en servidor (MongoDB)
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", idea: userText }),
        }).then(res => {
          if (!res.ok) {
            logger.warn("No se pudo guardar en MongoDB.");
          } else {
            logger.info("Idea guardada exitosamente en MongoDB");
          }
        }).catch(err => {
          logger.error("Error de red al guardar:", err);
        });

        const replyText = `¿Quieres escuchar 3 ideas similares o profundizar en esta idea?`;
        const reply: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: replyText,
          plainText: replyText
        };
        setMessages(prev => [...prev, reply]);
        setLoading(false);
        setAwaitingDecision(true);

        if (viaVoice) {
          handleTTS(replyText);
        }
      } else if (awaitingDecision) {
        // Simple Intent Detection (Client-side)
        const lowerText = userText.toLowerCase().trim();
        let action = "";

        // Verificamos primero "analysis" para darle prioridad
        const analysisKeywords = ['profundiz', 'analizar', 'analíz', 'criti', 'críti', 'detalle', 'profundo'];
        const similarKeywords = ['similar', 'ideas', 'conectar', 'dame', 'generar', 'otra', 'más', 'mas'];
        const yesKeywords = ['si', 'sí', 'claro', 'dale', 'ok', 'va', 'venga'];

        if (analysisKeywords.some(k => lowerText.includes(k))) {
          action = "analysis";
        } else if (similarKeywords.some(k => lowerText.includes(k))) {
          action = "similar";
        } else if (yesKeywords.some(k => lowerText === k || lowerText.startsWith(k + " ") || lowerText.endsWith(" " + k) || lowerText.includes(" " + k + " "))) {
          // Solo si es un "si" como palabra aislada
          action = "similar";
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
              idea: action === 'chat' ? userText : (currentIdea || messages.findLast(m => m.role === 'user')?.plainText || messages.findLast(m => m.role === 'user')?.content || userText),
              history: messages
            }),
          });
          const data = await response.json();
          const result = data.result;

          let content: React.ReactNode;
          let plainTextForContext = "";

          if (action === "similar" && Array.isArray(result)) {
            // BLOQUEO DE VOZ: Una vez que se proponen similares, se acaba la voz
            setVoiceEnabled(false);

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

            // Construir representación textual para la memoria
            plainTextForContext = "Aquí tienes 3 ideas similares:\n" +
              result.map((idea: Idea, i: number) => `${i + 1}. ${idea.title}: ${idea.summary}`).join("\n");

          } else if (typeof result === 'string' && (result.includes("⚠️") || result.includes("Error"))) {
            // Error de Configuración del Backend (ej. Falta API Key)
            logger.error("Backend Error:", result);
            content = (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 mt-2">
                <p><strong>Error del Sistema:</strong></p>
                <div dangerouslySetInnerHTML={{ __html: result.replace(/\*\*/g, '') }} />
              </div>
            );
            plainTextForContext = result;

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
            id: generateMessageId(),
            role: 'assistant',
            content: content,
            plainText: plainTextForContext
          };

          setMessages(prev => [...prev, reply]);

          if (viaVoice && plainTextForContext) {
            handleTTS(plainTextForContext);
          }

          if (action === "similar") {
            // Nuevo flujo: Preguntar sobre las similares o la original
            const followUpText = "¿Qué opinas? ¿Cuál te parece más interesante? ¿O prefieres profundizar en tu idea original?";
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: generateMessageId(),
                role: 'assistant',
                content: followUpText,
                plainText: followUpText
              }]);
              setAwaitingDecision(true);
              // No reproducimos audio para los follow-ups automáticos para no saturar
            }, 1500);
          } else {
            setAwaitingDecision(true);
          }

        }
        setLoading(false);
      } else {
        // Restarting loop (Default behavior when typing something out of order)
        setCurrentIdea(userText);
        setVoiceEnabled(true);
        const replyText = `¿Quieres escuchar 3 ideas similares o profundizar en esta idea?`;
        setTimeout(() => {
          const reply: Message = {
            id: generateMessageId(),
            role: 'assistant',
            content: replyText,
            plainText: replyText
          };
          setMessages(prev => [...prev, reply]);
          setLoading(false);
          setAwaitingDecision(true);

          if (viaVoice) {
            handleTTS(replyText);
          }
        }, 800);
      }

    } catch (error) {
      logger.error("Error in handleSendMessage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePointerUpProxy = (e: React.PointerEvent) => {
    handlePointerUp(e, buttonRef);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 relative overflow-hidden transition-all duration-700 bg-background">
      {/* Semantic Content for SEO & Screen Readers */}
      <div className="sr-only">
        <h1>Banco de Ideas - Potenciando la Creatividad con IA</h1>
        <p>
          Herramienta inteligente para capturar ideas, generar bisociaciones (conexiones creativas)
          y recibir análisis de viabilidad en tiempo real. Tu co-piloto para la innovación.
        </p>
      </div>

      {/* Top Link: Lightbulb Button */}
      <Link
        href="/about"
        className="fixed top-10 left-1/2 -translate-x-1/2 z-[99999] p-4 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full cursor-pointer shadow-sm transition-all duration-300"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-600 hover:text-[#C5A47E] transition-colors">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18h6"></path>
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 22h4"></path>
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"></path>
        </svg>
      </Link>

      {/* Center Content */}
      <div className="w-full flex flex-col items-center justify-center flex-1 max-w-xl gap-8">

        {/* Message History (appears above) */}
        {hasInteracted && (
          <div className="w-full flex-1 overflow-y-auto max-h-[40vh] space-y-4 px-2 scroll-smooth mask-fade-top mb-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                plainText={msg.plainText}
                onSpeak={msg.role === 'assistant' ? handleTTS : undefined}
              />
            ))}
            {(loading || isTranscribing || isSpeaking) && (
              <div className="pl-4 text-sm text-gray-400 flex items-center gap-3">
                {isTranscribing ? (
                  <span className="animate-pulse">Transcribiendo audio...</span>
                ) : isSpeaking ? (
                  <div className="flex items-center gap-2 text-[#C5A47E] font-medium">
                    <span className="flex gap-1 items-end h-3">
                      <span className="w-1 bg-current animate-[sound_0.5s_ease-in-out_infinite]"></span>
                      <span className="w-1 bg-current animate-[sound_0.8s_ease-in-out_infinite]"></span>
                      <span className="w-1 bg-current animate-[sound_0.6s_ease-in-out_infinite]"></span>
                    </span>
                    La IA está hablando...
                  </div>
                ) : (
                  <span className="animate-pulse">Escribiendo...</span>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* The Big Card */}
        <form
          onSubmit={handleSendMessage}
          className={`bg-white w-full rounded-3xl shadow-sm border border-black/5 p-4 md:p-8 flex flex-col justify-end transition-all duration-500 relative
              ${hasInteracted ? 'h-[160px]' : 'h-[320px] shadow-xl'}
              ${isRecording ? 'ring-2 ring-red-400 translate-y-[-4px]' : ''}
            `}
        >
          <div className="flex items-center gap-2 md:gap-4 w-full">
            {/* Plus Button */}
            <button
              type="button"
              onClick={resetConversation}
              className="w-10 h-10 md:w-12 md:h-12 flex-none rounded-xl border border-gray-100 bg-white hover:bg-gray-50 text-gray-400 flex items-center justify-center transition-colors"
              title="Nueva idea"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>

            {/* Input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isRecording ? "Grabando..." : (inputValue.trim() || !voiceEnabled) ? "Escribe aquí..." : "idea..."}
              className={`flex-1 text-2xl bg-transparent border-none outline-none text-foreground placeholder:text-gray-300 font-medium h-12 min-w-0 ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
              disabled={loading || isTranscribing}
              autoFocus={!hasInteracted}
            />

            {/* Send / Mic Button */}
            <button
              ref={buttonRef}
              type={(inputValue.trim() || !voiceEnabled) ? "submit" : "button"}
              onPointerDown={(e) => {
                if (voiceEnabled && !inputValue.trim() && !loading && !isTranscribing) {
                  e.preventDefault();
                  startRecording();
                }
              }}
              onPointerUp={handlePointerUpProxy}
              disabled={loading || isTranscribing}
              className={`w-14 h-10 md:w-16 md:h-11 flex-none flex items-center justify-center rounded-xl transition-all duration-200 ${(inputValue.trim() || !voiceEnabled)
                ? "bg-[#C5A47E] text-white hover:bg-[#b08e68]"
                : isRecording
                  ? "bg-red-500 text-white scale-110 shadow-lg"
                  : "bg-gray-100 text-gray-300"
                }`}
              title={(inputValue.trim() || !voiceEnabled) ? "Enviar" : "Mantener para grabar"}
            >
              {(loading || isTranscribing) ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isSpeaking ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); stopSpeaking(); }}
                  className="w-full h-full flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                  title="Detener audio"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
                </button>
              ) : isRecording ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                </div>
              ) : (inputValue.trim() || !voiceEnabled) ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
              )}
            </button>
          </div>
          {/* Divider Line */}
          <div className="w-full h-px bg-gray-100 mt-6 mb-2"></div>
          {isRecording && (
            <div className="text-[10px] text-red-500 absolute bottom-2 left-8 animate-pulse font-bold tracking-wider">
              SOLTAR PARA ENVIAR • MOVER FUERA PARA CANCELAR
            </div>
          )}
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
