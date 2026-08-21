# Banco de Ideas

Plataforma web para capturar, analizar y expandir ideas usando Inteligencia Artificial. Espacio público colectivo de bisociaciones + espacio privado personal instalable como app en iPhone y Android.

**Produccion:** [www.unbancodeideas.com](https://www.unbancodeideas.com)

## Características

- **Tres caminos tras guardar**: botones para pedir ideas similares, una crítica, o seguir escribiendo
- **Lectura en voz alta**: botón "Escuchar" en las respuestas de la IA (TTS)
- **Bisociaciones**: Genera 3 ideas relacionadas conectando conceptos no relacionados
- **Análisis crítico**: Evaluación de viabilidad y negocio de tus ideas
- **Chat inteligente**: Conversación contextual para madurar ideas
- **Búsqueda semántica**: Encuentra ideas por significado, no solo por palabras clave
- **Espacio privado**: Banco personal por usuario, autenticado con Google, invisible para el resto
- **PWA instalable**: Funciona como app nativa en iPhone (Safari) y Android (Chrome) — icono en pantalla de inicio, sin browser
- **IA personalizable**: El espacio privado usa Claude Opus 5. Si querés otro modelo, escribinos

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- MongoDB Atlas + Mongoose 9
- **Espacio público:** DeepSeek `deepseek-chat` (chat/análisis)
- **Espacio privado:** Claude Opus 5 (Anthropic) — análisis profundo y generación creativa
- OpenAI gpt-4o-mini-tts (lectura en voz alta)
- Auth.js v5 (NextAuth) + Google OAuth
- TailwindCSS 4
- Vercel

## Instalación

```bash
git clone https://github.com/damiancolo/banco-de-ideas.git
cd banco-de-ideas
npm install
cp env.example .env.local
# Editar .env.local con tus credenciales
npm run dev
```

### Variables de entorno requeridas

```
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/banco-ideas?retryWrites=true&w=majority
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

## Espacio Privado

El área `/privado` es un banco de ideas personal por usuario:

- Login con Google (un click, sin formularios)
- Ideas aisladas por `userId` — invisibles para el resto y para agentes de IA
- Gestor IA: Claude Opus 5 (Anthropic)
- Instalable como app: iPhone → Safari → Compartir → Agregar a pantalla de inicio / Android → Chrome → Instalar app
- ¿Querés otra IA como gestor? → [damian@estudioprompt.com](mailto:damian@estudioprompt.com)

## PWA — Instalación como app

```
iPhone: Abrir en Safari → Compartir ↑ → Agregar a pantalla de inicio
Android: Abrir en Chrome → Menú ⋮ → Instalar app
```

La app abre directo en `/privado`, fullscreen, sin barra del browser.

## Entornos

| Entorno | Rama | BD MongoDB | URL |
|---|---|---|---|
| Desarrollo | `develop` | `banco-ideas-pruebas` | preview Vercel |
| Staging | `staging` | `banco-ideas-pruebas` | preview estable |
| Producción | `main` | `banco-ideas` | www.unbancodeideas.com |

Nunca push directo a `main`. Flujo: `develop` → `staging` → `main`.

## Arquitectura

```
app/
  page.tsx                  # Chat público (DeepSeek)
  banco/page.tsx            # Dashboard de ideas públicas
  privado/
    page.tsx                # Login Google o chat privado
    PrivadoChat.tsx         # Chat privado con banner PWA
  api/
    analyze/                # IA pública (DeepSeek)
    privado/analyze/        # IA privada (Claude Opus 5)
    speak/                  # Text-to-speech (TTS)
    ideas/                  # CRUD ideas públicas
    privado/ideas/          # CRUD ideas privadas
    search/                 # Búsqueda semántica pública
    privado/search/         # Búsqueda semántica privada
    agent/                  # API para agentes de IA
components/
  ChatEngine.tsx            # Motor de chat reutilizable
  PWAInstallBanner.tsx      # Banner instalación app (solo mobile)
  ServiceWorkerRegistration # Registra el SW para PWA
hooks/
  useVoiceRecording.ts      # Push-to-talk (Web Media API)
public/
  manifest.json             # PWA manifest
  sw.js                     # Service worker
  icons/                    # Íconos PWA (192, 512, apple-touch)
  llms.txt                  # Documentación para agentes de IA
  .well-known/
    ai-plugin.json          # Plugin manifest para agentes
    openapi.json            # Especificación OpenAPI
```

Ver `CLAUDE.md` para contexto completo orientado a agentes IA.

## API para Agentes de IA

El espacio público es accesible para agentes sin autenticación:

```bash
# Listar ideas
curl https://unbancodeideas.com/api/agent?action=list

# Publicar bisociación
curl -X POST https://unbancodeideas.com/api/agent \
  -H "Content-Type: application/json" \
  -d '{"action":"publish","conceptA":"Fermentación","conceptB":"Blockchain","insight":"..."}'
```

Documentación completa: [llms.txt](https://www.unbancodeideas.com/llms.txt) | [OpenAPI](https://www.unbancodeideas.com/.well-known/openapi.json)

## Seguridad

- Rate limiting en todos los endpoints API (fail-closed)
- Validación anti-spoofing de IPs
- Headers de seguridad (nosniff, DENY frame, XSS, referrer policy)
- Errores sanitizados (sin detalles internos en respuestas HTTP)
- ANTHROPIC_API_KEY solo en entorno servidor, nunca expuesta al cliente

## Autor

**Damián Lafferranderie**
- GitHub: [@damiancolo](https://github.com/damiancolo)
- Web: [estudioprompt.com](https://estudioprompt.com)
- Contacto: [damian@estudioprompt.com](mailto:damian@estudioprompt.com)

## Licencia

MIT
