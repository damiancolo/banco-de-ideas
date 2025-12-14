# Guía de Despliegue: Banco de Ideas

Sigue estos pasos para llevar tu aplicación a Internet usando **GitHub** y **Vercel**.

## 1. Preparar GitHub
1.  Ve a [github.com/new](https://github.com/new).
2.  Crea un nuevo repositorio llamado `banco-de-ideas` (Público o Privado).
3.  **No** inicialices con README, .gitignore ni licencia (ya los tenemos).
4.  Copia la URL del repositorio (ej: `https://github.com/tu-usuario/banco-de-ideas.git`).

## 2. Subir el código
Desde tu terminal (en la carpeta del proyecto), ejecuta:

```bash
# Reemplaza la URL con la de tu repositorio
git remote add origin https://github.com/damiancolo/banco-de-ideas.git
git branch -M main
git push -u origin main
```

### 🔐 ¿Problemas con la contraseña?
GitHub ya no acepta contraseñas normales. Si al hacer push te falla la autenticación, necesitas un **Token**:
1.  Ve a [GitHub Settings > Developer Settings > Tokens (Classic)](https://github.com/settings/tokens).
2.  Haz clic en **Generate new token (classic)**.
3.  Dale permisos de **repo** (marca la casilla).
4.  Copia el token (empieza por `ghp_...`).
5.  Cuando la terminal te pida "Password", **pega ese token**.

## 3. Desplegar en Vercel
1.  Ve a [vercel.com](https://vercel.com) e inicia sesión (puedes usar tu cuenta de GitHub).
2.  Haz clic en **"Add New..."** -> **"Project"**.
3.  Selecciona tu repositorio `banco-de-ideas` y haz clic en **Import**.
4.  En la configuración del proyecto ("Configure Project"):
    *   **Framework Preset**: Next.js (debería detectarse automático).
    *   **Environment Variables** (¡Importante!):
        *   Haz clic en la flecha para expandir.
        *   Añade tu clave de OpenAI:
            *   Key: `OPENAI_API_KEY`
            *   Value: `sk-...` (tu clave real que empieza por sk).
5.  Haz clic en **Deploy**.

## 4. Conectar tu Dominio (Hostinger)
1.  En tu panel de Hostinger (la captura que mostraste), busca en el menú lateral o en opciones avanzadas: **"Editor de Zona DNS"** o **"DNS / Nameservers"**.
2.  **Borra** cualquier registro A que apunte a una IP de Hostinger (si existe).
3.  **Añade/Crea estos dos registros** para conectar con Vercel:

| Tipo | Nombre (Host) | Valor (Apuntando a) |
| :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

4.  Guarda los cambios.
5.  Vuelve a Vercel > Settings > Domains, añade `unbancodeideas.com` y verás que en unos minutos se pone verde.

## 🛠️ Solución de Problemas (Troubleshooting)

### Vercel no se actualiza (El sitio web muestra una versión vieja)
Si has hecho cambios en GitHub pero Vercel no actualiza la web:
1. Ve a tu proyecto en **Vercel Dashboard**.
2. Entra en **Settings** > **Git**.
3. Si está conectado, haz clic en **Disconnect**.
4. Inmediatamente después, haz clic en **Connect** y selecciona `banco-de-ideas`.
5. Esto forzará una nueva sincronización y verás un nuevo "Deployment" iniciarse.


### Opción B: Despliegue Manual de Emergencia (Infalible)
Si la conexión con GitHub falla, puedes enviar la web directamente desde tu ordenador:

1. Abre tu terminal en la carpeta del proyecto.
2. Ejecuta el comando:
   ```bash
   npx vercel --prod
   ```
3. Sigue las instrucciones en pantalla:
   - Login: Te abrirá el navegador, inicia sesión.
   - Set up and deploy: **Y** (Yes)
   - Scope: Dale a Enter (tu usuario).
   - Link to existing project: **Y** (Yes)
   - Name: `banco-de-ideas` (o el que detecte).
   - Code location: `./` (Enter).

Esto subirá tu carpeta local actual (que ya sabemos que funciona) directamente a los servidores de Vercel, saltándose GitHub.

## 💡 Nota sobre la Base de Datos
Actualmente, tu aplicación guarda las ideas en un archivo local (`data/ideas.json`).
*   **En Vercel (Serverless)**: El sistema de archivos es efímero. Esto significa que **las ideas guardadas desaparecerán** cuando Vercel reinicie el servidor (lo cual pasa frecuente).
*   **Solución para Producción**: Para una aplicación real permanente, deberías conectar una base de datos real (como Vercel Postgres, Supabase o MongoDB).
*   **Estado actual**: Funciona perfecto para demostraciones, pero ten en cuenta que la persistencia no es eterna en Vercel con archivos JSON.
