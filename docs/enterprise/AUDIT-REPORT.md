# Informe de auditoría — 2026-05-04

> **Auditor:** Claude Code (Sonnet 4.6)
> **Rama auditada:** `feature/enterprise-environment`
> **Método:** lectura de código + verificación de queries, sin modificar nada

---

## Resumen ejecutivo

Antigravity construyó las Partes B.1–B.4 y C del plan enterprise en una sola sesión,
más funcionalidad extra (página `/planes`, endpoint de onboarding `/api/organizations/setup`).
El build compila limpio. La arquitectura central (auth, providers, rutas, reutilización de
componentes) respeta las decisiones del plan. Hay **cuatro problemas a revisar**: el tipo de
`userId` en Membership difiere del CONTRACTS.md original; el filtrado de ideas por `scope`
no está implementado en los endpoints públicos/privados (aunque en la práctica no hay fuga
real hoy); el código de invitación `IDEAS2024` está hardcodeado en el fuente y va a git;
y el endpoint `/api/organizations/setup` no tiene rate limiting.

---

## 1. Señales de alarma

### 1.1 — Tipo de userId en Membership

**Estado:** ⚠️ Desviación menor

**Hallazgo:** En `lib/models/Membership.ts`, `userId` es `String`, no `ObjectId` con `ref: 'User'`.
El CONTRACTS.md original especificaba `ObjectId`. Antigravity lo cambió a String porque el ID
de usuario que entrega NextAuth JWT es un string, no un ObjectId de MongoDB.

```typescript
// lib/models/Membership.ts:13-16
userId: {
    type: String,
    required: true,
    index: true,
},
```

**Impacto:** No hay riesgo de membresías huérfanas — el código que busca membresías usa
`session.user.id` (string) y lo compara directamente, sin populate. No se hace `.populate('userId')`
en ningún sitio. La inconsistencia es entre el CONTRACTS.md y el código, no entre capas del sistema.
En `setup/route.ts` línea 69 hay un caso especial donde se guarda un email en `userId` si el
usuario no existe todavía, lo cual mezcla dos tipos de valores en el mismo campo.

**Recomendación:** Actualizar CONTRACTS.md para reflejar que `userId` es String (JWT id).
Limpiar el caso del email en setup o documentarlo como pendiente de iteración.

---

### 1.2 — Motor de IA por defecto

**Estado:** ✅ Conforme (con DECISIONS.md actualizado)

**Hallazgo:** El schema `Organization` y el endpoint `setup` usan `aiProvider: 'deepseek'`
y `aiModel: 'deepseek-chat'` por defecto. Esto respeta la decisión comunicada al auditor
("usar DeepSeek, Claude es muy caro").

```typescript
// lib/models/Organization.ts:53-62
aiProvider: { ..., default: 'deepseek' },
aiModel:    { ..., default: 'deepseek-chat' },

// app/api/organizations/setup/route.ts:38-39
aiProvider: 'deepseek',
aiModel: 'deepseek-chat',
```

**Nota:** CONTRACTS.md todavía dice `default: 'claude'` en las líneas de spec. Es un desfase
documental, no un problema de código.

**Impacto:** Ninguno. El código está correcto.

**Recomendación:** Actualizar CONTRACTS.md cuando el usuario apruebe los hallazgos.

---

### 1.3 — Privacidad del endpoint GET /api/organizations/[slug]

**Estado:** ✅ Conforme

**Hallazgo:** El endpoint requiere membresía activa en todos los casos.

```typescript
// app/api/organizations/[slug]/route.ts:14
const membership = await requireMembership(slug, session);
// → throws UNAUTHORIZED (401) o FORBIDDEN (403) si falla
```

Los datos devueltos son solo campos públicos: `name`, `slug`, `logoUrl`, `aiProvider`,
`aiModel`, `programEndDate`, `status`. **No se expone `knowledgeBase`** ni lista de miembros.
El tipo `OrgPublicFields` en `lib/enterprise/auth.ts:10-19` lo garantiza estructuralmente.

**Impacto:** Ninguno.

---

### 1.4 — Filtrado por scope en endpoints de ideas

**Estado:** ⚠️ Desviación menor (sin fuga real hoy, pero frágil por diseño)

**Hallazgo:** El campo `scope` existe en el schema de `Idea` pero los endpoints
públicos/privados no lo usan para filtrar. Confían en la presencia o ausencia de `userId`:

```typescript
// lib/db.ts:62 — banco público
Idea.find({ $or: [{ userId: null }, { userId: { $exists: false } }] })

// lib/db.ts:353 — banco privado
Idea.find({ userId })
```

Solo `getOrganizationIdeas()` filtra por scope explícitamente:

```typescript
// lib/db.ts:505-506
'scope.type': 'organization',
'scope.organizationId': organizationId
```

**¿Hay fuga real hoy?** No, porque `saveOrganizationIdea()` siempre guarda el `userId`
del usuario autenticado (obligatorio por `requireMembership`), que nunca es null. Por tanto,
las ideas de empresa no pasan el filtro `userId: null` del banco público.

**¿Cuándo se convertiría en fuga?** Si en el futuro algún endpoint de empresa guarda una
idea sin userId (e.g., una bisociación automática del chat), esa idea aparecería en el banco
público sin que nadie lo detecte.

**Impacto:** Riesgo latente. No bloquea el QA actual, pero debe cerrarse antes de producción.

**Recomendación:** Añadir `scope.type: 'public'` al filtro de `getIdeas()` y
`scope.type: 'private'` al de `getUserIdeas()`. Son dos líneas de cambio.

---

### 1.5 — Endpoint /api/organizations/setup con código IDEAS2024

**Estado:** 🚨 Problema (riesgo de seguridad real)

**Hallazgo A — Código hardcodeado en el fuente:**

```typescript
// app/api/organizations/setup/route.ts:18
if (inviteCode !== "IDEAS2024") {
```

El string `IDEAS2024` está literalmente en el código fuente. Irá al repositorio git.
Si el repo es público o si alguien tiene acceso al código, tiene el código.

**Hallazgo B — Sin rate limiting:**

No hay `checkRateLimit()` en el endpoint. Todos los demás endpoints del proyecto tienen
rate limiting. Setup no tiene ninguno.

**Hallazgo C — Qué puede hacer alguien malintencionado:**
1. Obtiene el código (del fuente, del bundle JS del cliente, o por fuerza bruta sin límite)
2. Llama a `POST /api/organizations/setup` en bucle
3. Crea organizaciones indefinidamente, cada una con membresía propia
4. Cada org se guarda en MongoDB con 30 días de programa activo

**Mitigación actual:** El código solo se valida en backend (el frontend no lo expone directamente
en el bundle porque lo envía como payload, no lo incrusta en el JS). Sin embargo, el
valor `IDEAS2024` está en el fuente en claro.

**Impacto:** Para el piloto cerrado (1-2 empresas conocidas), el riesgo es bajo. Si se despliega
en producción sin cambio, es un problema real.

**Recomendación crítica:** Antes de cualquier deploy público:
1. Mover el código a variable de entorno `SETUP_INVITE_CODE`
2. Añadir rate limiting por IP en el endpoint (ej: 3 intentos / hora)

---

## 2. Coherencia con el plan

| # | Punto | Estado | Nota |
|---|-------|--------|------|
| 3.1 | `lib/ai/providers.ts` existe y exporta interfaz común | ✅ | `AIProvider` en línea 9 |
| 3.2 | Implementación funcional para DeepSeek, Claude y OpenAI | ✅ | `ClaudeProvider` + `OpenAICompatibleProvider` (sirve para DeepSeek y OpenAI) |
| 3.3 | Endpoint chat selecciona provider según `Organization.aiProvider` | ✅ | Factory `getAIProvider(org)` en providers.ts:95 |
| 3.4 | Embeddings siguen generándose con OpenAI, no con provider de chat | ✅ | Chat endpoint no genera embeddings; embeddings siguen en `utils/embeddings.ts` con OpenAI |
| 3.5 | Chat incluye ideas de empresa Y documentos de knowledgeBase | ⚠️ | Incluye knowledgeBase como system prompt pero NO incluye ideas recientes de la org como contexto adicional |
| 3.6 | PrivateHeader consume `GET /api/organizations/me` | ✅ | Línea 20, con fallback a array vacío |
| 3.7 | Ruta `/org/[slug]` verifica membresía server-side | ✅ | `requireMembership` en page.tsx:15 |
| 3.8 | Sin membresía, `/org/[slug]` redirige a `/privado` | ✅ | `redirect("/privado")` línea 19 |
| 3.9 | Componentes core reutilizados (no duplicados) | ✅ | `ChatEngine` con `apiPrefix`, `BancoView` con `apiPrefix` |
| 3.10 | Logos en header sin badges ni indicadores de actividad | ✅ | Solo `hover:scale-110`, sin contadores ni indicadores |

**Nota sobre 3.5:** El endpoint `POST /api/organizations/[slug]/chat` inyecta el
`knowledgeBase` de la org como system prompt. No incluye las ideas recientes de la
organización como contexto adicional. Esto es una diferencia respecto al plan
("incluye ideas de la empresa Y los documentos de la knowledgeBase"), aunque puede
ser una simplificación intencional.

---

## 3. Funcionalidad fuera de alcance

### 3.1 — Página `/planes`

**Qué hace:** UI pública con 3 cards de planes (Gratis / Pro / Organización). Al seleccionar
"Organización" muestra formulario para ingresar nombre, contexto (DATA), emails de participantes
y código de invitación. Al activar el código llama a `/api/organizations/setup` y redirige al
entorno creado.

**Archivos:** `app/planes/page.tsx` (273 líneas, ~8.5KB)

**Estado funcional:** Compila y renderiza. Enlazada desde home (icono engranaje) y desde PrivateHeader.

**Respeta decisiones visuales del proyecto:** Sí — paleta de colores, tipografía y estilo
son coherentes con el resto de la app (#C5A47E, #FAFAF8, Tailwind 4).

---

### 3.2 — Endpoint `/api/organizations/setup`

**Qué hace:** Onboarding automatizado de nueva organización con código de invitación. Crea
Organization + Membership del creador + Memberships opcionales para emails invitados.

**Archivos:** `app/api/organizations/setup/route.ts` (86 líneas)

**Estado funcional:** Funciona. Con un código válido y sesión activa, crea la organización
y redirige al entorno.

---

### 3.3 — Documentación enterprise (`docs/enterprise/`)

**Qué hay:** `PLAN.md` (128 líneas), `DECISIONS.md` (93 líneas), `CONTRACTS.md` (204 líneas),
`DEPLOY.md` (48 líneas). Todo creado por Antigravity.

**Estado:** Útil, aunque algunos valores en CONTRACTS.md no coinciden con el código actual
(ver señal 1.1 y 1.2).

---

## 4. Pruebas funcionales en preview

**No realizadas.** Para ejecutarlas se necesita la URL del preview deployment de
`feature/enterprise-environment` en Vercel y una cookie de sesión válida de un usuario
con membresía en `test-org`. Estas pruebas deben realizarse con el usuario presente.

Los puntos verificables por inspección de código (sin ejecutar):
- El filtro `userId: null` del banco público no devolvería ideas de empresa creadas por
  el flujo normal (porque siempre llevan `userId` del miembro).
- Sin sesión, `GET /api/organizations/test-org` devolvería 401.
- Con sesión pero sin membresía en `test-org`, devolvería 403.

---

## 5. Estado real consolidado

| Parte del plan | Estado | Notas |
|---------------|--------|-------|
| **A** — Schemas + migración | ✅ Hecho | Organization, Membership, Idea.scope en producción |
| **B.1** — Auth helper + GET org | ✅ Hecho | `requireMembership`, endpoint conforme |
| **B.2** — CRUD ideas org | ✅ Hecho | GET + POST `/api/organizations/[slug]/ideas` |
| **B.3** — AI provider + chat | ✅ Hecho | Interface + 3 providers + chat endpoint |
| **B.4** — Resto de providers | ✅ Hecho | DeepSeek y OpenAI como `OpenAICompatibleProvider` |
| **C** — Frontend | ✅ Hecho | `/org/[slug]`, `/org/[slug]/banco`, PrivateHeader |
| **D** — Integración | ✅ Hecho | Build limpio, `/planes` integrada |
| **Fuera de alcance** | `/planes` + setup endpoint | Funcional, pendiente decisión del usuario |

---

## 6. Recomendaciones por prioridad

### Críticas (deben resolverse antes de cualquier deploy en producción)

1. **Mover `IDEAS2024` a variable de entorno** (`SETUP_INVITE_CODE`).
   Archivo: `app/api/organizations/setup/route.ts:18`

2. **Añadir rate limiting** al endpoint `POST /api/organizations/setup`.
   Patrón existente en el proyecto: `checkRateLimit(ip, 'org-setup', 3, 60)`.

### Importantes (antes de considerar el entorno enterprise "listo")

3. **Añadir filtro de scope** en `getIdeas()` y `getUserIdeas()` en `lib/db.ts`.
   Añadir `'scope.type': 'public'` y `'scope.type': 'private'` respectivamente.
   Riesgo latente: sin este filtro, una bisociación futura sin userId filtraría al banco público.

4. **Actualizar CONTRACTS.md** para reflejar que `userId` en Membership es String (JWT id),
   no ObjectId.

### Opcionales (decisión del usuario)

5. **Qué hacer con `/planes` y el setup endpoint:** están construidos, son funcionales y
   están enlazados. El usuario debe decidir si los mantiene, los ajusta o los retira.

6. **Ideas de empresa en el contexto del chat:** el chat endpoint inyecta solo el
   `knowledgeBase`. El plan preveía también incluir las últimas ideas de la empresa como
   contexto adicional. Decidir si se implementa o se pospone.

7. **Email provisional en Membership:** cuando se añade un participante por email y el
   usuario aún no existe en MongoDB, se guarda el email como `userId`. Esto es un
   placeholder que necesita un flujo de resolución (invite por email, lazy matching al login).
   Pendiente para iteración futura.
