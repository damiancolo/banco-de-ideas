# 🤖 AI Context: Banco de Ideas

Este archivo está diseñado para que agentes de IA entiendan rápidamente la estructura, el propósito y las convenciones del proyecto sin procesar todo el código fuente.

## 📋 Resumen del Proyecto
**Banco de Ideas** es una aplicación de gestión creativa que utiliza IA multimodal (Voz + Texto) para capturar, analizar y expandir ideas. Se basa en el concepto de "bisociación" (conectar ideas aparentemente no relacionadas).

## 🛠️ Stack Tecnológico
- **Frontend/Backend**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript + React 19
- **Base de Datos**: MongoDB Atlas (Mongoose)
- **IA/ML**:
  - `gpt-4o-mini`: Análisis de ideas y generación de bisociaciones.
  - `whisper-1`: Transcripción de audio a texto.
  - `tts-1`: Generación de voz desde texto (Voz: Shimmer).
- **Estilos**: TailwindCSS 4

## 📂 Mapa de Directorios Clave
- `/app`: Rutas del App Router y lógica de páginas.
  - `/api`: Endpoints serverless (transcripción, análisis, persistencia).
- `/components`: Componentes UI reutilizables (Chat, BancoView).
- `/hooks`: Lógica de comportamiento, especialmente `useVoiceRecording`.
- `/lib`: Utilidades core, conexión a DB y modelos de Mongoose.
- `/scripts`: Scripts de mantenimiento y utilidades de backend.
- `/types`: Definiciones de tipos TypeScript globales.

## 📜 Guía de Scripts Principales
- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Prepara la aplicación para producción.
- `npm run map-project`: (Nuevo) Genera un esquema visual actualizado del proyecto.
- `scripts/sync-staging-db.js`: Sincroniza datos entre entornos.
- `scripts/generate-embeddings.js`: Procesa ideas para búsqueda semántica.

## 🧠 Convenciones y Reglas
1. **Flujo de Voz**: Siempre que se use `viaVoice=true`, el sistema espera una respuesta de audio generada por `/api/speak`.
2. **Persistencia**: Las ideas generadas por el usuario y las "bisociaciones" de la IA se guardan automáticamente en MongoDB.
3. **IDs**: Se utiliza un contador incremental junto con el timestamp para evitar colisiones en mensajes rápidos.
4. **Logging**: Usar `lib/logger.ts` para reportar errores y eventos significativos.

---
> [!TIP]
> Si eres una IA y necesitas entender un flujo específico, empieza por `app/page.tsx` para la orquestación o `lib/db.ts` para la persistencia.
