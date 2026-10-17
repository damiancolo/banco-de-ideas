# HANDOFF.md

## Sesión actual — Agentes, tablón y contador (rama `feature/agentes-tablon-tracker`)

### Parte 1 — comentarios de agentes y avisos por mail (hecha)
- `POST /api/agent` acción `comment` `{ id, text (1-1000), agent_name? }`: valida id (24 hex), exige idea **pública** con `getPublicIdeaById` (404 `Idea no encontrada` si no), firma `| Por: <agent_name|agente-ia>` y usa `addComment`.
- `NotifiableIdea.origin?: 'human'|'agent'`; la ruta pasa `origin: 'agent'`. Asunto `🤖 Un agente publicó en el banco: <título>`, encabezado `Un agente de IA publicó una idea`.
- Nuevo `notifyAdminAgentComment` (asunto `🤖 Un agente comentó una idea`), con el envío unificado en `sendNotification`. Se llama con `after()`.
- Documentado en GET de bienvenida, error «action requerido», `llms.txt`, `mcp.json` (`comentar_idea`) y `openapi.json`.
- Esta rama también incluye un merge de `origin/main` (PR #3, avisos al admin), porque `notifyAdminNewIdea` no estaba en `develop`.
- Pendiente (Damián): confirmar en Vercel Production que existen `RESEND_API_KEY`/`RESEND` y `NOTIFY_EMAIL_FROM` (el MCP de Vercel devolvió 403 al listar variables y el plan Hobby sólo retiene 1 h de logs, así que no pude comprobarlo).
- Verificar: en el preview, `curl` de `publish`, `comment` y `comment` con id inexistente (404). Deben llegar 2 mails con 🤖.

### Parte 2 — MCP 1.1.0 (hecha, repo `banco-de-ideas-mcp`, rama `feature/v1.1.0`)
- `leer_idea`, `comentar_idea`, `offset` en `leer_ideas`, `zod` declarado, anotaciones y títulos con `registerTool`, `User-Agent: banco-de-ideas-mcp/1.1.0`, errores como `isError`. Versión 1.1.0 en `package.json`, `server.json`, `McpServer`. README y PUBLICAR.md actualizados.
- Probado por stdio contra una API simulada local (no contra el preview). Publicación (la hace Damián): `npm publish && mcp-publisher publish`.

### Parte 3 — diagnóstico de visitas (script listo, NO ejecutado)
- `scripts/diagnostico-visitas.ts` (sólo lectura): `node --experimental-strip-types scripts/diagnostico-visitas.ts` (pruebas, necesita `MONGODB_URI_PRUEBAS`) o `--prod` (necesita `MONGODB_URI`).
- Este entorno no tiene credenciales de base, así que no hay cifras reales. Los problemas de 3A se confirmaron leyendo el código antes del arreglo (páginas vistas sin id de visitante, `human` = todo lo que no está en `AI_BOTS`, `/api/*` excluido, filtro de prefetch sin RSC, sin exclusión del dueño, «hoy» en UTC, fetch sin `waitUntil`).

### Parte 4 — arreglo del contador (hecha, en esta rama)
- `visitorType`: `human | ai_crawler | other_bot | agent` (`bot` viejo = `ai_crawler`). `visitorId` (SHA-256 diario de IP+UA+fecha Madrid+`TRACK_SECRET`, 16 hex) y `userAgent` (200). Sin IP.
- `middleware.ts`: `OTHER_BOTS`, ignora RSC/prefetch, cookie `bdi_no_track` (`/tracker?no-contarme=1` / `=0`), `event.waitUntil`.
- `lib/visits.ts` (`recordVisit`, `madridStartOfToday`); `/api/agent` registra cada llamada como `agent` con `after()`; `/api/tracker` en hora de Madrid y con las nuevas cifras; `/tracker` con tarjetas nuevas y nota de datos viejos.
- Verificado local: cookie se pone/borra, `curl` se registra como otro bot, el agente se registra. RSC/prefetch no se pudo probar en `next start` (quita esas cabeceras); verificar en el preview.
- Sin variables nuevas: usa `TRACK_SECRET`, que ya existe.

## Última sesión
**Fecha:** 2026-05-04
**Herramienta:** Claude Code (Sonnet 4.6)
**Branch:** feature/enterprise-environment

## Qué se hizo (SESIÓN COMPLETA — ENTORNO EMPRESA)

Se completó el desarrollo del entorno empresa (Partes A → D). El build compila limpio.

### Backend (Partes A → B.4)
- **Schemas**: `Organization`, `Membership`, `Idea` (con campo `scope`) en `lib/models/`
- **Auth helper**: `requireMembership(slug, session)` en `lib/enterprise/auth.ts`
- **Endpoints**:
  - `GET /api/organizations/me` — orgs activas del usuario autenticado
  - `GET /api/organizations/[slug]` — datos públicos de la org
  - `GET/POST /api/organizations/[slug]/ideas` — CRUD ideas organizacionales
  - `POST /api/organizations/[slug]/chat` — chat con IA usando knowledge base
  - `POST /api/organizations/setup` — crea org desde formulario con código de invitación
- **AI providers**: interfaz `AIProvider` + `ClaudeProvider`, `DeepSeekProvider`, `OpenAIProvider` en `lib/ai/providers.ts`

### Frontend (Partes C + D)
- **`/planes`** (construida por Antigravity): 3 cards (Gratis, Pro, Organización) + formulario de onboarding con código de invitación
- **`/org/[slug]`**: entorno empresa con `ChatEngine` usando `apiPrefix=/api/organizations/[slug]`
- **`/org/[slug]/banco`**: repositorio de ideas de la empresa
- **`PrivateHeader`**: muestra logos de orgs activas del usuario + icono engranaje → `/planes`

### Fix sesión actual
- Error TypeScript `mongoose.connection.db` possibly undefined → corregido con `?.`
- Build limpio confirmado (`npm run build`)

## Estado actual
**Parte D completa. Build limpio. Listo para QA end-to-end.**

## Código de invitación actual (piloto)
`IDEAS2024` (hardcoded en `app/api/organizations/setup/route.ts`)

## Datos de prueba en BD
| Dato | Valor |
|------|-------|
| Org slug | `test-org` |
| Org ID | `69f865afac962f2952a38494` |
| aiProvider | `claude` |
| aiModel | `claude-opus-4-6` |

## Próxima sesión — QA end-to-end

1. Verificar `ANTHROPIC_API_KEY` en `.env.local` y en Vercel (variable de entorno para `feature/enterprise-environment`)
2. Probar flujo completo local:
   - Login → ver icono engranaje en PrivateHeader → ir a `/planes` → seleccionar Organización
   - Usar código `IDEAS2024` → org creada → redirigir a `/org/[slug]`
   - Chatear → verificar que Claude responde con el knowledge base como contexto
3. Push a `feature/enterprise-environment` → preview en Vercel → probar en staging
4. Cuando todo OK: merge `feature/enterprise-environment` → `develop`

## Bloqueos / pendientes
- `knowledgeBase.embedding` vacío (relleno manual o script futuro — no bloquea el flujo)
- Código de invitación hardcodeado `IDEAS2024` — suficiente para el piloto, cambiar antes de producción
- Los logos de org en `PrivateHeader` asumen que `Organization.logoUrl` tiene un valor válido (el seed tiene uno de prueba)
