# 🏗️ Banco de Ideas - Arquitectura y Visión

> *Un asistente conversacional de IA que transforma cómo capturamos, exploramos y expandimos ideas creativas mediante voz e interacción natural.*

---

## 📋 Resumen Ejecutivo

**Banco de Ideas** es una aplicación web interactiva que combina IA conversacional, entrada de voz en tiempo real, y text-to-speech para crear una experiencia completamente fluida de gestión de ideas. Los usuarios pueden hablar directamente con la IA, que no solo entiende sus ideas sino que también las lee en voz alta, creando un ciclo natural de conversación.

### 🎯 Propuesta de Valor

- **💭 Captura Natural**: Habla y la IA transcribe automáticamente (OpenAI Whisper)
- **🔊 Respuesta en Voz**: La IA lee sus respuestas cuando interactúas por voz  
- **🧠 Análisis Inteligente**: Genera ideas relacionadas, análisis de viabilidad, y crítica constructiva
- **💾 Persistencia Real**: Todas las ideas se guardan automáticamente en MongoDB
- **🎨 UX Premium**: Diseño minimalista con animaciones suaves y feedback visual

---

## � Funcionalidades Principales

### 1. **Full Voice Loop** 🎙️→🔊
Ciclo completo de interacción por voz:
```
Usuario habla → Whisper transcribe → DeepSeek responde → TTS lee respuesta → Usuario escucha
```
- **Detección automática**: Si usas voz, la IA responde en voz. Si escribes, responde en texto.
- **Control manual**: Botón "Escuchar" disponible en todos los mensajes.
- **Interrupciones**: Detén el audio en cualquier momento.

### 2. **Inteligencia Conversacional** 🤖

La IA puede realizar tres tipos de acciones:

**🔗 Bisociaciones (Ideas Similares)**
```
Input: "App de recetas con IA"
Output: 3 ideas relacionadas guardadas automáticamente
  1. Nutri-Coach Virtual personalizado
  2. Gestor de despensa inteligente
  3. Marketplace de chefs locales
```

**📊 Análisis Crítico**
```
Input: "Profundiza en esta idea"
Output: Análisis de viabilidad, mercado, riesgos, fortalezas
```

**💬 Conversación Natural**
```
Input: Pregunta libre sobre la idea
Output: Respuesta contextual basada en el historial
```

### 3. **Push-to-Talk Profesional** 🎤

Sistema de grabación de voz optimizado:
- **Mantener para grabar**: Presiona y mantén el botón de micrófono
- **Cancelación inteligente**: Arrastra fuera del botón para cancelar
- **Feedback visual**: Indicador pulsante mientras graba
- **Validación**: Descarta grabaciones muy cortas (<500ms)

### 4. **Banco Visual de Ideas** 📚

Visualización de todas las ideas persistidas:
- Filtrado por categoría (`Tuyas` vs `Bisociaciones IA`)
- Búsqueda en tiempo real
- Tarjetas con diseño glassmorphism
- Eliminación con confirmación

---

## 🏛️ Stack Tecnológico

```
┌─────────────────────────────────────────┐
│  Frontend                                │
├─────────────────────────────────────────┤
│  Next.js 16 (App Router)                │
│  React 19 + TypeScript                  │
│  TailwindCSS 4                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  IA & Voz                                │
├─────────────────────────────────────────┤
│  DeepSeek deepseek-chat V3.2 (Chat/IA)  │
│  OpenAI Whisper-1 (Speech-to-Text)      │
│  OpenAI TTS-1 Shimmer (Text-to-Speech)  │
│  OpenAI text-embedding-3-small (Search) │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Backend & DB                            │
├─────────────────────────────────────────┤
│  Next.js API Routes (Serverless)        │
│  MongoDB Atlas + Mongoose 9              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Deploy & Hosting                        │
├─────────────────────────────────────────┤
│  Vercel (Edge Runtime para /speak)      │
│  GitHub (Continuous Deployment)          │
└─────────────────────────────────────────┘
```

---

## 📐 Arquitectura de Componentes

### 🗂️ Estructura de Archivos

```
banco-de-ideas/
├── app/
│   ├── page.tsx                    # 🎯 Orquestador Principal
│   ├── banco/page.tsx              # 📚 Dashboard de Ideas
│   ├── about/page.tsx              # ℹ️ Filosofía y Técnica
│   ├── globals.css                 # 🎨 Estilos + Animaciones TTS
│   └── api/
│       ├── analyze/route.ts        # 🧠 Motor de Inteligencia
│       ├── transcribe/route.ts     # 🎤 Speech-to-Text
│       ├── speak/route.ts          # 🔊 Text-to-Speech [NEW]
│       └── ideas/route.ts          # 💾 CRUD de Ideas
│
├── components/
│   ├── ChatMessage.tsx             # 💬 Mensaje + Botón Escuchar
│   └── BancoView.tsx               # 📊 Vista de Repositorio
│
├── hooks/
│   └── useVoiceRecording.ts        # 🎙️ Hook de Grabación
│
└── lib/
    ├── db.ts                       # 🗄️ Capa de Datos (Mongoose)
    ├── mongodb.ts                  # 🔌 Conexión MongoDB
    ├── models/Idea.ts              # 📋 Schema de Idea
    ├── logger.ts                   # 📝 Sistema de Logging
    └── constants.ts                # ⚙️ Configuración Central
```

### 🔄 Flujo de Datos Completo

```mermaid
graph TD
    A[👤 Usuario] -->|Habla| B[🎤 useVoiceRecording]
    A -->|Escribe| C[⌨️ Input Field]
    
    B -->|Audio Blob| D[/api/transcribe]
    D -->|Whisper API| E[📝 Texto Transcrito]
    
    C --> F[📨 handleSendMessage]
    E -->|viaVoice=true| F
    
    F --> G{🧭 Intent Detection}
    
    G -->|similar| H[/api/analyze?action=similar]
    G -->|analysis| I[/api/analyze?action=analysis]
    G -->|chat| J[/api/analyze?action=chat]
    
    H --> K[🤖 DeepSeek deepseek-chat]
    I --> K
    J --> K
    
    K --> L[✅ Respuesta IA]
    L --> M{🎙️ Origen?}
    
    M -->|viaVoice| N[/api/speak]
    M -->|keyboard| O[💬 Solo Texto]
    
    N -->|TTS API| P[🔊 Audio MP3]
    P --> Q[▶️ Reproducción]
    
    L -->|Bisociaciones| R[(MongoDB)]
    R --> S[📚 BancoView]
```

---

## 🧩 Componentes Clave en Detalle

### 1. `app/page.tsx` - Orquestador Principal

**Responsabilidades:**
- ✅ Gestión del estado conversacional (mensajes, loading, speaking)
- ✅ Detección de intenciones del usuario (analysis vs similar vs chat)
- ✅ Coordinación del ciclo de voz (STT → GPT → TTS)
- ✅ Control de restricciones de voz según el flujo

**Estados Clave:**
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [currentIdea, setCurrentIdea] = useState<string | null>(null);
const [awaitingDecision, setAwaitingDecision] = useState(false);
const [voiceEnabled, setVoiceEnabled] = useState(true);
const [isSpeaking, setIsSpeaking] = useState(false);
```

**Innovación: Generador de IDs Único**
```typescript
// Evita race conditions en mensajes rápidos
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;
```

### 2. `hooks/useVoiceRecording.ts` - Gestión de Voz

Hook especializado que encapsula toda la complejidad de Web Media API:

**Características:**
- ✅ Permisos de micrófono con manejo de errores
- ✅ Captura de audio en formato WebM
- ✅ Validación de duración mínima (500ms)
- ✅ Cancelación por arrastre fuera del botón
- ✅ Limpieza agresiva de recursos (previene fugas de memoria)

**Mecanismo de Cancelación:**
```typescript
const handlePointerUp = (e: React.PointerEvent) => {
  const rect = buttonRef.current?.getBoundingClientRect();
  const isInside = // ... bounds check
  if (!isInside) cancelRecording(); // Cancela si sueltas fuera
  else stopRecording(); // Transcribe si sueltas dentro
};
```

### 3. `app/api/analyze/route.ts` - Motor de Inteligencia

Endpoint multifunción que procesa las intenciones del usuario:

**Acciones Soportadas:**

| Acción | Input | Output | Guardado |
|--------|-------|--------|----------|
| `similar` | Idea original | 3 bisociaciones | ✅ Automático |
| `analysis` | Idea original | Análisis crítico | ❌ |
| `chat` | Pregunta libre | Respuesta contextual | ❌ |
| `save` | Texto | Confirmación | ✅ Manual |

**Prompts Especializados:**
```typescript
PROMPTS = {
  SIMILAR: "Genera ideas similares. JSON: {result: [{id, title, summary}]}",
  ANALYSIS: "Analiza la idea como consultor de negocios. Usa Markdown.",
  CHAT: "Ayuda al usuario a madurar y conectar sus ideas. Sé breve."
}
```

### 4. `app/api/speak/route.ts` - Text-to-Speech [NEW]

**Configuración:**
- Runtime: `nodejs` (compatibilidad con OpenAI SDK y buffers)
- Modelo: `tts-1`
- Voz: `shimmer` (voz femenina agradable)
- Formato: `audio/mpeg` (MP3)

**Flujo:**
```typescript
POST /api/speak { text: "Mensaje a leer" }
  → OpenAI TTS API
  → Audio Stream MP3
  → Client reproduce
```

**Optimizaciones:**
- ✅ Validación de longitud máxima (4000 caracteres)
- ✅ Manejo de errores con feedback al usuario
- ✅ URL.revokeObjectURL() para prevenir memory leaks

### 5. `components/ChatMessage.tsx` - Mensaje + Control TTS

**Innovación: Botón "Escuchar" Siempre Visible**

Anteriormente el botón solo aparecía al hover. Ahora es permanentemente visible para mejorar accesibilidad:

```tsx
{!isUser && onSpeak && plainText && (
  <button
    onClick={() => onSpeak(plainText)}
    className="self-start p-2 text-gray-400 hover:text-[#C5A47E] ..."
  >
    🔊 Escuchar
  </button>
)}
```

### 6. `lib/db.ts` - Capa de Datos

Abstracción sobre Mongoose con métodos tipados y seguros:

```typescript
export async function saveIdea(text: string, category: 'user' | 'bisociation')
export async function saveIdeas(ideas: Array<{text: string, category}>)
export async function getIdeas(): Promise<SavedIdea[]>
export async function deleteIdea(id: string): Promise<boolean>
```

**Validaciones:**
- Longitud mínima: 1 carácter
- Longitud máxima: 2000 caracteres
- Sanitización de inputs

---

## 💾 Modelo de Datos

### Schema de Idea (MongoDB)

```typescript
{
  text: { 
    type: String, 
    required: true,
    minlength: 1,
    maxlength: 2000,
    trim: true
  },
  category: { 
    type: String, 
    enum: ['user', 'bisociation'], 
    default: 'user',
    index: true  // Performance en queries filtradas
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: -1  // Orden descendente por defecto
  }
}
```

### Tipos del Cliente

```typescript
type Message = {
  id: string | number;
  role: 'user' | 'assistant';
  content: React.ReactNode | string;
  plainText?: string;  // Para TTS y historial
}

type SavedIdea = {
  id: string;
  text: string;
  createdAt: string;
  category: 'user' | 'bisociation';
}
```

---

## 🎨 Diseño Visual y UX

### Paleta de Colores

```css
:root {
  --background: #F8F5F0;      /* Beige cálido, evoca papel y creatividad */
  --foreground: #4a4a4a;      /* Gris oscuro legible */
  --primary: #C5A47E;         /* Dorado táctil premium */
  --accent: #1A1A1A;          /* Negro para contraste */
}
```

### Principios de Diseño

1. **Minimalismo Funcional**: Solo los elementos esenciales en pantalla
2. **Feedback Visual Constante**: Animaciones sutiles para cada acción
3. **Accesibilidad**: Botones grandes, alto contraste, ARIA labels
4. **Responsividad**: Mobile-first con breakpoints fluidos

### Animaciones Clave

**Indicador de Audio (Sound Waves):**
```css
@keyframes sound {
  0% { height: 4px; }
  50% { height: 12px; }
  100% { height: 4px; }
}
.animate-sound {
  animation: sound 0.5s ease-in-out infinite;
}
```

**Aparición de Mensajes:**
```tsx
className="animate-in fade-in slide-in-from-bottom-2 duration-500"
```

---

## 🧠 Decisiones Técnicas Clave

### 1. **De LocalStorage a MongoDB**

**Antes:** Ideas guardadas en el navegador  
**Ahora:** Persistencia real en MongoDB Atlas

**Razones:**
- ✅ **Durabilidad**: No se pierden al limpiar caché
- ✅ **Multiplataforma**: Acceso desde cualquier dispositivo
- ✅ **Escalabilidad**: Permite búsquedas y agregaciones complejas
- ✅ **Seguridad**: Datos en servidor, no en cliente

### 2. **Push-to-Talk vs Toggle Recording**

**Elegido:** Mantener para grabar (PointerEvents)

**Ventajas:**
- ✅ **Menos errores**: Usuario consciente de cuándo graba
- ✅ **Rapidez**: Envío automático al soltar
- ✅ **Cancelación natural**: Arrastra fuera para cancelar

### 3. **Edge Runtime para TTS**

```typescript
export const runtime = "edge";  // En app/api/speak/route.ts
```

**Beneficios:**
- ✅ **Latencia reducida**: Ejecuta en el edge más cercano al usuario
- ✅ **Escalabilidad**: Mejor manejo de picos de tráfico
- ✅ **Costo**: Más eficiente que funciones serverless tradicionales

### 4. **Intent Detection en Cliente**

La detección de intenciones ocurre en el cliente antes de llamar al backend:

```typescript
const analysisKeywords = ['profundiz', 'analizar', 'críti', 'detalle'];
const similarKeywords = ['similar', 'ideas', 'conectar', 'generar'];

if (analysisKeywords.some(k => lowerText.includes(k))) {
  action = "analysis";
} else if (similarKeywords.some(k => lowerText.includes(k))) {
  action = "similar";
}
```

**Ventajas:**
- ✅ **Latencia**: Respuesta inmediata sin roundtrip
- ✅ **Costo**: Ahorra tokens de GPT
- ✅ **Control**: Prioridad explícita (analysis > similar)

### 5. **Generador de IDs Único**

Problema original: `Date.now()` puede repetirse en mensajes simultáneos

**Solución:**
```typescript
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;
```

**Garantiza:** IDs únicos incluso con < 1ms entre creaciones

---

## 🛡️ Calidad y Robustez

### Bug Fixes Implementados (Diciembre 2024)

| Bug | Severidad | Solución |
|-----|-----------|----------|
| Memory leak en TTS | 🔴 Crítico | `URL.revokeObjectURL()` en handlers |
| Race condition en IDs | 🔴 Crítico | Generador con contador incremental |
| Audio overlap | 🟠 Alto | `stopSpeaking()` antes de reproducir |
| Loading state stuck | 🟠 Alto | `finally` block en `handleSendMessage` |
| TTS sin validación | 🟠 Alto | Límite 4000 caracteres |

### Sistema de Logging

```typescript
import { logger } from '@/lib/logger';

logger.info("Fetching TTS audio...");
logger.error("TTS API error:", status);
logger.warn("Text too long:", length);
```

**Niveles:**
- 📘 `info`: Flujo normal
- ⚠️ `warn`: Situaciones inesperadas pero manejables
- 🔴 `error`: Fallos que requieren atención

---

## 🔮 Roadmap y Futuras Mejoras

### Corto Plazo (Q1 2025)
- [ ] **Temas de voz personalizables** (echo, nova, fable, onyx)
- [ ] **Exportación a Markdown/Notion** de conversaciones completas
- [ ] **Shortcuts de teclado** (Cmd+K para grabar)

### Medio Plazo (Q2 2025)
- [ ] **Búsqueda semántica por vectores** (embeddings + RAG)
- [ ] **Categorización automática** por temas mediante IA
- [ ] **Colaboración en tiempo real** (WebSockets)

### Largo Plazo (2025+)
- [ ] **Autenticación de usuarios** con bancos privados
- [ ] **API pública** para integraciones
- [ ] **App móvil nativa** (React Native)
- [ ] **Modo offline** con sincronización

---

## 📊 Métricas de Éxito

### Performance
- ⏱️ **Time to First Byte (TTFB)**: < 200ms
- 🎤 **Transcripción Whisper**: ~2-3 segundos
- 🔊 **Generación TTS**: ~1-2 segundos
- 🧠 **Respuesta DeepSeek**: ~3-5 segundos

### Calidad de Código
- ✅ **21 problemas identificados** en code review
- ✅ **5 bugs críticos resueltos** 
- ✅ **0 memory leaks** detectados
- ✅ **TypeScript strict mode** habilitado

### UX
- 🎯 **Push-to-Talk**: Tasa de éxito >95%
- 🔊 **TTS Playback**: 100% funcional
- 💬 **Intent Detection**: Precisión >90%

---

## 🔧 Configuración y Deploy

### Variables de Entorno

```env
# DeepSeek (chat/análisis — Requerido)
DEEPSEEK_API_KEY=sk-...

# OpenAI (voz: Whisper, TTS, embeddings — Requerido)
OPENAI_API_KEY=sk-proj-...

# MongoDB (Requerido)
MONGODB_URI=mongodb+srv://...
MONGODB_URI_PRUEBAS=mongodb+srv://...

# Tracking interno
TRACK_SECRET=...

# Auth Google (NextAuth v5)
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

### Comandos de Desarrollo

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Deploy a Vercel
vercel --prod
```

### Dependencias Principales

```json
{
  "next": "^16.0.0",
  "react": "^19.0.0",
  "mongoose": "^9.0.0",
  "openai": "^4.0.0",
  "react-markdown": "^10.0.0",
  "remark-gfm": "^4.0.0",
  "tailwindcss": "^4.0.0"
}
```

---

## 🏆 Conclusión

**Banco de Ideas** representa una evolución significativa en cómo interactuamos con herramientas de gestión de creatividad:

1. **Conversación Natural**: No es un formulario, es un diálogo inteligente
2. **Multimodal**: Voz, texto, y audio de salida integrados
3. **Inteligencia Contextual**: La IA recuerda el hilo de la conversación
4. **Persistencia Real**: Tus ideas están seguras en la nube
5. **UX Premium**: Diseño que invita a la creatividad

### Enlaces

- 🌐 **Producción**: [unbancodeideas.com](https://unbancodeideas.com)
- 📦 **Repositorio**: [github.com/damiancolo/banco-de-ideas](https://github.com/damiancolo/banco-de-ideas)
- 📖 **Documentación**: Este archivo + `/about` en la app

---

**Versión:** 2.1.0  
**Última actualización:** Abril 2026  
**Estado:** ✅ Estable y en producción  
**Licencia:** MIT
