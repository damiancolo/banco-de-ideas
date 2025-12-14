# 🗄️ Configuración de MongoDB Atlas - Paso a Paso

Esta guía te llevará desde cero hasta tener tu base de datos MongoDB configurada y lista para usar con el Banco de Ideas.

---

## ⏱️ Tiempo estimado: 10 minutos

---

## 📋 Paso 1: Crear Cuenta en MongoDB Atlas

### 1.1 Ir a MongoDB Atlas

🔗 **URL:** https://www.mongodb.com/cloud/atlas/register

### 1.2 Registrarse

Puedes usar:
- ✉️ Email + contraseña
- 🔐 Google
- 🐙 GitHub

> [!TIP]
> Recomiendo usar Google o GitHub para login más rápido

### 1.3 Completar información

- **Nombre**
- **Apellido**
- **Empresa** (opcional, puedes poner "Personal")
- Aceptar términos

---

## 📋 Paso 2: Crear un Cluster Gratuito

### 2.1 Seleccionar plan

Cuando te pregunte "What are you building?":
- Selecciona: **"I'm learning MongoDB"** o **"Building a new application"**

### 2.2 Elegir tier gratuito

- **Tier:** M0 (Free)
- **Provider:** AWS, Google Cloud o Azure (cualquiera funciona)
- **Region:** Elige la más cercana a ti
  - España: `eu-west-1` (Irlanda) o `eu-central-1` (Frankfurt)
  - América Latina: `us-east-1` (Virginia) o `sa-east-1` (São Paulo)

> [!IMPORTANT]
> El tier M0 es **GRATIS PARA SIEMPRE** y tiene 512MB de almacenamiento (suficiente para miles de ideas)

### 2.3 Nombre del cluster

- **Cluster Name:** Puedes dejarlo como `Cluster0` o cambiarlo a `banco-ideas`

### 2.4 Crear cluster

- Clic en **"Create Deployment"** o **"Create Cluster"**
- ⏳ Espera 1-3 minutos mientras se crea

---

## 📋 Paso 3: Configurar Seguridad

### 3.1 Crear usuario de base de datos

Aparecerá un modal "Security Quickstart":

**Username:**
```
banco_user
```

**Password:**
- Clic en **"Autogenerate Secure Password"**
- 📋 **COPIA Y GUARDA** esta contraseña en un lugar seguro
- O crea tu propia contraseña (mínimo 8 caracteres)

> [!CAUTION]
> **¡IMPORTANTE!** Guarda esta contraseña, la necesitarás para el connection string

### 3.2 Configurar acceso de red

En la misma pantalla o en la siguiente:

**Where would you like to connect from?**

Opción 1 - **Desarrollo (más fácil):**
```
IP Address: 0.0.0.0/0
Description: Anywhere (desarrollo)
```

Opción 2 - **Producción (más seguro):**
```
IP Address: [Tu IP actual]
Description: Mi IP
```

> [!TIP]
> Para desarrollo, usa `0.0.0.0/0`. Para producción, añade IPs específicas de Vercel

Clic en **"Add Entry"** o **"Finish and Close"**

---

## 📋 Paso 4: Obtener Connection String

### 4.1 Ir a Connect

- En el dashboard, busca tu cluster
- Clic en **"Connect"**

### 4.2 Elegir método de conexión

- Selecciona: **"Drivers"** (no Compass, no Shell)

### 4.3 Configurar driver

- **Driver:** Node.js
- **Version:** 6.7 or later (o la más reciente)

### 4.4 Copiar connection string

Verás algo como:

```
mongodb+srv://banco_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

📋 **Copia este string completo**

### 4.5 Reemplazar `<password>`

En el string que copiaste:
1. Busca `<password>`
2. Reemplázalo con la contraseña que guardaste en el Paso 3.1
3. **NO** incluyas los símbolos `<` `>`

**Ejemplo:**
```
Antes: mongodb+srv://banco_user:<password>@cluster0...
Después: mongodb+srv://banco_user:MiPassword123@cluster0...
```

> [!WARNING]
> Si tu contraseña tiene caracteres especiales (`@`, `#`, `%`, etc.), necesitas URL-encodearlos:
> - `@` → `%40`
> - `#` → `%23`
> - `%` → `%25`

### 4.6 Añadir nombre de base de datos

En el connection string, después de `.net/` y antes de `?`, añade el nombre de la base de datos:

```
mongodb+srv://banco_user:password@cluster0.xxxxx.mongodb.net/banco-ideas?retryWrites=true&w=majority
                                                                          ^^^^^^^^^^^
                                                                          Añade esto
```

**Connection string final:**
```
mongodb+srv://banco_user:MiPassword123@cluster0.abc123.mongodb.net/banco-ideas?retryWrites=true&w=majority
```

---

## 📋 Paso 5: Configurar en tu Proyecto

### 5.1 Crear archivo `.env.local`

En la **raíz** de tu proyecto (donde está `package.json`):

```bash
# En terminal:
touch .env.local
```

O créalo manualmente con tu editor.

### 5.2 Añadir variables de entorno

Abre `.env.local` y pega:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://banco_user:MiPassword123@cluster0.abc123.mongodb.net/banco-ideas?retryWrites=true&w=majority

# OpenAI (ya la tienes)
OPENAI_API_KEY=sk-...
```

> [!IMPORTANT]
> Reemplaza el `MONGODB_URI` con **TU** connection string del Paso 4.6

### 5.3 Verificar que `.env.local` está en `.gitignore`

Abre `.gitignore` y verifica que contiene:

```
.env.local
```

Si no está, añádelo para evitar commitear tus credenciales.

---

## 📋 Paso 6: Probar la Conexión

### 6.1 Iniciar servidor de desarrollo

```bash
npm run dev
```

### 6.2 Verificar en consola

Deberías ver:

```
✅ MongoDB conectado
```

Si ves este mensaje, ¡todo funciona! 🎉

### 6.3 Probar guardando una idea

1. Abre http://localhost:3000
2. Escribe una idea: "Probar MongoDB"
3. Clic en **"Guardar"**
4. Ve a http://localhost:3000/banco
5. **Esperado:** La idea aparece en "Mis Ideas"

---

## 📋 Paso 7: Verificar en MongoDB Atlas

### 7.1 Ir a Collections

- En MongoDB Atlas, ve a tu cluster
- Clic en **"Browse Collections"**

### 7.2 Ver tus datos

- **Database:** `banco-ideas`
- **Collection:** `ideas`
- Deberías ver tus ideas guardadas como documentos JSON

**Ejemplo de documento:**
```json
{
  "_id": "675d1234567890abcdef1234",
  "text": "Probar MongoDB",
  "category": "user",
  "createdAt": "2024-12-14T15:30:00.000Z",
  "updatedAt": "2024-12-14T15:30:00.000Z"
}
```

---

## 🎉 ¡Listo!

Tu MongoDB Atlas está configurado y funcionando. Ahora puedes:

✅ Guardar ideas desde la aplicación  
✅ Ver ideas en `/banco`  
✅ Generar bisociaciones con IA  
✅ Datos persisten en la nube  

---

## 🚀 Configurar en Vercel (Producción)

Cuando estés listo para deploy:

### 1. Ir a tu proyecto en Vercel

https://vercel.com/dashboard

### 2. Settings → Environment Variables

### 3. Añadir variable

- **Name:** `MONGODB_URI`
- **Value:** Tu connection string completo
- **Environments:** Production, Preview, Development (todos)

### 4. Redeploy

```bash
vercel --prod
```

O desde el dashboard de Vercel: **Deployments → Redeploy**

---

## 🐛 Troubleshooting

### Error: "Por favor define MONGODB_URI en .env.local"

**Solución:**
1. Verifica que `.env.local` existe en la raíz del proyecto
2. Verifica que la variable se llama exactamente `MONGODB_URI`
3. Reinicia el servidor: `Ctrl+C` y luego `npm run dev`

### Error: "MongoServerError: bad auth"

**Causa:** Contraseña incorrecta

**Solución:**
1. Ve a Atlas → Database Access
2. Edita el usuario `banco_user`
3. Cambia la contraseña
4. Actualiza `.env.local` con la nueva contraseña

### Error: "Connection timeout"

**Causa:** IP no whitelisted

**Solución:**
1. Ve a Atlas → Network Access
2. Añade tu IP actual o `0.0.0.0/0`
3. Espera 1-2 minutos para que se aplique

### Error: "Cannot find module 'mongoose'"

**Solución:**
```bash
npm install mongoose
```

---

## 📚 Recursos Adicionales

- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)

---

## 💡 Tips Finales

1. **Backups:** MongoDB Atlas hace backups automáticos en el tier gratuito
2. **Monitoreo:** Puedes ver métricas de uso en el dashboard de Atlas
3. **Límites:** M0 tiene límite de 512MB y 100 conexiones simultáneas (más que suficiente)
4. **Upgrade:** Si necesitas más, puedes upgradear a M10 (~$0.08/hora)

---

**¿Necesitas ayuda?** Revisa la sección de Troubleshooting o consulta la documentación oficial de MongoDB Atlas.

**Última actualización:** 14 de diciembre de 2024
