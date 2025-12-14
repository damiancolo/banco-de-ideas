# 🔐 Error de Autenticación MongoDB

## ❌ Error Detectado

```
MongoServerError: bad auth : authentication failed
```

## 🔍 Causa

La contraseña en el connection string es incorrecta. MongoDB Atlas rechaza la autenticación.

## ✅ Solución: Resetear Contraseña

### Opción 1: Verificar la Contraseña Guardada

¿Guardaste la contraseña exacta que MongoDB generó? Debe ser exactamente:
```
zfxHeYpOW6MHCR
```

Si no estás seguro, es mejor resetearla (Opción 2).

### Opción 2: Resetear Contraseña (RECOMENDADO)

1. **Ve a MongoDB Atlas** → Database Access (en el menú izquierdo, sección SECURITY)

2. **Busca el usuario** `Damianlafferranderie` o `damianlafferranderie_db_user`

3. **Clic en "Edit"** (botón de editar, ícono de lápiz)

4. **Clic en "Edit Password"**

5. **Genera nueva contraseña:**
   - Opción A: Clic en "Autogenerate Secure Password"
   - Opción B: Escribe tu propia contraseña (mínimo 8 caracteres)

6. **📋 COPIA Y GUARDA** la nueva contraseña

7. **Clic en "Update User"**

### Paso 3: Actualizar `.env.local`

Una vez tengas la nueva contraseña, dímela y actualizaré el archivo `.env.local`.

El connection string quedará así:
```
mongodb+srv://Damianlafferranderie:TU_NUEVA_PASSWORD@bancodeideas.0qdelgq.mongodb.net/banco-ideas?retryWrites=true&w=majority&appName=bancodeideas
```

## ⚠️ Importante

- Si la contraseña tiene caracteres especiales (`@`, `#`, `%`, etc.), necesitan ser URL-encoded:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `:` → `%3A`

Por ejemplo:
- Contraseña: `Pass@123#`
- En connection string: `Pass%40123%23`

## 🎯 Próximo Paso

Dime la nueva contraseña y actualizaré la configuración para que funcione.
