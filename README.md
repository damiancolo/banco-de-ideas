# 💡 Banco de Ideas

Una aplicación web moderna para gestionar y expandir tus ideas usando Inteligencia Artificial.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-purple?style=flat-square&logo=openai)

## ✨ Características

- 💾 **Persistencia en la Nube**: Tus ideas se guardan en MongoDB Atlas
- 🤖 **IA Generativa**: Genera ideas similares (bisociaciones) usando GPT-4
- 📊 **Análisis de Ideas**: Obtén análisis crítico de negocio para tus conceptos
- 💬 **Chat Inteligente**: Conversa con la IA sobre tus ideas
- 🎨 **UI Moderna**: Interfaz limpia y responsive
- 🔒 **Seguro**: Variables de entorno protegidas, código production-ready

## 🚀 Demo

**Producción:** [banco-de-ideas.vercel.app](https://banco-de-ideas.vercel.app)

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript
- **Base de Datos:** MongoDB Atlas (Mongoose)
- **IA:** OpenAI GPT-4o-mini
- **IA:** OpenAI GPT-4o-mini
- **Estilos:** Tailwind CSS
- **Deploy:** Vercel

## 🌍 Entornos y Flujo de Trabajo

Mantenemos dos entornos sincronizados automáticamente con GitHub:

### 🧪 Entorno de Pruebas (Staging)
- **Rama:** `develop`
- **Proyecto Vercel:** `banco-de-ideas-pruebas`
- **Objetivo:** Validar cambios antes de que lleguen a los usuarios finales.

### 🚀 Entorno Principal (Producción)
- **Rama:** `main`
- **Proyecto Vercel:** `banco-de-ideas`
- **Objetivo:** Versión estable y pública de la aplicación.

**Regla de Oro:** Nunca hacemos push directo a `main`. Todo pasa primero por `develop` y se prueba.

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratis)
- API Key de [OpenAI](https://platform.openai.com/api-keys)

## ⚙️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/banco-de-ideas.git
   cd banco-de-ideas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```bash
   cp env.example .env.local
   ```
   
   Edita `.env.local` y añade tus credenciales:
   ```env
   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/banco-ideas?retryWrites=true&w=majority

   # OpenAI API Key
   OPENAI_API_KEY=sk-proj-TU_CLAVE_AQUI
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```
   
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Build de Producción

```bash
npm run build
npm start
```

## 🌐 Deploy en Vercel

1. **Conecta tu repositorio** en [Vercel](https://vercel.com)

2. **Configura las variables de entorno** en Vercel:
   - `MONGODB_URI`
   - `OPENAI_API_KEY`

3. **Deploy automático** con cada push a `main`

## 📖 Uso

### Guardar una Idea

1. Escribe tu idea en el input principal
2. Presiona Enter o clic en el botón de enviar
3. La idea se guarda automáticamente en MongoDB

### Generar Bisociaciones

1. Después de guardar una idea, la IA te preguntará qué quieres hacer
2. Responde "ideas similares" o "dame 3 ideas"
3. La IA generará 3 conceptos relacionados

### Ver tus Ideas

- Navega a `/banco` para ver todas tus ideas guardadas
- Las ideas del usuario y las bisociaciones están organizadas en carpetas separadas

## 🏗️ Arquitectura

```
banco_de_ideas/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── analyze/       # Endpoint de IA
│   │   └── ideas/         # CRUD de ideas
│   ├── banco/             # Vista de ideas guardadas
│   └── page.tsx           # Página principal (chat)
├── components/            # Componentes React
├── lib/                   # Utilidades
│   ├── constants.ts       # Constantes centralizadas
│   ├── logger.ts          # Sistema de logging
│   ├── mongodb.ts         # Conexión a MongoDB
│   ├── db.ts              # Capa de acceso a datos
│   └── models/            # Modelos de Mongoose
├── services/              # Capa de servicios
│   └── ideaService.ts     # API calls centralizadas
└── types/                 # Tipos TypeScript compartidos
```

## 🔐 Seguridad

- ✅ Variables de entorno protegidas con `.gitignore`
- ✅ Sin credenciales hardcodeadas en el código
- ✅ Validación de entrada en todos los endpoints
- ✅ Logging controlado (solo errores en producción)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👤 Autor

**Damián Lafferranderie**

- GitHub: [@damianlafferranderie](https://github.com/damianlafferranderie)
- Website: [estudioprompt.com](https://estudioprompt.com)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el increíble framework
- [OpenAI](https://openai.com/) por la API de GPT-4
- [MongoDB](https://www.mongodb.com/) por la base de datos en la nube
- [Vercel](https://vercel.com/) por el hosting

---

⭐ Si este proyecto te resultó útil, considera darle una estrella en GitHub!
