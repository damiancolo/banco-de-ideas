# Plan: Importador de ideas desde Google Tasks

> **Estado: IMPLEMENTADO** en `develop` (jul 2026). Gateado al owner (`damianlafferranderie@gmail.com`): la opción "📥 Importar del Task" solo aparece en el menú "+" de /privado para ese email, y la API rechaza a cualquier otro (403).
>
> **Autorización incremental**: el login normal NO cambió (se revirtió el scope global en `auth.ts`). Los demás usuarios de /privado no ven ningún permiso nuevo. Solo el owner, al usar "Importar del Task", pasa una vez por el consent de `tasks.readonly` vía `/api/privado/google-tasks/connect` → `/callback`, que guarda los tokens en la colección `google_tokens`.
>
> **Pasos manuales pendientes del owner** (sin esto el consent falla con redirect_uri_mismatch):
> 1. Habilitar **Google Tasks API** en GCP `perfect-period-473623-p8`.
> 2. Registrar el **redirect URI** en el OAuth client de Google (Authorized redirect URIs):
>    - `https://www.unbancodeideas.com/api/privado/google-tasks/callback` (producción)
>    - la URL de preview de Vercel + `/api/privado/google-tasks/callback` (si se prueba en preview)
>    - `http://localhost:3000/api/privado/google-tasks/callback` (local)
>
> Archivos: `lib/owner.ts`, `lib/models/GoogleToken.ts`, `lib/models/ImportedTask.ts`, `lib/models/Idea.ts` (campos `source`/`originalText`/`similarTo`), `lib/google/tasks.ts`, `lib/ai/develop-idea.ts`, `lib/db.ts` (`savePrivateIdeaFromTask`, `getSimilarityCorpus`), `app/api/privado/importar-tasks/route.ts`, `app/api/privado/google-tasks/connect/route.ts`, `app/api/privado/google-tasks/callback/route.ts`, `components/ChatEngine.tsx` (`extraMenuOptions`), `app/privado/PrivadoChat.tsx`, `app/privado/page.tsx`. `auth.ts` quedó SIN cambios.
>
> **Nota de implementación**: los tokens de Google viven en `google_tokens` (Mongo), obtenidos por el flujo incremental y refrescados de forma perezosa en `lib/google/tasks.ts` — nunca se exponen al cliente. Las ideas privadas se identifican por `userId` (no por `scope`), consistente con el resto del área privada. Al volver del consent (`?tasks=connected`), `PrivadoChat` dispara la importación sola.
>
> ---
>
> Spec original de implementación abajo. Público: agente constructor (Sonnet 5). El contexto general del proyecto está en `CLAUDE.md`. Rama `develop`, probar contra BD `banco-ideas-pruebas`.

## 1. Objetivo

Botón en el área privada que lee las Google Tasks del usuario autenticado, transforma cada entrada en una idea desarrollada usando DeepSeek, y las guarda como **ideas privadas** del usuario. El usuario luego revisa y colectiviza con el botón existente. Las tasks en Google quedan **intactas** (scope readonly).

## 2. Decisiones cerradas (no re-discutir)

| Tema | Decisión |
|---|---|
| Autonomía | El agente propone; el usuario aprueba/colectiviza manualmente después |
| Destino | Ideas privadas (`userId` del usuario), nunca directo al banco público |
| Disparo | Manual (botón), sin cron |
| Filtro | **Inclusivo**: se transforma TODO salvo exclusiones deterministas (ver §6) |
| Versiones | Se guardan ambas: texto original de la task + versión desarrollada por IA |
| Duplicados | Se marcan ("parecida a X"), nunca se descartan por similitud |
| Tasks en Google | Quedan intactas. Scope `tasks.readonly`. Sin escritura |
| Idempotencia | Registro de tasks ya procesadas; re-ejecutar no duplica |

## 3. Fuera de alcance

- Cron / ejecución automática
- Escritura en Google Tasks
- Publicación automática al banco público
- Edición inline de la idea antes de guardar (el usuario edita después si quiere)

## 4. Cambios en autenticación (`auth.ts`)

Hoy: Auth.js v5, provider Google, estrategia JWT, sin persistencia de tokens de Google. Cambios:

```ts
Google({
  // ...config existente (client_secret_post)...
  authorization: {
    params: {
      scope: "openid email profile https://www.googleapis.com/auth/tasks.readonly",
      access_type: "offline",
      prompt: "consent",
    },
  },
})
```

En `callbacks.jwt`:
- Primer login (`account` presente): guardar `access_token`, `refresh_token`, `expires_at` en el token JWT.
- Llamadas siguientes: si `Date.now() > expires_at * 1000`, refrescar contra `POST https://oauth2.googleapis.com/token` con `grant_type=refresh_token`, `client_id=AUTH_GOOGLE_ID`, `client_secret=AUTH_GOOGLE_SECRET`. Si el refresh falla, setear `token.error = "RefreshTokenError"`.

**No exponer los tokens en el `session` callback** (llegarían al cliente). En las API routes del servidor, leer el JWT crudo con `getToken` de `next-auth/jwt` (pasando `secret: process.env.AUTH_SECRET`) para obtener `accessToken`. Si `getToken` da problemas con la versión beta instalada, alternativa aceptable: persistir los tokens de Google en una colección propia `GoogleToken { userId, accessToken, refreshToken, expiresAt }` y leerlos server-side.

**Pasos manuales del owner (no del constructor)** — dejarlos anotados en el PR:
1. Habilitar **Google Tasks API** en el proyecto GCP `perfect-period-473623-p8`.
2. Cerrar sesión y volver a loguearse para otorgar el scope nuevo (el token viejo no lo tiene).

## 5. Lectura de Google Tasks

REST directo con `fetch` + Bearer token (no agregar SDK de Google, es innecesario):

- `GET https://tasks.googleapis.com/tasks/v1/users/@me/lists` → todas las listas.
- Por cada lista: `GET https://tasks.googleapis.com/tasks/v1/lists/{listId}/tasks?showCompleted=true&showHidden=true&maxResults=100` — paginar con `pageToken` hasta agotar.
- Campos relevantes de cada task: `id`, `title`, `notes`, `due` (RFC3339), `status`, `updated`.
- Se incluyen tasks completadas (una idea anotada y "tachada" sigue siendo una idea).

## 6. Filtro determinista (exclusiones)

Regla del owner: *"todo lo que pueda, transformalo en idea; dejá afuera solo lo que sea una sola palabra o una acción con fecha y hora"*.

Excluir (sin llamar a la IA):
1. `title` vacío tras `trim()`.
2. `due` presente → es una acción agendada, no una idea.
3. Una sola palabra: `title.trim()` sin espacios **y** `notes` vacío. (Si tiene `notes`, hay contenido: se procesa concatenando `title + "\n" + notes`.)
4. Ya procesada: existe registro en `importedtasks` para `(userId, taskId)`.

Escape de la IA (ver prompt §7): si una entrada pasa el filtro pero es puro trámite sin semilla conceptual (ej. "comprar leche sin lactosa"), el modelo puede devolver `descartar`. Estas se reportan al usuario como excluidas con razón — **nada se descarta en silencio**.

## 7. Transformación con DeepSeek

Modelo: `deepseek-v4-pro` vía el cliente OpenAI-compatible existente (ver `lib/ai/providers.ts` y `DEEPSEEK_API_KEY`). Una llamada por task (no batchear varias tasks en un prompt: degrada calidad y complica el parseo). `response_format: { type: "json_object" }` si el SDK lo soporta; si no, parsear con tolerancia (extraer primer bloque `{...}`).

System prompt (usar tal cual, ya validado con el owner):

```
Sos el curador del Banco de Ideas (unbancodeideas.com), un repositorio orientado a
encontrar ideas "metanoicas simbióticas": ideas que (1) corren el paradigma —
cambian la manera de mirar un problema, no solo lo optimizan — y (2) son
simbióticas — mutualistas, regenerativas, de bien común; suman al tejido
humano-humano, humano-naturaleza o humano-IA.

Recibís una entrada cruda de la lista de tareas personal del autor. Puede ser
telegráfica (pocas palabras). Tu trabajo:
1. Interpretá la semilla con generosidad: ¿qué idea podría llegar a ser?
2. Desarrollala en 2-4 oraciones como idea del banco, en español, voz clara y
   concreta, sin tono de marketing.
3. Mantené la intención original; no inventes un proyecto distinto.
4. Solo si la entrada es un trámite puro sin ninguna semilla conceptual posible,
   descartala.

Respondé SOLO JSON, sin texto adicional:
{"idea": "<texto desarrollado>"}  o  {"descartar": "<razón breve>"}
```

User message: el texto crudo (`title` + `notes` si existe).

## 8. Similitud (marcar, no filtrar)

Para cada idea desarrollada:
1. Generar embedding con `text-embedding-3-small` (reusar `lib/utils/embeddings.ts`).
2. Comparar (cosine, helper existente) contra: ideas públicas + ideas privadas del usuario. Cargar embeddings con proyección explícita (están excluidos por defecto en los queries — ver schema).
3. Guardar hasta 3 matches con similitud ≥ 0.80 en `similarTo`.

## 9. Modelo de datos

### `Idea` (extender schema existente — campos opcionales, no rompen nada)

```ts
source?: { type: String, enum: ['google-tasks'] },
sourceTaskId?: String,
originalText?: String,          // texto crudo de la task
similarTo?: [{ idea: { type: ObjectId, ref: 'Idea' }, similarity: Number }],
```

El campo `text` lleva la versión desarrollada. `category: 'user'`, `userId` del usuario, embedding como cualquier idea.

### Nueva colección `ImportedTask`

```ts
{
  userId: String (required),
  taskId: String (required),
  listId: String,
  outcome: { type: String, enum: ['imported', 'excluded'] },
  reason: String,               // para excluded: 'due' | 'single-word' | 'ai-descartada: <razón>'
  ideaId: ObjectId,             // para imported
  processedAt: Date,
}
// índice único compuesto { userId: 1, taskId: 1 } → idempotencia
```

## 10. Endpoint

`POST /api/privado/importar-tasks` — requiere sesión (mismo patrón que el resto de `/api/privado/*`).

Request body: `{ dryRun?: boolean }`

Comportamiento:
- `export const maxDuration = 60` (Vercel). Procesar en lotes de **10 tasks por invocación** (las llamadas a DeepSeek son secuenciales, ~2-4 s c/u). Si quedan más, devolver `remaining > 0`; el cliente re-invoca en loop hasta `remaining === 0`.
- `dryRun: true`: ejecuta todo el pipeline pero **no escribe** ni en `ideas` ni en `importedtasks`. Devuelve las propuestas. (Nota: en dryRun el "remaining" se calcula igual pero las mismas tasks reaparecerán en la siguiente corrida real — es esperado.)
- Flujo por invocación:
  1. `getToken` → accessToken (refrescar si venció). Si falta scope/token → `401 { error: 'reauth' }` (el cliente muestra "cerrá sesión y volvé a entrar").
  2. Fetch listas + tasks (§5).
  3. Filtro determinista (§6); registrar exclusiones en `importedtasks` (salvo dryRun).
  4. Para el lote: DeepSeek (§7) → embedding + similitud (§8) → insertar `Idea` + `ImportedTask` (salvo dryRun).
  5. Errores por task individuales (DeepSeek caído, JSON inválido tras 1 retry): **no** registrar en `importedtasks` (así se reintenta en la próxima corrida) y reportar en `errors`.

Response:

```json
{
  "processed": 10,
  "remaining": 23,
  "imported": [{ "ideaId": "...", "original": "...", "idea": "...", "similarTo": [{ "text": "...", "similarity": 0.83 }] }],
  "excluded": [{ "original": "...", "reason": "due" }],
  "errors":   [{ "original": "...", "error": "..." }]
}
```

Sin rate limit por IP (área privada, consistente con el resto de `/api/privado/*`).

## 11. UI

1. **Botón "Importar del Task"** en `app/privado/banco/page.tsx` (dashboard privado). Al click: loop de POSTs mostrando progreso ("Procesando… 10/33"), luego resumen (importadas / excluidas / errores). Estética existente (gold/beige `#C5A47E` / `#F8F5F0`).
2. **Badge "Del task"** en las cards del banco privado cuando `source === 'google-tasks'` (la API privada de ideas debe incluir los campos nuevos en la respuesta).
3. **`IdeaModal`** (solo área privada): si `originalText` existe, sección colapsable "Original del task" mostrando el texto crudo, con botón "Copiar". Si `similarTo` no vacío: línea "≈ parecida a: «{texto truncado 80 chars}» ({similarity}%)" por cada match.
4. El flujo de colectivizar no cambia: opera sobre `text` (la versión desarrollada). Si el usuario prefiere la original, la copia y edita — no construir un selector de versiones.

## 12. Fases y criterios de aceptación

**F0 — OAuth + lectura.**
Scope, persistencia y refresh de tokens (§4). Ruta temporal `GET /api/privado/tasks-debug` que devuelve `{ lists: [{ title, count }] }` del usuario logueado.
✅ Acepta: con sesión re-otorgada, la ruta lista las listas reales del usuario. Borrar la ruta debug al final de F2.

**F1 — Pipeline en dryRun.**
Endpoint completo (§10) con `dryRun: true`: filtro, DeepSeek, similitud, sin escritura.
✅ Acepta: una corrida sobre las tasks reales devuelve `imported[]` con original/idea coherentes, `excluded[]` con razones correctas (due / single-word / ai-descartada), sin escribir en Mongo.

**F2 — Persistencia + UI.**
Escritura real, idempotencia, botón, badge, modal.
✅ Acepta: (a) correr dos veces no duplica ideas; (b) las ideas aparecen en el banco privado con badge y original visible en el modal; (c) colectivizar una funciona con el flujo existente; (d) `npm run build` pasa.

## 13. Notas operativas

- Rama `develop`, nunca directo a `staging`/`main`. Commits granulares por fase.
- Probar local con `MONGODB_URI` apuntando a `banco-ideas-pruebas`.
- Sin variables de entorno nuevas (reusa `AUTH_GOOGLE_*`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`).
- Redirect URIs de Google ya configurados; el scope nuevo no requiere URIs adicionales.
- Si Google exige verificación de app por el scope: `tasks.readonly` es sensible pero funciona en modo testing para el propio owner; no bloquear el desarrollo por esto.
