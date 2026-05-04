# Contratos técnicos — Plan Enterprise

> Fuente de verdad sobre nombres exactos de campos, endpoints y tipos.
> Se llena progresivamente: schemas en Parte A, endpoints en Parte B.
> Nunca asumir un nombre — siempre consultar aquí primero.

---

## Schemas Mongoose (Parte A — completo)

### Organization
**Colección MongoDB:** `organizations`
**Archivo:** `lib/models/Organization.ts`

| Campo | Tipo Mongoose | Notas |
|-------|--------------|-------|
| `_id` | ObjectId | Auto |
| `name` | String, required | "Empresa de Prueba" |
| `slug` | String, required, unique, index | "test-org" — lowercase, URL-friendly |
| `logoUrl` | String, required | URL del logo |
| `aiProvider` | String enum: `deepseek\|claude\|openai`, default: `claude` | Motor de IA |
| `aiModel` | String, default: `claude-opus-4-6` | Modelo concreto |
| `knowledgeBase` | Array de subdocumentos | Ver KnowledgeBaseDoc |
| `programStartDate` | Date, required | Inicio del programa |
| `programEndDate` | Date, required | = startDate + 30 días |
| `status` | String enum: `active\|ended\|archived`, default: `active`, index | Estado |
| `createdAt` | Date | Auto (timestamps: true) |
| `updatedAt` | Date | Auto (timestamps: true) |

**KnowledgeBaseDoc** (subdocumento, `_id: false`):

| Campo | Tipo | Notas |
|-------|------|-------|
| `filename` | String | "contexto-empresa.txt" |
| `content` | String | Texto extraído del documento |
| `embedding` | [Number], default: [] | Vector (mismo modelo que resto del proyecto) |
| `uploadedAt` | Date, default: now | |

---

### Membership
**Colección MongoDB:** `memberships`
**Archivo:** `lib/models/Membership.ts`

| Campo | Tipo Mongoose | Notas |
|-------|--------------|-------|
| `_id` | ObjectId | Auto |
| `userId` | String, index | String del JWT de NextAuth (no ObjectId) |
| `organizationId` | ObjectId, ref: Organization, index | |
| `role` | String enum: `admin\|participant`, default: `participant` | |
| `status` | String enum: `active\|ended`, default: `active`, index | |
| `createdAt` | Date | Auto (timestamps: createdAt only) |

**Índices:**
- `{ userId: 1, organizationId: 1 }` — compuesto, consultas de membresía
- `{ userId: 1, status: 1 }` — membresías activas de un usuario (frontend)

---

### Idea (campos añadidos en Parte A)
**Colección MongoDB:** `ideas`
**Archivo:** `lib/models/Idea.ts`

Campo añadido: `scope` (subdocumento con `_id: false`):

| Campo | Tipo | Notas |
|-------|------|-------|
| `scope.type` | String enum: `public\|private\|organization`, default: `public` | |
| `scope.userId` | String, default: null | Solo para type=private |
| `scope.organizationId` | ObjectId ref: Organization, default: null | Solo para type=organization |

**Índice añadido:** `{ 'scope.type': 1, 'scope.organizationId': 1, createdAt: -1 }`

**IMPORTANTE:** El campo `userId` a nivel raíz de Idea se mantiene intacto (compatibilidad con código existente). El campo `scope.userId` es independiente y se usa para el entorno empresa.

---

## Tipos TypeScript (Parte A — completo)

```typescript
// lib/models/Organization.ts
interface IKnowledgeBaseDoc {
    filename: string;
    content: string;
    embedding: number[];
    uploadedAt: Date;
}
interface IOrganization extends Document {
    name: string;
    slug: string;
    logoUrl: string;
    aiProvider: 'deepseek' | 'claude' | 'openai';
    aiModel: string;
    knowledgeBase: IKnowledgeBaseDoc[];
    programStartDate: Date;
    programEndDate: Date;
    status: 'active' | 'ended' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

// lib/models/Membership.ts
interface IMembership extends Document {
    userId: string;                        // String, NOT ObjectId
    organizationId: mongoose.Types.ObjectId;
    role: 'admin' | 'participant';
    status: 'active' | 'ended';
    createdAt: Date;
}

// lib/models/Idea.ts (scope añadido)
interface IIdeaScope {
    type: 'public' | 'private' | 'organization';
    userId?: string | null;
    organizationId?: mongoose.Types.ObjectId | null;
}
// IIdea ahora incluye: scope: IIdeaScope
```

---

## Datos del entorno de prueba (creados en Parte A)

| Dato | Valor |
|------|-------|
| Org slug | `test-org` |
| Org ID | `69f86417eca9095f996452d5` |
| Org name | `Empresa de Prueba` |
| Membership ID | `69f86417eca9095f996452d6` |
| userId en membership | `69c445498c64f2b33a5565b3` (Damián, Google OAuth) |
| aiProvider | `claude` |
| aiModel | `claude-opus-4-6` |

---

## Endpoints API
> Se llenará en Parte B

### Organización
```
GET  /api/organizations/[slug]           → datos de la org (requiere membresía)
```

### Ideas organizacionales
```
GET  /api/organizations/[slug]/ideas     → lista ideas de la org
POST /api/organizations/[slug]/ideas     → crea idea en la org
```

### Chat organizacional
```
POST /api/organizations/[slug]/chat      → chat con IA usando knowledge base de la org
```

---

## Interfaz AIProvider
> Se definirá en Parte B.3

```typescript
// lib/ai/providers.ts — pendiente Parte B.3
interface AIProvider {
    chat(messages: ChatMessage[], systemPrompt: string): Promise<string>
}
```

---

## Variables de entorno requeridas

| Variable | Cuándo se necesita | Descripción |
|----------|--------------------|-------------|
| `MONGODB_URI_ENTERPRISE_DEV` | Desde Parte A | URI a `banco-ideas-enterprise-dev` |
| `ANTHROPIC_API_KEY` | Desde Parte B.3 | Ya configurada en Vercel (production + preview) |
| `DEEPSEEK_API_KEY` | Ya existe | Reutilizado en B.4 |
| `OPENAI_API_KEY` | Ya existe | Reutilizado en B.4 y embeddings |
