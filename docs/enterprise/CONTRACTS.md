# Contratos técnicos — Plan Enterprise

> Fuente de verdad sobre nombres exactos de campos, endpoints y tipos.
> Se llena progresivamente: schemas en Parte A, endpoints en Parte B.
> Nunca asumir un nombre — siempre consultar aquí primero.

---

## Schemas Mongoose
> Se llenará en Parte A

### Organization
```
[pendiente — Parte A]
```

### Membership
```
[pendiente — Parte A]
```

### Idea (campos añadidos)
```
[pendiente — Parte A]
scope: "public" | "private" | "organization"
organizationId?: ObjectId (ref: Organization)
```

---

## Tipos TypeScript
> Se llenará en Parte A

```typescript
// [pendiente — Parte A]
```

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
// [pendiente — Parte B.3]
interface AIProvider {
  chat(messages: ..., context: ...): Promise<string>
}
```

---

## Variables de entorno requeridas
> Se llenará progresivamente

| Variable | Cuándo se necesita | Descripción |
|----------|--------------------|-------------|
| `MONGODB_URI_ENTERPRISE_DEV` | Desde Parte A | URI a `banco-ideas-enterprise-dev` |
| `ANTHROPIC_API_KEY` | Desde Parte B.3 | API key de Anthropic para Claude Opus 4.6 |
| `DEEPSEEK_API_KEY` | Ya existe | Reutilizado en B.4 |
| `OPENAI_API_KEY` | Ya existe | Reutilizado en B.4 y embeddings |
