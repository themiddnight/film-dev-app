# Film Dev Guidance

A mobile-first PWA for guiding analog photographers through B&W film development — step-by-step chemical mixing guides and real-time development timers.

## Monorepo Structure

```
film-dev-guidance/
├── frontend/   # Vite + React PWA (Phase 1 — active)
└── backend/    # Node.js + Express API (Phase 2 — planned)
```

## Frontend

React 19 + TypeScript + Tailwind v4 + DaisyUI v5, built with Vite.

```bash
cd frontend
bun install
bun run dev
```

## Backend

Node.js + Express 5 + TypeScript. Not yet active — planned for Phase 2 when dynamic recipe management is needed.

```bash
cd backend
bun install
bun run dev
```

## Roadmap

**Phase 1 — Static (current)**
- Chemical mixing guide with step-by-step checklist
- Real-time development timer with agitation reminders
- Step preview with per-step time customization
- Recipes stored as static TypeScript: Divided D-23, HC-110 Dil.B, Kodak D-76
- PWA — works offline

**Phase 2 — Dynamic**
- Backend API for recipe management
- Admin interface for adding/editing recipes

**Phase 3 — Community**
- User accounts and authentication
- Community recipe contributions with moderation
- Search and filter by chemical, temperature, film type

## Tech Stack

| | |
|---|---|
| Frontend | Vite, React 19, TypeScript, Tailwind v4, DaisyUI v5 |
| Backend | Node.js, Express 5, TypeScript |
| Package manager | bun |
| PWA | vite-plugin-pwa |
