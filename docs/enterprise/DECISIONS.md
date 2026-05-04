# Decisiones tomadas — Plan Enterprise

> Ninguna IA futura debe reinventar estas decisiones. Si algo parece debatible, leer aquí antes de proponer cambios.

---

## Decisiones de UX

### Acceso visual al entorno empresa
**Decisión:** los logos de las organizaciones aparecen junto al icono de home dentro del entorno privado del usuario, NO en el entorno público.
**Por qué:** mantiene la coherencia con el sistema (privado = autenticado = personal). El acceso al entorno empresa está protegido naturalmente al requerir paso previo por el candado.

### Comportamiento al terminar el programa
**Decisión:** el logo de la empresa desaparece sin rastro del entorno privado. Las ideas que el usuario publicó NO se eliminan; se envía un PDF resumen por email.
**Por qué:** cierre limpio del piloto, sin saturar la UI con elementos archivados.

### Multi-empresa
**Decisión:** un usuario puede pertenecer a varias empresas Enterprise simultáneamente. Cada una aparece como un logo independiente en el área privada.
**Por qué:** casos reales de consultores que trabajan con múltiples empresas.

### Visibilidad de ideas dentro del entorno empresa
**Decisión:** todas las ideas son visibles para todos los miembros desde el momento de su publicación.
**Por qué:** alineado con la filosofía de inteligencia colectiva. Sin moderación ni borradores.

### Aterrizaje por defecto al hacer login
**Decisión:** el usuario aterriza siempre en el entorno privado (`/privado`).
**Por qué:** desde ahí elige conscientemente dónde quiere pensar. Coherente para usuarios sin empresa.

### Notificaciones
**Decisión:** los logos NO muestran badges, puntos ni contadores de actividad.
**Por qué:** coherencia con la sensibilidad minimalista del proyecto.

### Rol de la dirección dentro del entorno empresa
**Decisión:** la dirección es un participante normal más, igual que cualquier empleado.
**Por qué:** filosofía de inteligencia colectiva real. Las funciones administrativas van en panel separado (fuera de alcance de esta iteración).

---

## Decisiones de arquitectura

### Modelo de scope para ideas
**Decisión:** añadir campo `scope` al schema de `Idea` con tres valores: `public`, `private`, `organization`.
Las ideas de empresa también llevan `organizationId`.
**Por qué:** permite filtrar por entorno con una sola consulta. Compatible hacia atrás (ideas existentes = `public` o `private`).
**Migración:** las ideas sin `userId` → `scope: "public"`. Las ideas con `userId` → `scope: "private"`. Las nuevas de empresa → `scope: "organization"`.

### Membership como colección N:M separada
**Decisión:** colección `Membership` independiente (relación entre `User` y `Organization`), no un campo en `User`.
**Por qué:** un usuario puede pertenecer a varias empresas. Permite estados (`active`, `ended`) y roles (`admin`, `participant`).

### Motor de IA configurable por organización
**Decisión:** `Organization` tiene campos `aiProvider` (`deepseek` | `claude` | `openai`) y `aiModel`.
**Por qué:** flexibilidad comercial. La capa `lib/ai/providers.ts` permite añadir motores sin tocar endpoints.
**Default recomendado para el piloto:** `claude` con `claude-opus-4-6`.

### Embeddings siempre con OpenAI
**Decisión:** aunque el motor de chat sea configurable, los embeddings siempre usan el modelo OpenAI ya configurado (`text-embedding-3-small`).
**Por qué:** garantiza compatibilidad con MongoDB Atlas Vector Search y consistencia entre los tres entornos.

### Knowledge base de la organización
**Decisión:** `Organization` tiene array `knowledgeBase` con documentos de contexto (texto + embedding). Sus embeddings se incluyen en la búsqueda vectorial cuando un usuario chatea en el entorno empresa.
**Por qué:** diferencia funcional clave del entorno empresa — la IA conoce el contexto de la empresa.

### BD de desarrollo enterprise
**Decisión:** `banco-ideas-enterprise-dev` (mismo cluster Atlas, BD separada de `banco-ideas-pruebas`).
**Por qué:** el plan Enterprise añade nuevos schemas que podrían contaminar los datos de testing existentes.
**Variable:** `MONGODB_URI_ENTERPRISE_DEV` configurada en Vercel para la rama `feature/enterprise-environment` y en `.env.local` para desarrollo local.

---

## Decisiones de arquitectura (revisiones)

### BD única para Enterprise
**Decisión:** las colecciones `Organization` y `Membership` viven en la BD principal (`MONGODB_URI`), no en una BD de staging separada.

**Por qué:** simplifica los endpoints (una sola conexión MongoDB), evita duplicar configuración, y refleja cómo funcionará en producción. Las organizaciones de prueba se identifican por convención: slug empezando por `test-` y nombre prefijado con `[TEST]`.

**Cuándo se decidió:** después de la Parte A, antes de empezar B.1.

**Implicación para scripts locales:** los scripts usan `MONGODB_URI_PRUEBAS` localmente (que equivale al `MONGODB_URI` que usa Vercel en preview). Nunca escriben en la `MONGODB_URI` local (que apunta a producción).

---

## Decisiones fuera de alcance (postergadas)

| Tema | Razón del aplazamiento |
|------|------------------------|
| Onboarding por invitación con magic links | Se hace manualmente via script de seed durante el piloto |
| Panel de administración | La dirección no tendrá UI propia en esta iteración; documentos se cargan manualmente |
| Cierre automático del programa | Se hará manualmente al principio |
| Pagos automatizados | Los 200€ del piloto se gestionan manualmente |
| Generación de reporte PDF | Fuera de alcance de esta iteración |
| Envío de emails a participantes | Fuera de alcance de esta iteración |
