# Film Dev Guidance — Project Instructions

## Runtime
ใช้ **bun** เป็น runtime และ package manager เสมอ ห้ามใช้ npm หรือ node โดยตรง

```bash
bun install       # ไม่ใช่ npm install
bun run dev       # ไม่ใช่ npm run dev
bun run build
```

---

## Document Structure — กฎการสร้างและค้นหาเอกสาร

Project แบ่งเอกสารออกเป็น 2 โซน ตามประเภทของข้อมูล:

### Zone 1 — Technical Docs (อยู่ใน project นี้)
**Path:** `film-dev-guidance/docs/`

เอกสารที่อยู่ที่นี่คือสิ่งที่ developer ต้องใช้ขณะ implement:

| ไฟล์ | เนื้อหา |
|------|--------|
| `ARCHITECTURE.md` | 2-layer design, repository pattern, folder structure, refactoring strategy |
| `DATA_MODEL.md` | Entity types, My Kit, repository interfaces, data shape rules |
| `RECIPE_SCHEMA.md` | Recipe schema ครบถ้วน, chemistry constraints, development variables |
| `FLOW.md` | User flows, screen behavior, localStorage keys, session variables |
| `ROADMAP.md` | Phase planning, task breakdown ต่อ phase |
| `BACK_BUTTON_POLICY.md` | Navigation rules ต่อ screen |
| `RULES_AND_CONSTRAINTS.md` | **⚠ อ่านก่อนแก้ logic เสมอ** — business rules, chemistry constraints, timer rules, compensation formulas, all encoded decisions |
| `plans/PWA_OFFLINE_STRATEGY.md` | Offline handling strategy, IndexedDB, service worker caching |

**กฎ:** เอกสารที่มี TypeScript code, localStorage keys, component names, หรือ route paths → อยู่ที่นี่เสมอ
**`plans/`** = เอกสาร technical ที่ยังไม่ implement หรืออยู่ระหว่างออกแบบ (planning docs)

### Zone 2 — Domain Research (อยู่นอก project)
**Path:** `../Analog Photographic/` (sibling folder ของ project นี้)

เอกสาร domain knowledge ที่ไม่ผูกกับ implementation — ถ้าวันหนึ่งทำ app อื่นหรืออ่านคนเดียวก็ยังได้ประโยชน์:

| ไฟล์ | เนื้อหา |
|------|--------|
| `film-chemistry-research.md` | ตัวแปรการล้างฟิล์ม, chemistry modularity, developer formats, agitation effects |
| `film-dev-guidance-ux-requirements.md` | UX/UI requirements ทุก phase (product spec ระดับสูง) |

**กฎ:** เอกสารที่เป็น domain knowledge, research findings, หรือ product rationale ที่ไม่มี code → อยู่ที่นั้น

---

## เมื่อต้องการสร้างเอกสารใหม่ — ถามตัวเองก่อน

> "ถ้าวันหนึ่ง refactor ทุกอย่างใหม่ เอกสารนี้ยังมีประโยชน์ไหมโดยไม่ต้องอ่าน code?"

- **ใช่** → Zone 2 (`../Analog Photographic/`)
- **ไม่ใช่ / มี code อยู่** → Zone 1 (`docs/`)

---

## เมื่อต้องการค้นหาข้อมูล — เริ่มที่ไหน

| ต้องการรู้เรื่อง | ดูที่ |
|----------------|------|
| **Business rules, chemistry constraints, timer logic, compensation** | **`docs/RULES_AND_CONSTRAINTS.md` ← อ่านก่อนแก้ logic เสมอ** |
| Data types, entity fields | `docs/DATA_MODEL.md`, `docs/RECIPE_SCHEMA.md` |
| User flow, screen behavior | `docs/FLOW.md` |
| Architecture, repository pattern | `docs/ARCHITECTURE.md` |
| Phase planning, tasks | `docs/ROADMAP.md` |
| Navigation / back button logic | `docs/BACK_BUTTON_POLICY.md` |
| Film chemistry domain knowledge | `../Analog Photographic/film-chemistry-research.md` |
| UX requirements (product level) | `../Analog Photographic/film-dev-guidance-ux-requirements.md` |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite, React 19, TypeScript, Tailwind v4, DaisyUI v5 |
| State | Zustand (UI state), Repository pattern (data access) |
| Backend | Express 5, TypeScript (Phase 2 — not yet active) |
| DB | PostgreSQL + Drizzle ORM (Phase 2) |
| Auth | Google OAuth (Phase 2b) |
| Package manager | **bun** |
| PWA | vite-plugin-pwa |
