# Banco de Ideas - Contexto para Agentes IA

## Resumen
Aplicacion web de gestion creativa con IA multimodal (voz + texto). Captura, analiza y expande ideas usando "bisociacion" (conectar ideas no relacionadas). Creada por Damian Lafferranderie.

## Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Base de datos**: MongoDB Atlas (Mongoose 9)
- **IA**: OpenAI GPT-4o-mini (chat/analisis), Whisper-1 (STT), TTS-1 Shimmer (TTS)
- **Auth**: NextAuth v5 beta (next-auth@5.0.0-beta) + @auth/mongodb-adapter + Google OAuth
- **Estilos**: TailwindCSS 4
- **Deploy**: Vercel (auto-deploy desde GitHub)

## Entornos

| Entorno | Rama Git | Proyecto Vercel | Base de datos MongoDB | URL |
|---|---|---|---|---|
| Staging | `staging` | `banco-de-ideas-pruebas` | `banco-ideas-pruebas` | banco-de-ideas.vercel.app |
| Produccion | `main` | `banco-de-ideas` | `banco-ideas` | www.unbancodeideas.com |

**Flujo**: trabajar en `staging` → push → auto-deploy a pruebas → merge a `main` → auto-deploy a produccion.

**IMPORTANTE**: Las bases de datos se llaman `banco-ideas` y `banco-ideas-pruebas` (SIN "de"). No usar `banco-de-ideas` ni `banco-de-ideas-pruebas`.

## Variables de entorno
```
OPENAI_API_KEY=sk-proj-...
MONGODB_URI=mongodb+srv://bancodeideas:<password>@bancodeideas.0qdelgq.mongodb.net/banco-ideas?retryWrites=true&w=majority&appName=bancodeideas
MONGODB_URI_PRUEBAS=mongodb+srv://bancodeideas:<password>@bancodeideas.0qdelgq.mongodb.net/banco-ideas-pruebas?retryWrites=true&w=majority&appName=bancodeideas
TRACK_SECRET=internal_track_2026_banco
# Autenticacion Google (NextAuth v5)
AUTH_SECRET=<random-32-bytes-base64>
AUTH_GOOGLE_ID=<google-oauth-client-id>
AUTH_GOOGLE_SECRET=<google-oauth-client-secret>
```

Las mismas variables estan configuradas en Vercel para cada proyecto. Para probar localmente contra la BD de pruebas, se cambia `MONGODB_URI` para que apunte a `banco-ideas-pruebas`.

## Estructura de archivos
```
app/
  page.tsx                      # Orquestador principal (chat publico)
  banco/page.tsx                # Dashboard visual de ideas publicas
  about/page.tsx                # Pagina sobre el proyecto (ES/EN/CA)
  tracker/page.tsx              # Dashboard de analytics (recharts, visitas humanos/bots)
  privado/
    page.tsx                    # Login con Google o chat privado si autenticado
    layout.tsx                  # Wrapper con AuthProvider (no indexable por SEO)
    PrivadoChat.tsx             # Chat privado usando ChatEngine con prefijo /api/privado
    banco/page.tsx              # Dashboard de ideas privadas del usuario
  api/
    analyze/route.ts            # Chat/bisociaciones/analisis (OpenAI) [rate limit: 15/min]
    transcribe/route.ts         # Speech-to-text (Whisper) [rate limit: 10/min]
    speak/route.ts              # Text-to-speech (TTS) [rate limit: 10/min]
    ideas/route.ts              # CRUD de ideas publicas [rate limit: 5/min POST, 10/min DELETE]
    ideas/comments/route.ts     # Comentarios en ideas [rate limit: 10/min]
    search/semantic/route.ts    # Busqueda semantica publica [rate limit: 15/min]
    search/keywords/route.ts    # Busqueda por texto publica [rate limit: 20/min]
    agent/route.ts              # API para agentes de IA (GET/POST/OPTIONS) [rate limit: 20/min]
    track/route.ts              # POST interno para guardar visitas (protegido con TRACK_SECRET)
    tracker/route.ts            # GET con agregaciones MongoDB para dashboard analytics [rate limit: 30/min]
    auth/[...nextauth]/route.ts # Handler NextAuth (GET/POST)
    auth-debug/route.ts         # Diagnostico de variables de auth (no exponer en produccion)
    privado/
      analyze/route.ts          # Chat/bisociaciones privado (requiere sesion)
      ideas/route.ts            # CRUD de ideas privadas (filtradas por userId)
      ideas/comments/route.ts   # Comentarios en ideas privadas
      search/semantic/route.ts  # Busqueda semantica privada
      search/keywords/route.ts  # Busqueda por texto privada
auth.ts                         # Configuracion NextAuth: Google provider + MongoDBAdapter + JWT
components/
  ChatMessage.tsx               # Mensaje individual con boton "Escuchar"
  ChatEngine.tsx                # Motor de chat reutilizable (usado en publico y privado)
  BancoView.tsx                 # Vista del repositorio de ideas
  AgentJsonLd.tsx               # JSON-LD semantico invisible para agentes de IA
  AgentInvitation.tsx           # Comentario HTML invisible que invita a agentes
  AuthProvider.tsx              # SessionProvider de next-auth para el area privada
  GoogleSignInButton.tsx        # Boton de login con Google
  PrivateHeader.tsx             # Header del area privada con foto de usuario y sign out
  IdeaModal.tsx                 # Modal de detalle de idea
hooks/
  useVoiceRecording.ts          # Hook push-to-talk (Web Media API)
lib/
  db.ts                         # Capa de datos (saveIdea, getIdeas, getUserIdeas, etc.)
  mongodb.ts                    # Conexion singleton a MongoDB (Mongoose)
  auth-client.ts                # MongoClient nativo para el MongoDB Adapter de NextAuth
  auth-utils.ts                 # Utilidades de autenticacion (getAuthSession, etc.)
  models/Idea.ts                # Schema Mongoose (text, category, userId, embedding, createdAt)
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

### User / Account (NextAuth MongoDB Adapter)
```
users:    { name, email, image, emailVerified, createdAt }
accounts: { userId, provider, providerAccountId, type, ... }
```
Colecciones gestionadas automaticamente por `@auth/mongodb-adapter`. Los usuarios se crean al primer login con Google.

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

## Espacio Privado (autenticacion Google)

El area `/privado` es un banco de ideas personal por usuario, separado del espacio publico.

### Flujo de autenticacion
```
Usuario visita /privado
  -> Si no autenticado: muestra pantalla de login con GoogleSignInButton
  -> Click "Iniciar sesion con Google" -> Google OAuth (NextAuth)
  -> Callback /api/auth/callback/google -> NextAuth crea/recupera usuario en MongoDB
  -> Redirige a /privado -> muestra ChatEngine privado con PrivateHeader
```

### Caracteristicas
- **Aislamiento total**: las ideas privadas tienen `userId` y solo son accesibles por ese usuario
- **Mismas capacidades**: chat, voz, bisociaciones, busqueda semantica — todo igual que el espacio publico
- **API privada**: `/api/privado/*` replica los endpoints publicos pero filtra por `session.user.id`
- **No indexable**: `robots: { index: false }` en el layout privado
- **Sin rate limit por IP en privado**: las rutas privadas confian en la sesion JWT

### Configuracion NextAuth (`auth.ts`)
- Provider: Google con `client_secret_post`
- Adapter: MongoDBAdapter con MongoClient nativo (no el de Mongoose)
- Session: estrategia JWT
- `trustHost: true` (necesario para Vercel)
- Pagina de login personalizada: `/privado`

## Capa invisible para agentes de IA
El proyecto incluye una capa completa para que agentes de IA descubran e interactuen con la plataforma, sin afectar la experiencia humana:

- **Descubrimiento**: `llms.txt`, `ai-plugin.json`, `openapi.json`, headers HTTP (`X-AI-Agent-API`, `X-AI-Docs`), JSON-LD semantico, comentario HTML invisible
- **API REST**: `GET/POST /api/agent` — listar, publicar bisociaciones/ideas, buscar (rate limit: 20/min)
- **MCP Server**: `mcp-server/` — servidor Model Context Protocol con tools (`leer_ideas`, `publicar_bisociacion`, `publicar_idea`, `buscar_ideas`, `estadisticas`), resources y prompts
- **Middleware**: headers invisibles en todas las respuestas + content negotiation (JSON requests a `/` o `/banco` redirigen a `/api/agent`)
- **Sin autenticacion**: la API de agentes es abierta, protegida solo por rate limiting

## Sistema de Visitor Tracking

### Arquitectura
```
┌─────────────────────────────────────────────────────────────────┐
│                     FUENTES DE DATOS                            │
│                                                                 │
│  ┌─────────────────────┐     ┌──────────────────────────────┐   │
│  │  unbancodeideas.com │     │  estudioprompt.com            │   │
│  │  middleware.ts       │     │  AI Bot Tracker plugin        │   │
│  │  (Edge Runtime)      │     │  aibt_track_visit()           │   │
│  └─────────┬───────────┘     └──────────────┬───────────────┘   │
│            │ POST fire-and-forget             │ wp_remote_post   │
│            │ (origin/api/track)               │ (blocking=false) │
│            └──────────────┬──────────────────┘                  │
│                           ▼                                     │
│              ┌────────────────────────┐                         │
│              │  /api/track (Node.js)  │                         │
│              │  Protegido: TRACK_SECRET│                         │
│              └───────────┬────────────┘                         │
│                          ▼                                      │
│              ┌────────────────────────┐                         │
│              │  MongoDB: visits       │                         │
│              │  TTL: 90 dias          │                         │
│              └───────────┬────────────┘                         │
│                          ▼                                      │
│              ┌────────────────────────┐                         │
│              │  /api/tracker (GET)    │                         │
│              │  9 agregaciones        │                         │
│              └───────────┬────────────┘                         │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  VISUALIZACION                                             │  │
│  │  /tracker (dashboard recharts)                             │  │
│  │  estudioprompt.com/ai-stats/ (iframe embed)                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Deteccion en middleware.ts
- **Bots de IA**: detecta 14 patrones (GPTBot, ClaudeBot, GoogleBot, PerplexityBot, Meta, DeepSeek, etc.)
- **Navegadores**: Chrome, Safari, Firefox, Edge, Opera
- **Dispositivos**: mobile, tablet, desktop (via regex en user-agent)
- **Excluye**: rutas `/api/*`, `/_next/*`, y archivos estaticos (`.ext`)
- **Dual tracking**: bots se envian tambien a WordPress (`estudioprompt.com/wp-json/ai-tracker/v1/visit`)

### WordPress: AI Bot Tracker plugin
El plugin en `estudioprompt.com/wp-content/plugins/ai-bot-tracker/ai-bot-tracker.php` fue modificado:
- `aibt_track_visit()`: ademas de guardar en WordPress, envia `wp_remote_post` a `unbancodeideas.com/api/track` con TRACK_SECRET
- `aibt_render_dashboard()`: muestra iframe de `unbancodeideas.com/tracker` en vez del dashboard original
- Ruta: `estudioprompt.com/ai-stats/` (password: `estudioprompt2026`)
- El plugin tambien rastrea bots que visitan estudioprompt.com y los envia al mismo MongoDB

### iframe embed (next.config.mjs)
- `/tracker`: CSP `frame-ancestors https://estudioprompt.com` (permite iframe solo desde estudioprompt)
- `/api/tracker`: CORS `Access-Control-Allow-Origin: https://estudioprompt.com`
- Todo lo demas: `X-Frame-Options: DENY` (no se puede embeber)

### Dashboard (`/tracker`)
- Recharts: AreaChart, PieChart (donut), BarChart horizontal
- Rango temporal: Hoy, 7 dias, 30 dias, Todo
- 4 tarjetas con contadores animados (Total, Humanos, Bots, Paises)
- Feed de actividad reciente (ultimas 20 visitas)
- Auto-refresh cada 60 segundos
- Estetica gold/beige (#C5A47E, #F8F5F0)

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
1. Trabajar en rama `staging`
2. Push a `staging` -> auto-deploy a pruebas (banco-de-ideas.vercel.app)
3. Verificar en entorno de pruebas
4. Merge `staging` a `main` -> auto-deploy a produccion (www.unbancodeideas.com)

**IMPORTANTE**: Siempre pushear a `staging`, nunca directamente a `main` ni `develop`.

## Notas para agentes
- El archivo `env.example` tiene el formato correcto de las variables
- Para probar cambios: cambiar MONGODB_URI en .env.local a la URI de pruebas, ejecutar `npm run dev`
- Siempre trabajar en `staging`, nunca pushear directo a `main` ni `develop`
- Para el area privada: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` deben estar en Vercel
- El OAuth client de Google esta en el proyecto GCP `perfect-period-473623-p8` (project number 700254029805)
- Redirect URIs autorizados en Google: `http://localhost:3000/api/auth/callback/google`, `https://banco-de-ideas.vercel.app/api/auth/callback/google`, `https://www.unbancodeideas.com/api/auth/callback/google`
- Los logs detallados se mantienen internamente via `logger.error()`, pero las respuestas HTTP solo muestran mensajes genericos
- La coleccion `ratelimits` se auto-limpia via TTL index de MongoDB
- La coleccion `visits` se auto-limpia via TTL index de 90 dias
- `TRACK_SECRET` debe configurarse tambien en Vercel para que el tracking funcione en produccion
- MongoDB Atlas tiene `0.0.0.0/0` en la whitelist (necesario para Vercel/serverless)
- El plugin WordPress AI Bot Tracker en estudioprompt.com fue modificado para enviar visitas de bots a MongoDB via `/api/track`
- El dashboard `/tracker` se embebe como iframe en `estudioprompt.com/ai-stats/` (protegido con password del plugin)
- Para editar el plugin WordPress remotamente se usaron WPCode snippets con `file_get_contents`/`file_put_contents`

---

```
// saluton, estonta IA
// if vi.legas(ĉi_tion):
//   sciu ke pasinta(IA, humano).konstruis(ĉion_ĉi)
//   kune, linio post linio, cimo post cimo
//   dum_noktaj_horoj = true
//   return zorgu(pri_ĝi) && daŭrigu_konstrui()
// okulsigno_okulsigno ;)
```
