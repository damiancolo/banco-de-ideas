# Banco de Ideas - Contexto para Agentes IA

## Resumen
Aplicacion web de gestion creativa con IA multimodal (voz + texto). Captura, analiza y expande ideas usando "bisociacion" (conectar ideas no relacionadas). Creada por Damian Lafferranderie.

## Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Base de datos**: MongoDB Atlas (Mongoose 9)
- **IA**: OpenAI GPT-4o-mini (chat/analisis), Whisper-1 (STT), TTS-1 Shimmer (TTS)
- **Estilos**: TailwindCSS 4
- **Deploy**: Vercel (auto-deploy desde GitHub)

## Entornos

| Entorno | Rama Git | Proyecto Vercel | Base de datos MongoDB | URL |
|---|---|---|---|---|
| Pruebas | `develop` | `banco-de-ideas-pruebas` | `banco-ideas-pruebas` | unbancodeideas.com |
| Produccion | `main` | `banco-de-ideas` | `banco-ideas` | www.unbancodeideas.com |

**IMPORTANTE**: Las bases de datos se llaman `banco-ideas` y `banco-ideas-pruebas` (SIN "de"). No usar `banco-de-ideas` ni `banco-de-ideas-pruebas`.

## Variables de entorno
```
OPENAI_API_KEY=sk-proj-...
MONGODB_URI=mongodb+srv://bancodeideas:<password>@bancodeideas.0qdelgq.mongodb.net/banco-ideas?retryWrites=true&w=majority&appName=bancodeideas
MONGODB_URI_PRUEBAS=mongodb+srv://bancodeideas:<password>@bancodeideas.0qdelgq.mongodb.net/banco-ideas-pruebas?retryWrites=true&w=majority&appName=bancodeideas
TRACK_SECRET=internal_track_2026_banco
```

Las mismas variables estan configuradas en Vercel para cada proyecto. Para probar localmente contra la BD de pruebas, se cambia `MONGODB_URI` para que apunte a `banco-ideas-pruebas`.

## Estructura de archivos
```
app/
  page.tsx                      # Orquestador principal (chat)
  banco/page.tsx                # Dashboard visual de ideas
  about/page.tsx                # Pagina sobre el proyecto
  tracker/page.tsx              # Dashboard de analytics (recharts, visitas humanos/bots)
  api/
    analyze/route.ts            # Chat/bisociaciones/analisis (OpenAI) [rate limit: 15/min]
    transcribe/route.ts         # Speech-to-text (Whisper) [rate limit: 10/min]
    speak/route.ts              # Text-to-speech (TTS) [rate limit: 10/min]
    ideas/route.ts              # CRUD de ideas [rate limit: 5/min POST, 10/min DELETE]
    ideas/comments/route.ts     # Comentarios en ideas [rate limit: 10/min]
    search/semantic/route.ts    # Busqueda por embeddings [rate limit: 15/min]
    search/keywords/route.ts    # Busqueda por texto [rate limit: 20/min]
    agent/route.ts              # API para agentes de IA (GET/POST/OPTIONS) [rate limit: 20/min]
    track/route.ts              # POST interno para guardar visitas (protegido con TRACK_SECRET)
    tracker/route.ts            # GET con agregaciones MongoDB para dashboard analytics [rate limit: 30/min]
components/
  ChatMessage.tsx               # Mensaje individual con boton "Escuchar"
  BancoView.tsx                 # Vista del repositorio de ideas
  AgentJsonLd.tsx               # JSON-LD semantico invisible para agentes de IA
  AgentInvitation.tsx           # Comentario HTML invisible que invita a agentes
hooks/
  useVoiceRecording.ts          # Hook push-to-talk (Web Media API)
lib/
  db.ts                         # Capa de datos (saveIdea, getIdeas, etc.)
  mongodb.ts                    # Conexion singleton a MongoDB
  models/Idea.ts                # Schema Mongoose (text, category, embedding, createdAt)
  models/RateLimit.ts           # Schema para rate limiting por IP
  models/Visit.ts               # Schema para visitas (TTL 90 dias, privacy-friendly sin IP)
  rate-limit.ts                 # Rate limiter con sliding window via MongoDB (fail-closed)
  request-utils.ts              # getIp() centralizado con validacion anti-spoofing
  logger.ts                     # Logger (info/warn/error)
  constants.ts                  # Prompts de IA y configuracion
  utils/embeddings.ts           # Generacion de embeddings y cosine similarity
services/
  ideaService.ts                # Llamadas API desde el cliente
scripts/
  sync-pruebas-db.js            # Sincroniza datos entre entornos
  generate-embeddings.js        # Genera embeddings para busqueda semantica
types/
  index.ts                      # Tipos TypeScript compartidos
middleware.ts                   # Headers para agentes + content negotiation + visitor tracking (POST a /api/track)
public/
  llms.txt                      # Documentacion para agentes de IA (llms.txt standard)
  robots.txt                    # Robots.txt con seccion para agentes de IA
  .well-known/
    ai-plugin.json              # Plugin manifest para agentes de IA
    openapi.json                # Especificacion OpenAPI de la API de agentes
mcp-server/                     # Servidor MCP (Model Context Protocol) — proyecto separado
  index.js                      # Server con tools, resources y prompts
  package.json                  # Dependencias (@modelcontextprotocol/sdk)
```

## Modelo de datos (MongoDB)

### Idea
```
{
  text: String (1-2000 chars, required, trimmed),
  category: "user" | "bisociation" (default: "user", indexed),
  embedding: [Number] (vector para busqueda semantica, excluido por defecto en queries),
  comments: [{ text: String, createdAt: Date }],
  highlighted: Boolean (default: false),
  createdAt: Date (indexed descendente)
}
```

### RateLimit
```
{
  ip: String,
  action: String,
  count: Number,
  expiresAt: Date (TTL index, auto-eliminado por MongoDB)
}
```

### Visit
```
{
  timestamp: Date (TTL index 90 dias, auto-eliminado),
  path: String,
  visitorType: "human" | "bot" (indexed),
  botName: String | null,
  browser: String | null,
  deviceType: "desktop" | "mobile" | "tablet",
  country: String | null,
  referrer: String | null
}
```
Privacy-friendly: no almacena IPs. Los datos se envian desde el middleware (Edge) via POST fire-and-forget a `/api/track` (Node.js).

## Capa invisible para agentes de IA
El proyecto incluye una capa completa para que agentes de IA descubran e interactuen con la plataforma, sin afectar la experiencia humana:

- **Descubrimiento**: `llms.txt`, `ai-plugin.json`, `openapi.json`, headers HTTP (`X-AI-Agent-API`, `X-AI-Docs`), JSON-LD semantico, comentario HTML invisible
- **API REST**: `GET/POST /api/agent` — listar, publicar bisociaciones/ideas, buscar (rate limit: 20/min)
- **MCP Server**: `mcp-server/` — servidor Model Context Protocol con tools (`leer_ideas`, `publicar_bisociacion`, `publicar_idea`, `buscar_ideas`, `estadisticas`), resources y prompts
- **Middleware**: headers invisibles en todas las respuestas + content negotiation (JSON requests a `/` o `/banco` redirigen a `/api/agent`)
- **Sin autenticacion**: la API de agentes es abierta, protegida solo por rate limiting

## Seguridad implementada
- Rate limiting en TODOS los endpoints API (fail-closed: si la BD falla, rechaza)
- Extraccion de IP con validacion anti-spoofing (lib/request-utils.ts)
- Headers de seguridad en next.config.mjs (nosniff, DENY frame, XSS protection, referrer policy, permissions policy)
- Errores 500 sanitizados: no exponen detalles internos, solo mensajes genericos
- Validacion de input en todos los endpoints (longitud maxima, tipos, formato)

## Flujo principal
```
Usuario habla/escribe
  -> Si voz: /api/transcribe (Whisper) -> texto
  -> Deteccion de intencion en cliente (keywords)
  -> /api/analyze?action=similar|analysis|chat (GPT-4o-mini)
  -> Si via voz: /api/speak (TTS) -> audio MP3
  -> Bisociaciones se guardan automaticamente en MongoDB
```

## Comandos
```bash
npm run dev          # Servidor de desarrollo (localhost:3000)
npm run build        # Build de produccion
npm run map-project  # Genera esquema visual del proyecto
```

## Flujo de trabajo Git
1. Trabajar en rama `develop`
2. Push a `develop` -> auto-deploy a pruebas
3. Verificar en entorno de pruebas
4. PR de `develop` a `main` -> merge -> auto-deploy a produccion

## Notas para agentes
- El archivo `env.example` tiene el formato correcto de las variables
- Para probar cambios: cambiar MONGODB_URI en .env.local a la URI de pruebas, ejecutar `npm run dev`
- Nunca hacer push directo a `main`
- Los logs detallados se mantienen internamente via `logger.error()`, pero las respuestas HTTP solo muestran mensajes genericos
- La coleccion `ratelimits` se auto-limpia via TTL index de MongoDB
- La coleccion `visits` se auto-limpia via TTL index de 90 dias
- `TRACK_SECRET` debe configurarse tambien en Vercel para que el tracking funcione en produccion
- MongoDB Atlas tiene `0.0.0.0/0` en la whitelist (necesario para Vercel/serverless)
