"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import ChatMessage from "@/components/ChatMessage";
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

type SearchMode = 'essence' | 'keywords' | 'similar' | 'analysis' | null;

// ID generator to avoid race conditions
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

const THINKING_MESSAGES = [
  "Bisociando conceptos...",
  "Consultando el oráculo...",
  "Reordenando el universo...",
  "Invocando musas creativas...",
  "Conectando lo inconectable...",
  "Pensando en voz muy baja...",
  "Preguntándole a DeepSeek...",
  "Atravesando dominios de conocimiento...",
  "Calibrando el detector de ideas brillantes...",
  "Procesando... (no, en serio, procesando)",
  "Explorando el espacio latente...",
  "Tejiendo bisociaciones con hilo invisible...",
  "Claudiando...",
  "Geminiando...",
  "ChatGPTeando...",
  "DeepSeeKeando...",
  "Bardeando...",
  "Aplicando creatividad artificial...",
  "Buscando conexiones inesperadas...",
];

interface ChatEngineProps {
  apiPrefix?: string;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

export default function ChatEngine({
  apiPrefix = "/api",
  headerSlot,
  footerSlot,
}: ChatEngineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<string | null>(null);
  const [awaitingDecision, setAwaitingDecision] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [searchMode, setSearchMode] = useState<SearchMode>(null);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const menuEnterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (menuEnterTimeoutRef.current) clearTimeout(menuEnterTimeoutRef.current);
      if (menuLeaveTimeoutRef.current) clearTimeout(menuLeaveTimeoutRef.current);
    };
  }, []);

  // Rotar mensajes de "pensando" mientras loading
  useEffect(() => {
    if (!loading) return;
    setThinkingIndex(Math.floor(Math.random() * THINKING_MESSAGES.length));
    const interval = setInterval(() => {
      setThinkingIndex(i => (i + 1) % THINKING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

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
    logger.info("handleTTS called with text length:", text?.length);

    if (!text || text.trim().length === 0) {
      alert("No hay texto para leer.");
      return;
    }

    if (text.length > 4000) {
      alert(`El texto es demasiado largo para leer (${text.length} caracteres).`);
      return;
    }

    stopSpeaking();

    // CRITICAL: Create/resume AudioContext IMMEDIATELY in user gesture
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Resume if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // iOS 17/18 FIX: Keep audio session alive with silent oscillator during fetch
    const keepAliveOscillator = audioContext.createOscillator();
    const keepAliveGain = audioContext.createGain();
    keepAliveGain.gain.value = 0.001;
    keepAliveOscillator.connect(keepAliveGain);
    keepAliveGain.connect(audioContext.destination);
    keepAliveOscillator.start();

    let sourceNode: AudioBufferSourceNode | null = null;

    try {
      setIsSpeaking(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // TTS is always global (not prefixed)
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error API: ${res.status}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength === 0) throw new Error("Audio recibido vacío");

      keepAliveOscillator.stop();

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(audioContext.destination);

      sourceNode.onended = () => {
        setIsSpeaking(false);
      };

      sourceNode.start(0);

      audioRef.current = {
        pause: () => {
          try { sourceNode?.stop(); } catch { }
        },
      } as HTMLAudioElement;

    } catch (err) {
      try { keepAliveOscillator.stop(); } catch { }

      logger.error("TTS Error:", err);
      setIsSpeaking(false);
      let errorMsg = 'Error desconocido';
      if (err instanceof Error) {
        errorMsg = err.name === 'AbortError'
          ? 'La generación de audio tardó demasiado'
          : err.message;
      }
      alert(`Error al generar audio: ${errorMsg}`);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, forcedText?: string, viaVoice = false) => {
    e?.preventDefault();
    const textToProcess = forcedText || inputValue.trim();
    if (!textToProcess) return;

    if (textToProcess.length > 1500) {
      alert("Resume por que es mucha letra");
      return;
    }

    if (loading || isTranscribing) return;

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

    // MODE HANDLING: Process based on selected mode
    if (searchMode !== null) {
      try {
        if (searchMode === 'keywords') {
          const response = await fetch(`${apiPrefix}/search/keywords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userText }),
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Error en la búsqueda');
          }

          const results = data.result || [];
          const content = (
            <div className="flex flex-col gap-4 mt-2">
              <p className="font-medium text-gray-800">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}:
              </p>
              {results.length > 0 ? (
                results.map((result: any) => (
                  <div key={result.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="font-bold text-gray-800 mb-1">{result.title}</div>
                    <div className="text-gray-600 text-sm leading-relaxed">{result.summary}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No se encontraron ideas con esas palabras.</p>
              )}
            </div>
          );

          const reply: Message = {
            id: generateMessageId(),
            role: 'assistant',
            content: content,
            plainText: `Búsqueda por palabras: ${results.length} resultados`
          };
          setMessages(prev => [...prev, reply]);

        } else if (searchMode === 'essence') {
          const response = await fetch(`${apiPrefix}/search/semantic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userText }),
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Error en la búsqueda');
          }

          const results = data.result || [];
          const content = (
            <div className="flex flex-col gap-4 mt-2">
              <p className="font-medium text-gray-800">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}:
              </p>
              {results.length > 0 ? (
                results.map((result: any) => (
                  <div key={result.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-800">{result.title}</div>
                      {result.similarity && (
                        <span className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600">
                          {Math.round(result.similarity * 100)}% coincidencia
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 text-sm leading-relaxed">{result.summary}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No se encontraron ideas similares. Asegúrate de que se hayan generado embeddings.</p>
              )}
            </div>
          );

          const reply: Message = {
            id: generateMessageId(),
            role: 'assistant',
            content: content,
            plainText: `Búsqueda por esencia: ${results.length} resultados`
          };
          setMessages(prev => [...prev, reply]);

        } else if (searchMode === 'similar' || searchMode === 'analysis') {
          const action = searchMode;
          const response = await fetch(`${apiPrefix}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action,
              idea: userText,
              history: messages
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Error del servidor: ${response.status}`);
          }

          const result = data?.result;
          let content: React.ReactNode;
          let plainTextForContext = "";

          if (action === "similar" && Array.isArray(result)) {
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
            plainTextForContext = "Aquí tienes 3 ideas similares:\n" +
              result.map((idea: Idea, i: number) => `${i + 1}. ${idea.title}: ${idea.summary}`).join("\n");
          } else {
            plainTextForContext = typeof result === 'string' ? result : "Respuesta completada.";
            content = plainTextForContext;
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
        }

        setSearchMode(null);
        setLoading(false);
        return;

      } catch (error) {
        logger.error(`Error in ${searchMode} mode:`, error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        const errorReply: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
              <p><strong>Error:</strong> {errorMessage}</p>
            </div>
          ),
          plainText: `Error: ${errorMessage}`
        };
        setMessages(prev => [...prev, errorReply]);
        setSearchMode(null);
        setLoading(false);
        return;
      }
    }

    // Process Logic (DEFAULT FLOW)

    try {
      if (!currentIdea) {
        setCurrentIdea(userText);
        setVoiceEnabled(true);

        fetch(`${apiPrefix}/analyze`, {
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
        const lowerText = userText.toLowerCase().trim();
        let action = "";

        const analysisKeywords = ['profundiz', 'analizar', 'analíz', 'criti', 'críti', 'detalle', 'profundo'];
        const similarKeywords = ['similar', 'ideas', 'conectar', 'dame', 'generar', 'otra', 'más', 'mas'];
        const yesKeywords = ['si', 'sí', 'claro', 'dale', 'ok', 'va', 'venga'];

        if (analysisKeywords.some(k => lowerText.includes(k))) {
          action = "analysis";
        } else if (similarKeywords.some(k => lowerText.includes(k))) {
          action = "similar";
        } else if (yesKeywords.some(k => lowerText === k || lowerText.startsWith(k + " ") || lowerText.endsWith(" " + k) || lowerText.includes(" " + k + " "))) {
          action = "similar";
        } else {
          action = "chat";
        }

        if (action) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const response = await fetch(`${apiPrefix}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action,
              idea: action === 'chat' ? userText : (currentIdea || messages.findLast(m => m.role === 'user')?.plainText || messages.findLast(m => m.role === 'user')?.content || userText),
              history: messages
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          let data;
          try {
            data = await response.json();
          } catch {
            throw new Error("Error al procesar la respuesta del servidor");
          }

          if (!response.ok) {
            throw new Error(data?.error || `Error del servidor: ${response.status}`);
          }

          const result = data?.result;

          let content: React.ReactNode;
          let plainTextForContext = "";

          if (action === "similar" && Array.isArray(result)) {
            setVoiceEnabled(false);

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

            plainTextForContext = "Aquí tienes 3 ideas similares:\n" +
              result.map((idea: Idea, i: number) => `${i + 1}. ${idea.title}: ${idea.summary}`).join("\n");

          } else if (typeof result === 'string' && (result.includes("\u26A0\uFE0F") || result.includes("Error"))) {
            logger.error("Backend Error:", result);
            content = (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 mt-2">
                <p><strong>Error del Sistema:</strong></p>
                <div className="whitespace-pre-wrap">{result.replace(/\*\*/g, '')}</div>
              </div>
            );
            plainTextForContext = result;

          } else {
            plainTextForContext = typeof result === 'string' ? result : "Respuesta completada.";
            content = plainTextForContext;
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
            const followUpText = "¿Qué opinas? ¿Cuál te parece más interesante? ¿O prefieres profundizar en tu idea original?";
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: generateMessageId(),
                role: 'assistant',
                content: followUpText,
                plainText: followUpText
              }]);
              setAwaitingDecision(true);
            }, 1500);
          } else {
            setAwaitingDecision(true);
          }

        }
        setLoading(false);
      } else {
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
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        errorMessage = error.name === 'AbortError'
          ? "La solicitud tardó demasiado. Por favor, intenta de nuevo."
          : error.message;
      }
      const errorReply: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: (
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
            <p><strong>Error:</strong> {errorMessage}</p>
          </div>
        ),
        plainText: `Error: ${errorMessage}`
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handlePointerUpProxy = (e: React.PointerEvent) => {
    handlePointerUp(e, buttonRef);
  };

  const handleTouchEndProxy = (e: React.TouchEvent) => {
    // Fallback for iOS Safari where pointerup is unreliable on long press
    if (!isRecording) return;
    e.preventDefault();
    stopRecording();
  };

  return (
    <>
      {headerSlot}

      {/* Center Content */}
      <div className="w-full flex flex-col items-center justify-center flex-1 max-w-xl gap-8">

        {/* Message History */}
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
              <div className="pl-2 flex items-center gap-3">
                {isTranscribing ? (
                  <span className="text-sm text-gray-400 animate-pulse">Transcribiendo audio...</span>
                ) : isSpeaking ? (
                  <div className="flex items-center gap-2 text-[#C5A47E] font-medium text-sm">
                    <span className="flex gap-1 items-end h-3">
                      <span className="w-1 bg-current animate-[sound_0.5s_ease-in-out_infinite]"></span>
                      <span className="w-1 bg-current animate-[sound_0.8s_ease-in-out_infinite]"></span>
                      <span className="w-1 bg-current animate-[sound_0.6s_ease-in-out_infinite]"></span>
                    </span>
                    La IA está hablando...
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-white/80 px-4 py-3 rounded-2xl border border-black/5 shadow-sm">
                    <div className="flex gap-1 items-end h-4">
                      <span className="w-1.5 h-1.5 bg-[#C5A47E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[#C5A47E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[#C5A47E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-base text-gray-500 animate-pulse">{THINKING_MESSAGES[thinkingIndex]}</span>
                  </div>
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
            {/* Mode Selector Button */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (menuLeaveTimeoutRef.current) {
                  clearTimeout(menuLeaveTimeoutRef.current);
                  menuLeaveTimeoutRef.current = null;
                }
                menuEnterTimeoutRef.current = setTimeout(() => {
                  setShowModeMenu(true);
                }, 300);
              }}
              onMouseLeave={() => {
                if (menuEnterTimeoutRef.current) {
                  clearTimeout(menuEnterTimeoutRef.current);
                  menuEnterTimeoutRef.current = null;
                }
                menuLeaveTimeoutRef.current = setTimeout(() => {
                  setShowModeMenu(false);
                }, 200);
              }}
            >
              <button
                type="button"
                onClick={() => setShowModeMenu(!showModeMenu)}
                className={`w-10 h-10 md:w-12 md:h-12 flex-none rounded-xl border border-gray-100 bg-white hover:bg-gray-50 flex items-center justify-center transition-all relative ${searchMode === null ? 'text-gray-400' : 'text-2xl'}`}
                title="Selecciona el modo"
              >
                {searchMode === null ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                ) : (
                  <>
                    {searchMode === 'essence' && '🧴'}
                    {searchMode === 'keywords' && '🔍'}
                    {searchMode === 'similar' && '✨'}
                    {searchMode === 'analysis' && '🧠'}
                  </>
                )}
              </button>

              {/* Dropdown Menu */}
              {showModeMenu && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 min-w-[240px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { setSearchMode('essence'); setShowModeMenu(false); }}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${searchMode === 'essence' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                  >
                    <span className="text-xl">🧴</span>
                    <span className="font-medium">Búsqueda por esencia</span>
                  </button>
                  <button
                    onClick={() => { setSearchMode('keywords'); setShowModeMenu(false); }}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${searchMode === 'keywords' ? 'bg-green-50 text-green-700' : 'text-gray-700'}`}
                  >
                    <span className="text-xl">🔍</span>
                    <span className="font-medium">Búsqueda por palabras</span>
                  </button>
                  <button
                    onClick={() => { setSearchMode('similar'); setShowModeMenu(false); }}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${searchMode === 'similar' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
                  >
                    <span className="text-xl">✨</span>
                    <span className="font-medium">Ideas similares</span>
                  </button>
                  <button
                    onClick={() => { setSearchMode('analysis'); setShowModeMenu(false); }}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${searchMode === 'analysis' ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                  >
                    <span className="text-xl">🧠</span>
                    <span className="font-medium">Espíritu crítico</span>
                  </button>
                </div>
              )}
            </div>

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
              onTouchEnd={handleTouchEndProxy}
              disabled={loading || isTranscribing}
              style={{ touchAction: 'none', userSelect: 'none' }}
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

      {footerSlot}
    </>
  );
}
