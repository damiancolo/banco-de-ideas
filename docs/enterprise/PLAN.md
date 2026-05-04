# Plan de construcción — Entorno Empresa

## Visión general
Construir un tercer entorno (entorno empresa) para clientes del plan Enterprise.
Los usuarios invitados a un programa de empresa acceden a un entorno corporativo privado con la misma UI
que ya conocen, pero con ideas y contexto de IA específicos de su organización.

Stack añadido al proyecto para Enterprise:
- **IA**: Claude Opus 4.6 (`claude-opus-4-6`) vía `@anthropic-ai/sdk` — motor configurable por organización
- **BD enterprise dev**: `banco-ideas-enterprise-dev` (mismo cluster Atlas, BD separada)
- **Variable nueva**: `ANTHROPIC_API_KEY` — necesaria desde Parte B.3

---

## Parte A — Base de datos
**Objetivo:** schemas, migración de ideas existentes y script de seed.
**Rama:** `feature/enterprise-environment`
**BD de trabajo:** `banco-ideas-enterprise-dev`

### Tareas
1. Crear `lib/models/Organization.ts` — schema Mongoose para organizaciones Enterprise
2. Crear `lib/models/Membership.ts` — schema Mongoose para la relación N:M User ↔ Organization
3. Modificar `lib/models/Idea.ts` — añadir campo `scope` (`public` | `private` | `organization`) y `organizationId`
4. Script de migración: asignar `scope` a ideas existentes (`public` para ideas sin userId, `private` para las que tienen userId)
5. Script de seed: crear organización de prueba con un miembro y knowledge base de ejemplo

### Checkpoint funcional
Poder consultar `Organization` y `Membership` en MongoDB Atlas. El script de seed termina sin error.

### Commit esperado
`feat(enterprise/A): Organization + Membership schemas, Idea scope migration, seed script`

---

## Parte B — Backend completo
**Objetivo:** todos los endpoints del entorno empresa funcionando.

### B.1 — Auth helpers + endpoint de organización
**Sin IA. Verificable con curl.**

Tareas:
- Crear `lib/enterprise/auth.ts` — helper `requireMembership(req, slug)` que verifica sesión + membresía activa
- Endpoint `GET /api/organizations/[slug]` — devuelve datos de la organización si el usuario es miembro

Checkpoint: `curl -H "Cookie: ..." /api/organizations/[slug]` devuelve datos de la org.

Commit: `feat(enterprise/B1): auth helper requireMembership + GET /api/organizations/[slug]`

### B.2 — CRUD de ideas organizacionales
**Sin IA. Verificable con curl.**

Tareas:
- `GET /api/organizations/[slug]/ideas` — lista ideas con `scope: "organization"` + `organizationId` de la org
- `POST /api/organizations/[slug]/ideas` — crea idea con ese scope (requiere membresía)

Checkpoint: crear y listar ideas de la org con curl.

Commit: `feat(enterprise/B2): CRUD ideas organizacionales`

### B.3 — Capa de abstracción de IA + endpoint chat (Claude)
**PUNTO FRÁGIL: si se queda sin tokens en medio, descartar trabajo no commiteado y reempezar B.3 entera.**

Tareas:
- Crear `lib/ai/providers.ts` — interfaz común `AIProvider` con método `chat(messages, context)`
- Implementar `ClaudeProvider` usando `@anthropic-ai/sdk` (`claude-opus-4-6`)
- Endpoint `POST /api/organizations/[slug]/chat` — usa el provider según `Organization.aiProvider`
- Instalar `@anthropic-ai/sdk` si no está en dependencies

Checkpoint: chat funcionando con Claude vía curl, usando knowledge base de la org como contexto.

Commit: `feat(enterprise/B3): AIProvider interface + ClaudeProvider + chat endpoint`

### B.4 — Resto de providers
Tareas:
- Implementar `DeepSeekProvider` (reutiliza config de `lib/constants.ts`)
- Implementar `OpenAIProvider` (reutiliza config existente)
- El endpoint de chat de B.3 ya selecciona el provider según `Organization.aiProvider`

Checkpoint: cambiar `aiProvider` en seed y verificar que el mismo endpoint responde con DeepSeek u OpenAI.

Commit: `feat(enterprise/B4): DeepSeekProvider + OpenAIProvider`

---

## Parte C — Frontend
**Objetivo:** UI del entorno empresa funcionando.

### Tareas
1. En `PrivateHeader.tsx`: mostrar logos de organizaciones activas del usuario (junto al icono home)
2. Crear ruta `/org/[slug]/page.tsx` — verifica membresía, renderiza el entorno empresa
3. Reutilizar `ChatEngine.tsx` con `apiPrefix="/api/organizations/[slug]"`
4. Reutilizar `BancoView.tsx` para las ideas de la organización
5. Identidad visual mínima: logo de la empresa en el header del entorno empresa

### Checkpoint funcional
Navegar la UI completa contra los endpoints reales: ver logos en privado → entrar al entorno empresa → publicar idea → chatear con IA con knowledge base.

Commit: `feat(enterprise/C): frontend entorno empresa`

---

## Parte D — Integración + ajustes
**Objetivo:** flujo end-to-end probado.

### Tareas
1. Ejecutar script de seed con un usuario real (el usuario del piloto)
2. Probar flujo completo: login → ver logo en privado → entrar → publicar idea → chatear
3. Resolver discrepancias detectadas

Commit: `feat(enterprise/D): integration fixes + end-to-end verified`

---

## Reglas de trabajo entre partes
- Cada parte termina con su commit y `HANDOFF.md` actualizado
- Orden estricto: A → B.1 → B.2 → B.3 → B.4 → C → D
- Si una sesión se queda sin tokens a mitad de una parte, la siguiente retoma desde el último commit
- B.3 es el único punto donde se descarta trabajo a medias (ver nota arriba)

---

## Fuera de alcance (iteración posterior)
- Onboarding por invitación con magic links
- Panel de administración para la dirección (subir documentos, ver reporte)
- Cierre automático del programa
- Generación de reporte ejecutivo en PDF
- Envío de resúmenes por email
- Pagos automatizados
