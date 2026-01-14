# 🔄 Flujo de Trabajo y Entornos

Este proyecto utiliza un flujo de trabajo estricto para garantizar la estabilidad del entorno principal.

## 🗺️ Mapa de Entornos

Nuestra infraestructura conecta **GitHub** y **Vercel** de la siguiente manera:

| Entorno | GitHub Rama | Vercel Proyecto | URL | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **🧪 PRUEBAS** | `develop` | `banco-de-ideas-pruebas` | [unbancodeideas.com](https://unbancodeideas.com) | Donde probamos todo *antes* de lanzar. |
| **🚀 PRINCIPAL** | `main` | `banco-de-ideas` | [www.unbancodeideas.com](https://www.unbancodeideas.com) | La versión estable final. |

---

## 👩‍💻 Cómo Trabajamos

### 1. Desarrollo (Local)
Todo comienza en tu máquina.
```bash
# Crear/Usar la rama de pruebas
git checkout develop

# Hacer cambios, guardar y probar en localhost:3000
npm run dev
```

### 2. Despliegue a Pruebas
Cuando terminas una funcionalidad, la subes a la rama `develop`.
```bash
git add .
git commit -m "feat: mi nueva funcionalidad"
git push origin develop
```
✅ **Automáticamente:** Vercel actualiza el entorno de **Pruebas**.
👀 **Tu acción:** Entras a la URL de pruebas y verificas que todo funcione.

### 3. Pase a Producción
Solo cuando has verificado que `banco-de-ideas-pruebas` funciona perfecto, llevamos los cambios al entorno Principal.

1.  Ir a GitHub -> Pull Requests.
2.  Crear "New Pull Request":
    *   **Base:** `main`
    *   **Compare:** `develop`
3.  Aprobar y hacer "Merge".

✅ **Automáticamente:** Vercel detecta el cambio en `main` y actualiza el entorno **Principal**.
