# Banco de Ideas

Aplicacion web para gestionar y expandir ideas usando Inteligencia Artificial. Combina chat conversacional, entrada de voz y text-to-speech para una experiencia fluida de gestion creativa.

**Produccion:** [www.unbancodeideas.com](https://www.unbancodeideas.com)
**Pruebas:** [unbancodeideas.com](https://unbancodeideas.com)

## Caracteristicas

- **Voz completa**: Habla -> Whisper transcribe -> GPT responde -> TTS lee la respuesta
- **Bisociaciones**: Genera ideas relacionadas conectando conceptos no relacionados
- **Analisis critico**: Evaluacion de viabilidad y negocio de tus ideas
- **Chat inteligente**: Conversacion contextual para madurar ideas
- **Busqueda semantica**: Encuentra ideas por significado, no solo por palabras
- **Persistencia en la nube**: Todo se guarda automaticamente en MongoDB Atlas

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- MongoDB Atlas + Mongoose 9
- DeepSeek `deepseek-chat` (chat/análisis) + OpenAI Whisper-1 / TTS-1 (voz)
- TailwindCSS 4
- Vercel

## Instalacion

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
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/banco-ideas?retryWrites=true&w=majority
```

## Entornos

| Entorno | Rama | BD MongoDB | URL |
|---|---|---|---|
| Pruebas | `develop` | `banco-ideas-pruebas` | unbancodeideas.com |
| Produccion | `main` | `banco-ideas` | www.unbancodeideas.com |

Nunca push directo a `main`. Todo pasa primero por `develop`, se verifica, y se mergea via PR.

## Arquitectura

```
app/
  page.tsx              # Chat principal
  banco/page.tsx        # Dashboard de ideas
  api/
    analyze/            # IA (chat, bisociaciones, analisis)
    transcribe/         # Speech-to-text (Whisper)
    speak/              # Text-to-speech (TTS)
    ideas/              # CRUD de ideas + comentarios
    search/             # Busqueda semantica y por keywords
components/             # ChatMessage, BancoView
hooks/                  # useVoiceRecording (push-to-talk)
lib/                    # DB, modelos, rate limiting, utilidades
```

Ver `ARQUITECTURA.md` para documentacion detallada de componentes y decisiones tecnicas.
Ver `CLAUDE.md` para contexto completo orientado a agentes IA.

## Seguridad

- Rate limiting en todos los endpoints API (fail-closed)
- Validacion anti-spoofing de IPs
- Headers de seguridad (nosniff, DENY frame, XSS, referrer policy)
- Errores sanitizados (sin detalles internos en respuestas HTTP)
- Variables de entorno protegidas via .gitignore

## Autor

**Damian Lafferranderie**
- GitHub: [@damiancolo](https://github.com/damiancolo)
- Web: [estudioprompt.com](https://estudioprompt.com)

## Licencia

MIT
