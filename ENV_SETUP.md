# Configuración de Variables de Entorno

Este archivo documenta las variables de entorno necesarias para el proyecto.

## Variables Requeridas

### MONGODB_URI
**Descripción:** Connection string para MongoDB  
**Formato:** `mongodb+srv://usuario:password@cluster.mongodb.net/banco-ideas?retryWrites=true&w=majority`  
**Dónde obtenerla:**
1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear cluster gratuito (M0)
3. Ir a "Connect" → "Connect your application"
4. Copiar el connection string
5. Reemplazar `<password>` con tu contraseña

**Desarrollo local:** Añadir a `.env.local`
```bash
MONGODB_URI=mongodb+srv://...
```

**Producción (Vercel):**
1. Ir a tu proyecto en Vercel
2. Settings → Environment Variables
3. Añadir `MONGODB_URI` con el valor

### OPENAI_API_KEY
**Descripción:** API key de OpenAI para funcionalidad de IA  
**Formato:** `sk-...`  
**Dónde obtenerla:**
1. Ir a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crear nueva API key
3. Copiar el valor (solo se muestra una vez)

**Desarrollo local:** Añadir a `.env.local`
```bash
OPENAI_API_KEY=sk-...
```

**Producción (Vercel):** Ya configurada

## Archivo .env.local (ejemplo)

```bash
# MongoDB
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/banco-ideas?retryWrites=true&w=majority

# OpenAI
OPENAI_API_KEY=sk-proj-...
```

## Seguridad

⚠️ **IMPORTANTE:**
- Nunca commitear `.env.local` a Git (ya está en `.gitignore`)
- No compartir las API keys públicamente
- Rotar keys si se exponen accidentalmente
- Usar diferentes keys para desarrollo y producción

## Verificación

Para verificar que las variables están configuradas:

```bash
# En desarrollo
npm run dev

# Deberías ver en la consola:
# ✅ MongoDB conectado
```

Si ves errores, verifica:
1. Que `.env.local` existe en la raíz del proyecto
2. Que las variables están correctamente formateadas
3. Que no hay espacios extra alrededor del `=`
