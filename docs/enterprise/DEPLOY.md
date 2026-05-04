# Despliegue y Pruebas del Entorno Empresa

Este documento contiene los pasos exactos para desplegar el entorno Enterprise a Vercel y configurar los datos de prueba, asegurando la seguridad y trazabilidad.

## 1. Subir cambios a Vercel (Deploy)

Para desplegar la funcionalidad que acabamos de construir, debes subir los cambios a la rama `feature/enterprise-environment`. Vercel detectará el commit e instalará automáticamente las dependencias (como `@anthropic-ai/sdk` que ya añadimos al `package.json`).

Abre tu terminal en la carpeta raíz del proyecto (`banco-ideas`) y ejecuta:

```bash
git add .
git commit -m "feat: Implementado entorno Empresa completo (Frontend y Backend)"
git push origin feature/enterprise-environment
```

## 2. Configurar la API Key en Vercel

Por seguridad, las claves de API nunca se suben al repositorio. Debes configurarla manualmente en Vercel:

1. Ve al panel de control de tu proyecto en Vercel.
2. Navega a **Settings > Environment Variables**.
3. Añade una nueva variable:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: *(Tu clave secreta de Anthropic)*
   - Selecciona los entornos **Preview** y **Production**.
4. Guarda los cambios. (El *push* que hiciste en el paso 1 usará esta variable).

## 3. Configurar Datos de Prueba (Seed)

Para poder probar el entorno como un usuario real, necesitas asignarte una membresía a la organización de prueba. 

En tu terminal local, ejecuta el script de *seed* pasando el correo electrónico con el que inicias sesión en la aplicación (Google OAuth):

```bash
node scripts/seed-enterprise-test.js tu_correo_real@ejemplo.com
```

*Nota: Esto se conectará a la base de datos `banco-ideas-pruebas` (configurada en `.env.local`) y creará la empresa "test-org" asignándote acceso.*

## 4. Probar el Flujo End-to-End

Una vez que Vercel termine de desplegar (puedes ver el progreso en tu panel de Vercel):
1. Abre la URL de Preview que generó Vercel.
2. Inicia sesión con tu cuenta de Google.
3. Ve a tu área privada. Verás el logo de **[TEST] Empresa de Prueba** en el menú superior.
4. Haz clic en el logo para entrar al chat corporativo y prueba la interacción con Claude.
5. Usa el icono inferior para visitar el repositorio privado de ideas de la empresa.
