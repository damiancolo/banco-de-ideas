# HANDOFF.md

## Última sesión
**Fecha:** 2026-05-04
**Herramienta:** Claude Code
**Branch:** feature/enterprise-environment

## Qué se hizo
- Creada rama `feature/enterprise-environment` desde `develop` (última versión probada)
- Añadido `credentials.md` a `.gitignore`
- Renombrado `CLAUDE.md` → `AGENTS.md`, actualizado con sección Enterprise y flujo git correcto
- Creado symlink `CLAUDE.md → AGENTS.md`
- Creado `HANDOFF.md` (este archivo)
- Creado `docs/enterprise/PLAN.md` con plan completo en 4 partes
- Creado `docs/enterprise/DECISIONS.md` con decisiones de UX y arquitectura
- Creado `docs/enterprise/CONTRACTS.md` (esqueleto — se llena en Parte A y B)
- BD de desarrollo enterprise: `banco-ideas-enterprise-dev` (cluster existente de Atlas)
  → Variable `MONGODB_URI_ENTERPRISE_DEV` configurada en Vercel para esta rama
  → Ver sección "BD Enterprise" en docs/enterprise/DECISIONS.md para la URI exacta

## Estado actual
**Sesión 0 (preparación) completada.**
Listos para empezar Parte A: schemas Mongoose, migración de ideas existentes y script de seed.

## Próxima sesión
Ejecutar **Parte A** según `docs/enterprise/PLAN.md`.
El usuario te pasará un prompt específico para esa parte.

Antes de empezar Parte A, verificar:
- [ ] Que estás en rama `feature/enterprise-environment`
- [ ] Que `MONGODB_URI_ENTERPRISE_DEV` está configurada en `.env.local` apuntando a `banco-ideas-enterprise-dev`
- [ ] Que `ANTHROPIC_API_KEY` está disponible (necesaria para B.3 en adelante)

## Bloqueos / pendientes
- Ninguno al cierre de Sesión 0.

## Decisiones tomadas en esta sesión
- Rama enterprise creada desde `develop` (no desde `main`) porque `develop` es la última versión probada
- BD enterprise separada de `banco-ideas-pruebas` para no contaminar datos de testing existentes
- `CLAUDE.md` convertido en symlink a `AGENTS.md` (una sola fuente de verdad)
