# Flujo de Trabajo y Entornos

## Mapa de Entornos

| Entorno | Rama Git | Proyecto Vercel | BD MongoDB | URL |
|---|---|---|---|---|
| Pruebas | `develop` | `banco-de-ideas-pruebas` | `banco-ideas-pruebas` | unbancodeideas.com |
| Produccion | `main` | `banco-de-ideas` | `banco-ideas` | www.unbancodeideas.com |

## Flujo

### 1. Desarrollo local
```bash
git checkout develop
npm run dev
# Probar en localhost:3000
```

### 2. Deploy a pruebas
```bash
git add .
git commit -m "feat: mi cambio"
git push origin develop
```
Vercel actualiza automaticamente el entorno de pruebas. Verificar en la URL de pruebas.

### 3. Pase a produccion
1. Ir a GitHub -> Pull Requests
2. Crear PR: base `main` <- compare `develop`
3. Aprobar y mergear

Vercel detecta el cambio en `main` y actualiza produccion automaticamente.

## Probar contra BD de pruebas localmente

Cambiar `MONGODB_URI` en `.env.local` para que apunte a `banco-ideas-pruebas`:
```
MONGODB_URI=mongodb+srv://bancodeideas:<password>@bancodeideas.0qdelgq.mongodb.net/banco-ideas-pruebas?retryWrites=true&w=majority&appName=bancodeideas
```
Restaurar a `banco-ideas` cuando termines.
