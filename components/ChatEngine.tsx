"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import ChatMessage from "@/components/ChatMessage";
import { logger } from "@/lib/logger";
import { playSaved, unlockAudio } from "@/lib/sounds/lightbulb";

type Message = {
  id: string | number;
  role: 'user' | 'assistant';
  content: React.ReactNode | string;
  plainText?: string;
  colectivizable?: boolean;
  /**
   * La idea DEL USUARIO que este mensaje publica al pulsar «Colectivizar».
   *
   * Nunca es el texto de la IA. Si falta, el botón no se muestra: antes caía por
   * defecto en el `plainText` del mensaje, así que colectivizar una respuesta del
   * asistente publicaba la prosa de la IA en el banco público en vez de la idea.
   */
  colectivizableText?: string;
  /** Lo que se manda a Google Calendar; si falta, el texto del propio mensaje. */
  calendarText?: string;
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
  userName?: string;
  /** Opciones extra que se agregan al fondo del menú "+" (ej. importar del Task) */
  extraMenuOptions?: Array<{ emoji: string; label: string; onClick: () => void }>;
  /** Se llama cuando una idea entró de verdad en la base. La home enciende la lamparita. */
  onIdeaSaved?: () => void;
}

export default function ChatEngine({
  apiPrefix = "/api",
  headerSlot,
  footerSlot,
  userName,
  extraMenuOptions,
  onIdeaSaved,
}: ChatEngineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<string | null>(null);
  // Los tres botones que reemplazan a la vieja pregunta "¿similares o profundizar?"
  const [mostrarAcciones, setMostrarAcciones] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [errorGuardado, setErrorGuardado] = useState(false);

  const [searchMode, setSearchMode] = useState<SearchMode>(null);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const menuEnterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Se scrollea el contenedor directamente y no con scrollIntoView sobre un
  // centinela: el <main> de la home es overflow-hidden, así que scrollIntoView
  // se confundía de ancestro y dejaba la conversación a medio bajar. Cuando
  // debajo hay botones, eso los deja fuera de la vista y sin forma de llegar.
  const scrollToBottom = () => {
    const el = messagesRef.current;
    if (!el) return;
    // Tras el paint: si no, scrollHeight todavía no incluye lo recién agregado.
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (menuEnterTimeoutRef.current) clearTimeout(menuEnterTimeoutRef.current);
      if (menuLeaveTimeoutRef.current) clearTimeout(menuLeaveTimeoutRef.current);
    };
  }, []);

  // Reset textarea height when input is cleared (after send)
  useEffect(() => {
    if (!inputValue && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputValue]);

  // Rotar mensajes de "pensando" mientras loading
  useEffect(() => {
    if (!loading) return;
    setThinkingIndex(Math.floor(Math.random() * THINKING_MESSAGES.length));
    const interval = setInterval(() => {
      setThinkingIndex(i => (i + 1) % THINKING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  /**
   * Crea o reanuda el AudioContext. Hay que llamarlo DENTRO del gesto del
   * usuario (el envío del formulario), aunque el sonido suene después: iOS sólo
   * habilita el audio si el contexto nació de un gesto. Devuelve el contexto
   * para que quien lo necesite lo use ya listo.
   */
  const asegurarContextoAudio = (): AudioContext | null => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        void audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch {
      return null;
    }
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

  /**
   * Llama a la IA con una de las tres acciones y agrega la respuesta.
   *
   * Antes esto vivía dentro de handleSendMessage y la acción se adivinaba
   * buscando palabras sueltas en lo que el usuario escribía ('criti', 'dame',
   * 'dale'...). Con los botones la intención llega explícita, así que la
   * adivinanza desapareció: escribir libre siempre es conversación.
   */
  const ejecutarAccion = async (
    action: 'similar' | 'analysis' | 'chat',
    textoUsuario?: string,
  ) => {
    setMostrarAcciones(false);
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      // La idea sobre la que va todo esto. Se calcula una vez: se manda a la API y
      // se guarda en el mensaje, para que «Colectivizar» sepa qué publicar.
      const ideaDelUsuario =
        currentIdea || messages.findLast(m => m.role === 'user')?.plainText || textoUsuario || '';

      const response = await fetch(`${apiPrefix}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          idea: action === 'chat' ? (textoUsuario ?? '') : ideaDelUsuario,
          history: messages,
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

      if (action === "similar" && Array.isArray(result) && result.length === 0) {
        // Defensa en profundidad: aunque el servidor vuelva a devolver una lista
        // vacía con 200 algún día, nunca más un título huérfano sin nada debajo.
        throw new Error("La IA no devolvió ninguna idea. Probá de nuevo.");
      }

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

      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content,
        plainText: plainTextForContext,
        colectivizable: action !== 'similar',
        // Colectivizar publica la idea, no la respuesta.
        colectivizableText: ideaDelUsuario,
      }]);

      // Los botones vuelven: siempre se puede pedir lo otro, o seguir escribiendo.
      setMostrarAcciones(true);

    } catch (error) {
      logger.error(`Error en la acción ${action}:`, error);
      const errorMessage = error instanceof Error
        ? (error.name === 'AbortError'
            ? "La solicitud tardó demasiado. Por favor, intenta de nuevo."
            : error.message)
        : "Error desconocido";

      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: (
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
            <p><strong>Error:</strong> {errorMessage}</p>
          </div>
        ),
        plainText: `Error: ${errorMessage}`,
      }]);
      setMostrarAcciones(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, forcedText?: string) => {
    e?.preventDefault();
    const textToProcess = forcedText || inputValue.trim();
    if (!textToProcess) return;

    if (textToProcess.length > 1500) {
      alert("Resume por que es mucha letra");
      return;
    }

    if (loading) return;

    // Dentro del gesto: el sonido del guardado llega ~300 ms después, con la
    // respuesta del servidor, y para entonces ya sería tarde para abrirlo.
    // unlockAudio() además habilita el audio para el hover de la lamparita: pasar
    // el mouse no cuenta como gesto de usuario para el navegador.
    asegurarContextoAudio();
    unlockAudio();
    setErrorGuardado(false);

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
            plainText: plainTextForContext,
            colectivizable: action !== 'similar',
            // `currentIdea` puede no haberse propagado aún en este mismo manejador.
            colectivizableText: currentIdea || userText,
          };
          setMessages(prev => [...prev, reply]);

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

    // Flujo por defecto: la primera idea se guarda; lo que se escriba después
    // es conversación. Las acciones concretas (ideas similares, crítica) ya no
    // se adivinan del texto: son los botones de abajo.
    if (!currentIdea) {
      setCurrentIdea(userText);

      fetch(`${apiPrefix}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", idea: userText }),
      }).then(res => {
        if (res.ok) {
          logger.info("Idea guardada exitosamente en MongoDB");
          // La idea está en la base: recién ahora se celebra.
          playSaved();
          onIdeaSaved?.();
        } else {
          logger.warn("No se pudo guardar en MongoDB.");
          setErrorGuardado(true);
        }
      }).catch(err => {
        logger.error("Error de red al guardar:", err);
        setErrorGuardado(true);
      });

      // Un bubble mínimo, no una pregunta: las opciones ahora son botones. Se
      // mantiene porque de él cuelgan Colectivizar y Calendizar.
      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: "Guardada.",
        plainText: "Guardada.",
        colectivizable: true,
        colectivizableText: userText,
        calendarText: userText,
      }]);
      setLoading(false);
      setMostrarAcciones(true);
      return;
    }

    await ejecutarAccion("chat", userText);
  };

  const handleColectivizar = async (text: string, mode: 'anon' | 'user') => {
    const publicText = mode === 'user' && userName ? `[${userName}]: ${text}` : text;
    await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: publicText }),
    });
  };

  const handleCalendizar = (text: string) => {
    const title = text.slice(0, 80);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {headerSlot}

      {/* Center Content */}
      <div className="w-full flex flex-col items-center justify-center flex-1 max-w-xl gap-8">

        {/* Message History */}
        {hasInteracted && (
          <div ref={messagesRef} className="w-full flex-1 overflow-y-auto max-h-[40vh] space-y-4 px-2 scroll-smooth mask-fade-top mb-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                plainText={msg.plainText}
                onSpeak={msg.role === 'assistant' ? handleTTS : undefined}
                colectivizarPreview={msg.colectivizableText}
                onColectivizar={msg.role === 'assistant' && msg.colectivizable && msg.colectivizableText && apiPrefix === '/api/privado'
                  ? (mode) => handleColectivizar(msg.colectivizableText!, mode)
                  : undefined}
                onCalendizar={msg.role === 'assistant' && msg.colectivizable
                  ? () => handleCalendizar(msg.calendarText ?? msg.plainText ?? (typeof msg.content === 'string' ? msg.content : ''))
                  : undefined}
              />
            ))}
            {(loading || isSpeaking) && (
              <div className="pl-2 flex items-center gap-3">
                {isSpeaking ? (
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

          </div>
        )}

        {/* Los tres caminos, fuera del contenedor que scrollea: una respuesta
            larga los empujaba a 5000 px de altura y quedaban inalcanzables,
            porque el <main> de la home no scrollea. Acá están siempre a la
            vista, justo encima de la tarjeta, que es donde antes aparecía la
            pregunta. */}
        {mostrarAcciones && !loading && (
          <div className="w-full flex items-center justify-center gap-2 flex-wrap -mt-4">
            <button
              type="button"
              onClick={() => ejecutarAccion('similar')}
              className="p-2 px-3 text-gray-500 hover:text-[#C5A47E] hover:bg-white rounded-lg transition-all flex items-center gap-2 text-xs font-medium border border-gray-200 hover:border-[#C5A47E] bg-white/50 hover:shadow-sm"
            >
              <span className="text-sm">✨</span>
              Escuchar tres ideas similares
            </button>
            <button
              type="button"
              onClick={() => ejecutarAccion('analysis')}
              className="p-2 px-3 text-gray-500 hover:text-[#C5A47E] hover:bg-white rounded-lg transition-all flex items-center gap-2 text-xs font-medium border border-gray-200 hover:border-[#C5A47E] bg-white/50 hover:shadow-sm"
            >
              <span className="text-sm">🧠</span>
              Critícame la idea
            </button>
            <button
              type="button"
              /* No llama a ninguna IA: sólo devuelve el foco al campo de texto. */
              onClick={() => { setMostrarAcciones(false); textareaRef.current?.focus(); }}
              className="p-2 px-3 text-gray-500 hover:text-[#C5A47E] hover:bg-white rounded-lg transition-all flex items-center gap-2 text-xs font-medium border border-gray-200 hover:border-[#C5A47E] bg-white/50 hover:shadow-sm"
            >
              <span className="text-sm">✍️</span>
              Continuar desarrollando
            </button>
          </div>
        )}

        {/* The Big Card */}
        <form
          onSubmit={handleSendMessage}
          className={`bg-white w-full rounded-3xl shadow-sm border border-black/5 p-4 md:p-8 flex flex-col justify-end transition-all duration-500 relative
              ${hasInteracted ? 'min-h-[160px]' : 'min-h-[320px] shadow-xl'}
            `}
        >
          <div className="flex items-end gap-2 md:gap-4 w-full">
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

                  {extraMenuOptions && extraMenuOptions.length > 0 && (
                    <>
                      <div className="h-px bg-gray-100 my-1" />
                      {extraMenuOptions.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => { opt.onClick(); setShowModeMenu(false); }}
                          className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors text-gray-700"
                        >
                          <span className="text-xl">{opt.emoji}</span>
                          <span className="font-medium">{opt.label}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={hasInteracted ? "Escribe aquí..." : "Guarda aquí tu idea..."}
              className="flex-1 text-2xl bg-transparent border-none outline-none text-foreground placeholder:text-gray-300 font-medium min-w-0 resize-none overflow-hidden leading-tight py-1"
              disabled={loading}
              autoFocus={!hasInteracted}
            />

            {/* Enviar (o detener la voz de la IA, si está hablando) */}
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="w-14 h-10 md:w-16 md:h-11 flex-none flex items-center justify-center rounded-xl transition-all duration-200 bg-[#C5A47E] text-white hover:bg-[#b08e68] disabled:bg-gray-100 disabled:text-gray-300"
              title="Enviar"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isSpeaking ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); stopSpeaking(); }}
                  className="w-full h-full flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                  title="Detener audio"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
                </span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
              )}
            </button>
          </div>
          {/* Divider Line */}
          <div className="w-full h-px bg-gray-100 mt-6 mb-2"></div>

          {/* Sin esto, una idea que no llega a la base se pierde en silencio */}
          {errorGuardado && (
            <div className="text-[11px] text-red-500 mt-1 font-medium" role="status">
              No se pudo guardar la idea. Probá de nuevo.
            </div>
          )}
        </form>

      </div>

      {footerSlot}
    </>
  );
}
