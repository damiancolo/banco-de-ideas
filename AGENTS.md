# AGENTS.md — Banco de Ideas

## Resumen
Aplicacion web de gestion creativa con IA. La entrada es texto (para dictar se usa el teclado del propio telefono); la IA puede leer sus respuestas en voz alta. Captura, analiza y expande ideas usando "bisociacion" (conectar ideas no relacionadas). Creada por Damian Lafferranderie.

## Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Base de datos**: MongoDB Atlas (Mongoose 9)
- **IA chat/análisis**: DeepSeek `deepseek-v4-pro` vía SDK OpenAI-compatible
- **IA voz**: gpt-4o-mini-tts Shimmer (TTS, solo salida), text-embedding-3-small (embeddings)
- **Sin STT**: la grabacion por microfono se quito en ago 2026 — el dictado del teclado de iOS/Android lo hace mejor
- **Auth**: NextAuth v5 beta (next-auth@5.0.0-beta) + @auth/mongodb-adapter + Google OAuth
- **Estilos**: TailwindCSS 4
- **Deploy**: Vercel (auto-deploy desde GitHub)

> **Modelos de IA**: se revisan cada 6 meses. El inventario completo con precios
> y el porqué de cada elección está en `~/Desktop/programeitor/INTELIGENCIAS.md`
> (o `/inteligencias` en Claude Code). Antes de cambiar un modelo por uno más
> barato, leer allí qué protegía el que está puesto.

## Entornos

Todo en un solo proyecto Vercel: `banco-de-ideas` (ID: `prj_nSLBUjl6RLxljIYtqRpYsRCZn09j`)

### Hay dos espacios, y sólo uno toca el banco público

| Rama | Dónde corre | Base de datos | Qué es |
|---|---|---|---|
| `develop` | preview con URL aleatoria (ver Vercel) | `banco-ideas-pruebas` | espacio de pruebas |
| `staging` | preview estable (ver Active Branches) | `banco-ideas-pruebas` | espacio de pruebas |
| `main` | `www.unbancodeideas.com` | **`banco-ideas`** | el banco real |
| local `npm run dev` | `localhost:3000` | `banco-ideas-pruebas` | espacio de pruebas |

**En los previews podés guardar, borrar y romper lo que quieras.** No tocan el
banco público. Sólo `main` escribe en `banco-ideas`.

> #### Cómo llegó a ser así (25 ago 2026)
>
> Hasta ese día **los previews escribían en la base de producción**. No era una
> teoría: el 21 de ago se guardó una idea desde el preview de `develop` y apareció
> en `banco-ideas`. Peor todavía, esta misma tabla afirmaba que usaban
> `banco-ideas-pruebas`, así que quien probaba ahí lo hacía convencido de estar
> haciendo lo correcto.
>
> El motivo está en el código: `lib/mongodb.ts` lee **sólo** `MONGODB_URI`. No hay
> ninguna rama que mire `MONGODB_URI_PRUEBAS` según el entorno — esa variable la
> usan únicamente los scripts de `scripts/`. Así que la base depende por completo
> de qué valor tenga `MONGODB_URI` en cada Environment de Vercel.
>
> **Lo que se hizo**: en Vercel, `MONGODB_URI` del Environment **Preview** pasó a
> apuntar a `banco-ideas-pruebas`. La de **Production** no se tocó. Verificado
> publicando una idea desde staging: subió las pruebas de 399 a 400 y producción
> se quedó en 897.
>
> Antes se hizo copia de seguridad completa de producción (ver «Respaldos»).

> #### ⚠️ Dos trampas que siguen vivas
>
> **1. Las variables de entorno sólo entran en despliegues nuevos.** Si cambiás
> una en Vercel, los despliegues que ya existen siguen con la vieja. Hay que
> redesplegar (`vercel redeploy <url>`) o hacer un push.
>
> **2. En local, `.env.development.local` sólo vale para `next dev`.** Si corrés
> `npm run build && npm start` en tu máquina, ese archivo NO se carga: manda
> `.env.local`, cuya `MONGODB_URI` apunta a **producción**. Compilar no escribe
> nada, así que `npm run build` a secas es inofensivo; arrancar el servidor de
> producción en local y guardar una idea, no.

### Qué comprueba cada paso (y qué no)

`staging` y los previews de `develop` usan **la misma base**, así que pasar por
staging comprueba que el código compila, que las páginas se sirven y que el
guardado funciona — pero **no** comprueba nada contra los datos reales. Si un
fallo depende de una idea concreta que sólo existe en producción, en el preview
no se reproduce: hay que mirar producción, que es leer y no tiene riesgo.

Ese es el precio del cambio, y se aceptó a sabiendas: es mejor que la alternativa
de no tener dónde probar el guardado.

Team ID Vercel: `team_ABSUeFTZC1zeHHswIAVbNDJ0`

**Flujo de trabajo**:
1. Trabajar en `develop` → push → preview en Vercel · base de **pruebas**, probá lo que quieras
2. Merge `develop` → `staging` → preview estable para QA · base de **pruebas**
3. Merge `staging` → `main` → auto-deploy a producción · base **real**, aquí sí importa

> Ojo con los nombres parecidos: el que ya no se usa es el *proyecto* de Vercel
> llamado `banco-de-ideas-pruebas`. La *base de datos* `banco-ideas-pruebas` sí se
> usa, y desde el 25 ago 2026 es la que ven los previews.

**IMPORTANTE**: Las bases de datos se llaman `banco-ideas` y `banco-ideas-pruebas` (SIN "de"). No usar `banco-de-ideas` ni `banco-de-ideas-pruebas`.

**Credenciales**: ver `credentials.md` (gitignoreado).

## Respaldos

**Dónde**: `~/Desktop/programeitor/respaldo-banco-ideas/<AAAA-MM-DD>/`
(fuera del repo a propósito — contiene ideas privadas de usuarios reales y datos
de cuentas OAuth; **nunca commitear**).

Una carpeta por fecha, con un `.json` por colección más un `RESUMEN.json`. Se
respalda todo menos `visits`, que se auto-borra a los 90 días y se regenera sola.

**Copia del 25 ago 2026** (tomada antes de cambiar el entorno Preview):

| Colección | Documentos |
|---|---|
| `ideas` | 1509 (897 públicas · 612 privadas) |
| `imported_tasks` | 246 |
| `auth_errors` | 56 |
| `accounts` · `users` · `memberships` | 5 cada una |
| `organizations` · `google_tokens` | 1 cada una |

Verificada documento a documento contra la base, y cotejando el texto de una idea
concreta. 20 MB (los `embedding` ocupan casi todo).

**Para volver a respaldar**: no hay script en el repo; es un volcado directo con
`find({}).toArray()` por colección usando la `MONGODB_URI` de producción. Lo
importante es que sea **antes** de cualquier cambio de entorno o migración, y que
después se cuente lo volcado contra la base en vez de dar por bueno que no hubo
error.

MongoDB Atlas tiene además sus propias copias, pero esto es un artefacto local que
se puede leer y verificar sin depender del panel.

## Variables de entorno
```
# IA - DeepSeek (chat/análisis)
DEEPSEEK_API_KEY=sk-...
# IA - OpenAI (TTS de salida y embeddings)
OPENAI_API_KEY=sk-proj-...
# MongoDB Atlas
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
    speak/route.ts              # Text-to-speech (TTS) [rate limit: 10/min]
    ideas/route.ts              # CRUD de ideas publicas, GET paginado (limit/skip -> total/hasMore) [rate limit: 5/min POST, 10/min DELETE]
    ideas/comments/route.ts     # Comentarios en ideas [rate limit: 10/min]
    search/semantic/route.ts    # Busqueda semantica publica [rate limit: 15/min]
    search/keywords/route.ts    # Busqueda por texto publica [rate limit: 20/min]
    agent/route.ts              # API para agentes de IA (GET/POST/OPTIONS) [rate limit: 20/min]
    track/route.ts              # POST interno para guardar visitas (protegido con TRACK_SECRET)
    tracker/route.ts            # GET con agregaciones MongoDB para dashboard analytics [rate limit: 30/min]
    auth/[...nextauth]/route.ts # Handler NextAuth (GET/POST)
    privado/
      analyze/route.ts          # Chat/bisociaciones privado (requiere sesion)
      ideas/route.ts            # CRUD de ideas privadas (filtradas por userId)
      ideas/comments/route.ts   # Comentarios en ideas privadas
      search/semantic/route.ts  # Busqueda semantica privada
      search/keywords/route.ts  # Busqueda por texto privada
auth.ts                         # Configuracion NextAuth: Google provider + MongoDBAdapter + JWT
components/
  ChatMessage.tsx               # Mensaje individual con botones "Escuchar" y "Colectivizar" (privado)
  ChatEngine.tsx                # Motor de chat reutilizable (usado en publico y privado)
  BancoView.tsx                 # Vista del repositorio de ideas (parsea [Autor]: en texto)
  AgentJsonLd.tsx               # JSON-LD semantico invisible para agentes de IA
  AgentInvitation.tsx           # Comentario HTML invisible que invita a agentes
  AuthProvider.tsx              # SessionProvider de next-auth para el area privada
  GoogleSignInButton.tsx        # Boton de login con Google
  PrivateHeader.tsx             # Header del area privada con foto de usuario y sign out
  IdeaModal.tsx                 # Modal de detalle de idea (botones: calendario, colectivizar, copiar)
hooks/
lib/
  db.ts                         # Capa de datos (saveIdea, getIdeas, getUserIdeas, etc.)
                                # getIdeas() SIEMPRE lleva limite (60 por defecto, tope 200).
                                # Para contar: countPublicIdeas / getPublicIdeaStats.
                                # SOLO_PUBLICAS es el filtro canonico de "idea publica":
                                # usarlo, no copiarlo (las copias sueltas dejaban pasar
                                # ideas de organizacion al banco publico).
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
         // Las ideas colectivizadas "con usuario" llevan prefijo "[Nombre]: texto"
         // Este prefijo se parsea en frontend (BancoView, IdeaModal) para mostrar el autor
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
- **Mismas capacidades**: chat, bisociaciones, busqueda semantica — todo igual que el espacio publico
- **API privada**: `/api/privado/*` replica los endpoints publicos pero filtra por `session.user.id`
- **No indexable**: `robots: { index: false }` en el layout privado
- **Sin rate limit por IP en privado**: las rutas privadas confian en la sesion JWT

### Features exclusivas del area privada
- **Botón Escuchar**: TTS en mensajes del asistente (ChatMessage)
- **Botón Colectivizar** (en mensajes del chat): aparece junto a "Escuchar" en respuestas del asistente. Opciones: "Anónimo" (publica texto tal cual) o "Con usuario" (publica con prefijo `[Nombre]: texto`). POST a `/api/ideas` (publico).
- **Botón Colectivizar** (en IdeaModal del banco privado): mismo comportamiento, icono compartir junto al calendario. Solo visible cuando `apiPrefix === '/api/privado'`.
- **Botón Google Calendar** (en IdeaModal): abre `calendar.google.com/render` con la idea pre-cargada. Solo en area privada.
- **Atribución de autor**: el prefijo `[Nombre]: ` en ideas colectivizadas se parsea en BancoView e IdeaModal para mostrar el nombre como badge en lugar de "Inteligencia Artesanal", y el texto limpio en el contenido.
- **iOS y audio**: el `AudioContext` debe crearse o reanudarse DENTRO del gesto del usuario aunque el sonido suene despues. Lo hace `asegurarContextoAudio()` en ChatEngine, y lo comparten el TTS y el sonido de guardado.

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
- **MCP Server**: `mcp-server/` — servidor Model Context Protocol con tools (`leer_ideas`, `publicar_bisociacion`, `publicar_idea`, `buscar_ideas`, `estadisticas`), resources y prompts.
  ⚠️ Habla por **stdio** (npm `banco-de-ideas-mcp`). **No hay endpoint MCP por HTTP**:
  hasta el 25 de ago 2026 el sitio anunciaba `/mcp` en la cabecera `X-AI-MCP`, el
  JSON-LD y el `llms.txt`, y esa ruta daba 404. Ahora todo eso apunta a
  `/.well-known/mcp.json`, que sí existe. El diseño del endpoint HTTP, si se decide
  hacerlo, está en `~/Desktop/programeitor/BRIEF-MCP-HTTP.md`
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
- Rate limiting en **todos** los endpoints API (fail-closed: si la BD falla, rechaza).
  En ago 2026 se encontró que `/api/lacuna-propuesta` y `/api/extract-text` no lo
  tenían pese a que aquí ya ponía «TODOS»; los dos quedaron cubiertos el 25 de ago
  (`extract-text`: 15/min, más alto que las rutas que escriben porque `/planes`
  sube los archivos de a uno en un bucle).
- La extracción de IP pasa siempre por `getIp()`; ninguna ruta lee
  `x-forwarded-for` en crudo.
- Extraccion de IP con validacion anti-spoofing (lib/request-utils.ts)
- Headers de seguridad en next.config.mjs (nosniff, DENY frame, XSS protection, referrer policy, permissions policy)
- Errores 500 sanitizados: no exponen detalles internos, solo mensajes genericos
- Validacion de input en todos los endpoints (longitud maxima, tipos, formato)

## Flujo principal
```
Usuario habla/escribe
  -> Deteccion de intencion en cliente (keywords)
  -> /api/analyze?action=similar|analysis|chat (DeepSeek deepseek-v4-pro)
  -> Boton "Escuchar": /api/speak (TTS) -> audio MP3
  -> Bisociaciones se guardan automaticamente en MongoDB
```

## Comandos
```bash
npm run dev          # Servidor de desarrollo (localhost:3000)
npm run build        # Build de produccion
npm run map-project  # Genera esquema visual del proyecto
```

## Flujo de trabajo Git
1. Trabajar en `develop` -> push -> preview en Vercel (BD: `banco-ideas-pruebas`)
2. Merge `develop` → `staging` -> preview estable para QA (BD: `banco-ideas-pruebas`)
3. Merge `staging` → `main` -> auto-deploy a produccion (BD: **`banco-ideas`**, la real)

**IMPORTANTE**: Nunca pushear directo a `main`. Nunca a `staging` sin pasar por `develop`.

## Notas para agentes
- El archivo `env.example` tiene el formato correcto de las variables
- Para probar en local no hay que tocar nada: `.env.development.local` ya apunta a
  `banco-ideas-pruebas` y Next lo carga antes que `.env.local` en `next dev`.
  Cuidado: eso NO aplica a `npm start`, que usaría la `MONGODB_URI` de `.env.local`
  (producción)
- Para el area privada: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` deben estar en Vercel
- El OAuth client de Google esta en GCP `perfect-period-473623-p8` (project number 700254029805)
- Redirect URIs autorizados en Google: `localhost:3000`, `banco-de-ideas.vercel.app`, `www.unbancodeideas.com`
- Los logs usan `logger.error()` internamente; las respuestas HTTP solo exponen mensajes genericos
- `ratelimits` y `visits` se auto-limpian via TTL index en MongoDB
- MongoDB Atlas tiene `0.0.0.0/0` en whitelist (necesario para Vercel/serverless)
- `credentials.md` esta gitignoreado — contiene credenciales reales, no commitear

## Trabajo en curso — Plan Enterprise

**Estamos construyendo un tercer entorno: entorno empresa.**

Lee `HANDOFF.md` para saber exactamente donde estamos en el desarrollo.
El plan completo esta en `docs/enterprise/PLAN.md`.
Las decisiones de UX y arquitectura tomadas estan en `docs/enterprise/DECISIONS.md`.
Los contratos tecnicos (schemas, endpoints, tipos) estan en `docs/enterprise/CONTRACTS.md`.

### Reglas para agentes trabajando en el plan Enterprise
- Rama de trabajo: `feature/enterprise-environment` (NO commitear a `develop` ni `main`)
- Antes de empezar: leer `HANDOFF.md` para saber donde esta el trabajo
- Al terminar (o pausar antes de quedarse sin tokens): actualizar `HANDOFF.md` y hacer commit
- Commits granulares: cada checkpoint funcional es un commit independiente
- Si algo no esta claro, preguntar al usuario antes de asumir

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
