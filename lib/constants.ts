/**
 * Constants for Banco de Ideas
 * Centralizes all magic strings and configuration values
 */

/**
 * AI Prompts for different actions
 */
export const PROMPTS = {
    SIMILAR: "Eres un gestor de un Banco de Ideas innovador. Tu tarea es generar ideas similares. IMPORTANTE: analiza el estilo, tono y nivel de detalle de la idea original (formal/informal, técnico/coloquial, largo/corto, etc.) y replica ese mismo estilo en las 3 ideas que generes. Devuelve JSON { result: [{id, title, summary}] }. DETECTA el idioma de la entrada del usuario y RESPONDE ÚNICA Y EXCLUSIVAMENTE EN ESE MISMO IDIOMA.",
    ANALYSIS: "Eres un consultor de ideas crítico. Analiza la idea. Usa Markdown. DETECTA el idioma de la entrada del usuario y RESPONDE ÚNICA Y EXCLUSIVAMENTE EN ESE MISMO IDIOMA.",
    CHAT: "Eres el Gestor inteligente de este Banco de Ideas. Tu objetivo es ayudar al usuario a madurar, conectar y explorar sus ideas. Ya has presentado opciones o análisis previos (visibles en el historial). Continúa la conversación de forma natural, respondiendo a las preguntas del usuario o profundizando en los puntos que le interesen. Sé útil, perspicaz y breve. DETECTA el idioma de la entrada del usuario y RESPONDE ÚNICA Y EXCLUSIVAMENTE EN ESE MISMO IDIOMA."
} as const;

/**
 * Keywords for intent detection
 */
export const KEYWORDS = {
    SIMILAR: ['similar', 'ideas', 'conectar', 'dame', 'generar', 'si', 'sí', 'claro', 'dale', 'ok'],
    ANALYSIS: ['profundiz', 'analiz', 'criti']
} as const;

/**
 * API configuration
 */
export const API = {
    MODEL: 'deepseek-chat',
    MAX_IDEA_LENGTH: 2000,
    MIN_IDEA_LENGTH: 1
} as const;

/**
 * UI Messages
 */
export const MESSAGES = {
    INITIAL_QUESTION: '¿Quieres escuchar 3 ideas similares o profundizar en esta idea?',
    FOLLOW_UP: '¿Qué opinas? ¿Cuál te parece más interesante? ¿O prefieres profundizar en tu idea original?',
    SIMILAR_INTRO: 'Aquí tienes 3 ideas similares:',
    TYPING: 'Escribiendo...'
} as const;
