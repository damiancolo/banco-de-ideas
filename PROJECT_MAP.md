
# 🗺️ Project Map: banco_de_ideas
**Generado el:** 1/24/2026, 5:06:42 PM

## 🏗️ Árbol de Archivos
```text
├── .claude/
│   └── settings.local.json
├── .env.local
├── .gitignore
├── AI_CONTEXT.md
├── ARQUITECTURA.md
├── CODE_IMPROVEMENTS.md
├── DEPLOY.md
├── DEPLOYMENT_STATUS.md
├── ENV_SETUP.md
├── LICENSE
├── MONGODB_SETUP.md
├── MONGODB_SUCCESS.md
├── README.md
├── TROUBLESHOOTING.md
├── VERCEL_DEPLOYMENT.md
├── WORKFLOW.md
├── app/
│   ├── about/
│   │   ├── ca/
│   │   │   └── page.tsx
│   │   ├── en/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts
│   │   ├── ideas/
│   │   │   ├── comments/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── search/
│   │   │   ├── keywords/
│   │   │   │   └── route.ts
│   │   │   └── semantic/
│   │   │       └── route.ts
│   │   ├── speak/
│   │   │   └── route.ts
│   │   └── transcribe/
│   │       └── route.ts
│   ├── banco/
│   │   ├── page.tsx
│   │   └── semantic/
│   │       └── page.tsx
│   ├── globals.css
│   ├── icon.tsx
│   ├── layout.tsx
│   ├── opengraph-image.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── BancoView.tsx
│   ├── ChatMessage.tsx
│   ├── IdeaModal.tsx
│   └── ui/
├── data/
│   └── ideas.json
├── env.example
├── eslint.config.mjs
├── hooks/
│   └── useVoiceRecording.ts
├── lib/
│   ├── constants.ts
│   ├── db.ts
│   ├── logger.ts
│   ├── models/
│   │   ├── Idea.ts
│   │   └── RateLimit.ts
│   ├── mongodb.ts
│   ├── rate-limit.ts
│   └── utils/
│       ├── embeddings.ts
│       └── intentDetector.ts
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── scripts/
│   ├── generate-embeddings.js
│   ├── map-project.js
│   ├── migrate-localstorage.js
│   └── sync-staging-db.js
├── services/
│   └── ideaService.ts
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── types/
    └── index.ts

```

## 📦 Dependencias Core
- mongoose: ^9.0.1
- next: 16.0.10
- openai: ^6.10.0
- react: 19.2.1
- react-dom: 19.2.1

## 📜 Scripts Disponibles
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run sync-db`
- `npm run embeddings`
- `npm run migrate`
- `npm run map-project`
