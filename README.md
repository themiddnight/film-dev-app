# Film Dev Guidance

A mobile-first PWA for guiding analog photographers through B&W film development — chemical mixing guides, inventory tracking, kit presets, and real-time development timers.

## Monorepo Structure

```
film-dev-guidance/
├── frontend/   # Vite + React PWA (Phase 2 — active)
└── backend/    # Express API (Phase 3 — planned)
```

## Frontend

React 19 + TypeScript + Tailwind v4 + DaisyUI v5, built with Vite.

```bash
cd frontend
bun install
bun run dev
```

## Backend

Express 5 + TypeScript. Not yet active — planned for Phase 3 when user accounts and cloud sync are needed.

```bash
cd backend
bun install
bun run dev
```

## Roadmap

**Phase 2 — Frontend Foundation (current — complete)**
- 5-tab navigation: Dev / Mix / Recipes / My Kit / Settings
- **Recipes** — browse system recipes (Rodinal, HC-110, D-76, Ilfostop, Ilford Rapid Fixer, etc.), create/edit personal recipes, save favourites
- **Mix** — guided chemical mixing flow (Prep Mode + Step-by-Step Mode), scales ingredients to target volume, saves result to Inventory
- **My Kit** — Inventory of mixed chemicals with shelf life tracking, Kit presets linking inventory items to a full development sequence
- **Dev** — development timer sourced from a Kit or recipe directly, auto-calculates time (temp + push/pull + reuse compensation + agitation), agitation reminders, session history
- **Settings** — equipment profile (tank, agitation method), theme, units, sound/vibration/flash
- All data stored locally via Repository pattern (localStorage)
- PWA — works fully offline

**Phase 3 — Backend Foundation (next)**
- PostgreSQL + Drizzle ORM
- REST API for recipes and user data
- Google OAuth authentication
- Swap `Local*Repository` → `Api*Repository`

**Phase 4 — Community Layer**
- User recipe publishing with moderation
- Community browse, filter, and save
- Ratings and recipe forking

## Tech Stack

| | |
|---|---|
| Frontend | Vite, React 19, TypeScript, Tailwind v4, DaisyUI v5 |
| State | Zustand (UI state) + Repository pattern (data access) |
| Backend | Express 5, TypeScript |
| DB | PostgreSQL + Drizzle ORM (Phase 3) |
| Auth | Google OAuth (Phase 3) |
| Package manager | bun |
| PWA | vite-plugin-pwa |
