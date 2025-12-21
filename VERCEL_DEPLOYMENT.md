# 🚀 Guía de Despliegue en Vercel

Para subir tu **Banco de Ideas** a producción en Vercel, debes seguir estos pasos críticos relacionados con la seguridad y la infraestructura.

## 1. Variables de Entorno (Lo más importante)

Vercel **no lee tu archivo `.env.local`** por seguridad. Debes configurar las variables manualmente en su panel:

1. Ve a tu proyecto en el **Dashboard de Vercel**.
2. Entra en **Settings** → **Environment Variables**.
3. Añade las siguientes dos variables:
   - `OPENAI_API_KEY`: Pega tu clave de OpenAI.
   - `MONGODB_URI`: Pega tu connection string completo de MongoDB Atlas.
4. Asegúrate de que estén marcadas para todos los entornos (Production, Preview y Development).

## 2. Configuración de MongoDB Atlas para Vercel

Vercel utiliza una arquitectura serverless donde las funciones pueden ejecutarse desde muchas IPs diferentes del mundo.

### Opción A: Acceso Total (Recomendado para empezar)
En tu panel de **Network Access** en Atlas:
- Mantén la regla `0.0.0.0/0` que configuramos. Esto permite que los servidores de Vercel se conecten sin problemas. Como ya tenemos el usuario con contraseña (`bancodeideas`), tu base de datos sigue estando protegida.

### Opción B: Integración Oficial (Más profesional)
Vercel tiene una integración oficial con MongoDB Atlas que gestiona las IPs automáticamente. Puedes encontrarla en el **Marketplace de Vercel Integration**.

## 3. Preparación del Código

Antes de subir, asegúrate de que:
- El archivo `.env.local` esté listado en tu `.gitignore` (para no subir tus claves a GitHub).
- No hayas dejado claves escritas directamente en el código ("Hardcoded"). Hemos verificado que el código usa `process.env`.

## 4. Pasos para el Despliegue

### Si usas GitHub (Recomendado):
1. Sube tu código a un repositorio privado en GitHub.
2. En Vercel, dale a **"Add New"** → **"Project"**.
3. Importa tu repositorio.
4. Configura las **Environment Variables** (Paso 1).
5. Dale a **"Deploy"**.

### Si usas la Terminal:
```bash
# Instala Vercel CLI
npm i -g vercel

# Inicia el despliegue
vercel
```

## 5. Consideraciones Finales
- **Build**: Vercel ejecutará `npm run build`. El código actual está optimizado para Next.js 14/15, por lo que no debería haber errores.
- **Timeouts**: Las funciones gratuitas de Vercel tienen un límite de 10-15 segundos. Gracias a que optimizamos la conexión a MongoDB con timeouts cortos, no deberías tener problemas de cuelgues.

---
**¿Deseas que revise algún archivo específico para asegurar que sea compatible con el build de producción?**
