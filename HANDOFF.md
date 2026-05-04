# HANDOFF.md

## Última sesión
**Fecha:** 2026-05-04
**Herramienta:** Claude Code
**Branch:** feature/enterprise-environment

## Qué se hizo (Ajuste post-Parte A — Unificación de BD)

- Migrados `test-org` y su membresía de `banco-ideas-enterprise-dev` → `banco-ideas-pruebas`
- BD `banco-ideas-enterprise-dev` limpiada (colecciones vaciadas, se puede descartar)
- Variable `MONGODB_URI_ENTERPRISE_DEV` eliminada de Vercel y de `.env.local`
- Scripts actualizados para usar `MONGODB_URI_PRUEBAS` (sin referencias a ENTERPRISE_DEV)
- `DECISIONS.md` documenta la decisión de BD única
- `CONTRACTS.md` actualizado con los nuevos IDs

## Estado actual — datos de prueba en `banco-ideas-pruebas`

| Dato | Valor |
|------|-------|
| Org slug | `test-org` |
| Org ID | `69f865afac962f2952a38494` |
| Org name | `[TEST] Empresa de Prueba` |
| Membership ID | `69f865cdb09d9bdc6ececf42` |
| userId en membership | `69c445498c64f2b33a5565b3` (Damián, Google OAuth) |
| aiProvider | `claude`, aiModel: `claude-opus-4-6` |

## Próxima sesión — Parte B.1

Implementar:
1. `lib/enterprise/auth.ts` — helper `requireMembership(slug, session)`
   - Recibe el slug de la organización y la sesión de NextAuth
   - Busca la Membership en `banco-ideas-pruebas` (= `MONGODB_URI` en Vercel preview)
   - Retorna la membresía si está activa, lanza error 403 si no
2. Endpoint `GET /api/organizations/[slug]/route.ts`
   - Llama a `requireMembership`, devuelve datos de la org (sin knowledgeBase.embedding)
   - Verificable con curl pasando cookie de sesión

**Todo va en `MONGODB_URI` (una sola BD).** No hay segunda conexión.

## Decisiones de arquitectura relevantes para B.1

- `userId` en Membership es String (no ObjectId) — viene del JWT de NextAuth
- `session.user.id` del JWT = string de ObjectId de MongoDB
- Para obtener la sesión en un API route de Next.js App Router: `import { auth } from '@/auth'`
- Las rutas enterprise están bajo `/api/organizations/[slug]/` — nueva carpeta

## Bloqueos / pendientes
- La BD `banco-ideas-enterprise-dev` sigue existiendo en Atlas (colecciones vacías).
  Se puede eliminar manualmente desde el panel de Atlas cuando se quiera.
- `knowledgeBase.embedding` sigue vacío en test-org. Se rellenará en D o manualmente.
