# Film Dev Guidance — Roadmap V2

> Last updated: 2026-04-14
> Stack: Bun · React 19 · Vite · Tailwind v4 · DaisyUI v5 · Zustand · Express 5 · PostgreSQL · Google OAuth
>
> ⚠️ **V2 Rethink** — Roadmap นี้ใช้สำหรับ app V2 เท่านั้น
> V1 code ยังอยู่ใน codebase แต่จะถูก replace ทั้งหมดใน Phase 2
> Product concept และ data model ดูที่:
> - `../Analog Photographic/film-dev-guidance-ux-requirements-v2.md`
> - `docs/DATA_MODEL_V2.md`

---

## V2 Core Concept (สรุป)

- **1 recipe = 1 chemical step** (developer / stop / fixer / wash_aid / wetting_agent)
- **Inventory** = ขวดน้ำยาที่ผสมแล้ว มี lifecycle ของตัวเอง
- **Kit** = step preset — pointer ไป inventory items (shared chemicals ได้)
- **Dev Session** = ล้างฟิล์มจาก kit → deduct use count → สร้าง history

### 5 Tabs หลักของแอพ

| Tab | เป้าหมาย |
|-----|---------|
| **Dev** | Timer + session จาก kit หรือ recipe → track usage + history |
| **Mix** | Guided flow ผสมน้ำยา (multi-select + prep mode / step-by-step) → add to inventory |
| **Recipes** | CRUD personal recipes + browse/save community recipes |
| **My Kit** | จัดการขวดน้ำยา (Inventory) + สร้าง kit preset |
| **Settings** | Equipment profile, app preferences |

Navigation: bottom bar บน mobile · left sidebar บน tablet (768px+)

---

## สถานะปัจจุบัน (V1 — Complete)

> V1 codebase ทำงานได้ครบแล้ว แต่จะถูก replace ด้วย V2 architecture

- [x] PWA offline-first frontend
- [x] Static recipe data (Divided D-23, HC-110, D-76) — bundled format (dev+stop+fix รวมกัน)
- [x] Mixing guide (Prep mode + Step-by-step mode)
- [x] Develop session timer (countdown, agitation reminder, pause/resume)
- [x] Inventory (localStorage) + Kit preset
- [x] Time compensation สำหรับ reusable developer
- [x] Settings (theme, unit, sound/vibrate/flash)
- [x] Route guards + navigation policy
- [x] Backend skeleton (Express + health endpoint)

---

## Phase 2 — V2 Foundation (Frontend Rebuild)

> เป้าหมาย: rebuild frontend ทั้งหมดบน V2 data model
> ยังเป็น localStorage-only, static recipe data
> **V1 code ถูก replace ทั้งหมดใน phase นี้**

### 2-1 Data Layer V2

- [ ] สร้าง types ใหม่ตาม `DATA_MODEL_V2.md`:
  - `types/recipe.ts` — `Recipe`, `RecipeStepType`, `FilmCompatibility`, `RecipeConstraints`
  - `types/inventory.ts` — `InventoryItem`
  - `types/kit.ts` — `Kit`, `KitSlot`, `KitSlotType`
  - `types/session.ts` — `DevSession`, `SessionSource`, `InventoryUpdate`
- [ ] สร้าง repository interfaces:
  - `RecipeRepository` (getAll + filter, getById, getByStepType, save, delete)
  - `InventoryRepository` (getAll + filter, getById, save, updateUseCount, updateStatus, delete)
  - `KitRepository` (getAll, getById, save, delete)
  - `SessionRepository` (getAll, getById, save, getRecentSessions)
- [ ] Implement `LocalRecipeRepository` — อ่าน static TypeScript data
- [ ] Implement `LocalInventoryRepository` — localStorage key `v2-inventory`
- [ ] Implement `LocalKitRepository` — localStorage key `v2-kits`
- [ ] Implement `LocalSessionRepository` — localStorage key `v2-sessions`
- [ ] Seed V2 system recipes (Rodinal, HC-110, D-76, Ilfostop, Ilford Rapid Fixer ฯลฯ) แยกเป็น 1 recipe ต่อ 1 chemical step

### 2-2 Manage Recipes Section

- [ ] Recipe list page — แสดงแยก personal / system
- [ ] Recipe detail page — ข้อมูล recipe + mixing instructions (ถ้ามี)
- [ ] Filter/search — ตาม step_type, film compatibility
- [ ] Create personal recipe — quick form (ชื่อ + type + time + temp)
- [ ] Create personal recipe — full form (mixing guide + chemicals + timing table)
- [ ] Edit / delete personal recipe
- [ ] Saved favourites — save community/system recipe ไว้ใน personal list

### 2-3 Mixing Guidance Section (Mix tab)

- [ ] Recipe multi-select — checkbox เลือกได้หลาย recipe พร้อมกัน (filter: step_type / film / search)
- [ ] Summary screen — แสดง recipes ที่เลือก + ingredients overview รวม
- [ ] Mode selector — เลือก **Prep Mode** หรือ **Step-by-Step Mode** บน summary screen
- [ ] Prep Mode — overview ทุก recipe พร้อมกัน ไล่ tick เองตามสะดวก
- [ ] Step-by-Step Mode — walk through ทีละ recipe เรียงลำดับ:
  - [ ] Select volume + เลือก dilution (ถ้ามี)
  - [ ] Shopping list — scale chemicals ตาม target volume
  - [ ] Mix checklist — guided step-by-step
  - [ ] Done → prompt "บันทึกลง Inventory?" → สร้าง `InventoryItem` linked to recipe

### 2-4 Inventory & Kit Section

**Inventory:**
- [ ] Inventory list — แสดงขวดทั้งหมด พร้อม status badge (active/expired/exhausted)
- [ ] Inventory item detail — recipe ที่ใช้, วันผสม, use count, shelf life countdown
- [ ] Add item manually (นอกจาก mixing guidance prompt)
- [ ] Edit / delete inventory item
- [ ] Mark as exhausted

**Kit:**
- [ ] Kit list — แสดง kits ทั้งหมด พร้อม warning ถ้า item ใด expired/exhausted
- [ ] Create kit — เลือก inventory items ต่อ slot (developer, stop, fixer, wash_aid, wetting_agent)
- [ ] Kit validation — error ถ้า developer/fixer slot ว่าง, warn ถ้า stop ว่าง
- [ ] Chemistry constraint check — pyro developer + non-alkaline fixer → error
- [ ] Edit / delete kit
- [ ] Two-bath developer — auto-generate 2 developer slots เรียงถูกต้อง

### 2-5 Film Dev Guidance Section

- [ ] Entry point 1: เลือก kit → session setup
- [ ] Entry point 2: เลือก community/system recipe โดยตรง (ไม่ track inventory)
- [ ] Session setup: film format, rolls count, temperature, push/pull
- [ ] Calculate development time: temp_table + push_pull_table + reusable compensation + agitation adjustment
- [ ] Timer: countdown + agitation reminder ทุก step
- [ ] Step transition warnings (two-bath: "ห้ามล้างน้ำ — เท Bath B ทันที")
- [ ] All Done → update `use_count` ของ inventory items ทุกตัวใน kit (dedup shared items)
- [ ] Save session history (`DevSession`)
- [ ] Session history list บน home / section

### 2-6 UX & Navigation

- [ ] Bottom nav 5 tabs (Dev / Mix / Recipes / My Kit / Settings) บน mobile
- [ ] Left sidebar บน tablet 768px+ / desktop — same 5 tabs
- [ ] Active tab highlight + icon (Lucide: Timer / FlaskConical / BookOpen / Package / Settings)
- [ ] Dev tab home: kit shortcuts (1-tap) + recent sessions (3–5 รายการ) + anonymous session entry
- [ ] Equipment profile (tank type, agitation method, water hardness) — อยู่ใน Settings tab, localStorage `v2-equipment`
- [ ] Session-level equipment override (temporary — ไม่ save กลับ settings)
- [ ] Onboarding empty states สำหรับแต่ละ tab
- [ ] Update `BACK_BUTTON_POLICY.md` ตาม V2 screen structure

---

## Phase 3 — Backend Foundation

> เป้าหมาย: API พร้อม, frontend อ่านข้อมูลจาก DB แทน localStorage

### 3-1 Infrastructure

- [ ] ตั้งค่า PostgreSQL (Railway หรือ local dev via Docker)
- [ ] Drizzle ORM + migration system (drizzle-kit)
- [ ] Environment config (`.env` + Zod validation)
- [ ] Express 5 API structure + error handling middleware

### 3-2 Recipe Schema & Seed

- [ ] ออกแบบ DB schema ตาม `DATA_MODEL_V2.md` + `RECIPE_SCHEMA.md`
- [ ] Drizzle table definitions: `recipes`, `users`
- [ ] Seed script: แปลง V2 system recipes เข้า DB
- [ ] `GET /api/v1/recipes` — list + filter (step_type, film, search)
- [ ] `GET /api/v1/recipes/:id`
- [ ] Frontend: สร้าง `ApiRecipeRepository` — swap เข้าแทน `LocalRecipeRepository`

### 3-3 Auth (Google OAuth)

- [ ] Google OAuth 2.0 setup (arctic library สำหรับ Bun)
- [ ] `users` table: id, google_id, email, display_name, avatar_url, role
- [ ] Auth endpoints: `/auth/google`, `/auth/google/callback`, `/auth/logout`, `/auth/me`
- [ ] JWT (httpOnly cookie)
- [ ] Frontend: AuthContext / Zustand auth store + protected routes

### 3-4 User Data API

- [ ] `recipes` — personal recipes CRUD (authenticated)
- [ ] `inventory_items` — CRUD + use count update
- [ ] `kits` — CRUD
- [ ] `sessions` — create + list
- [ ] Frontend: swap `Local*Repository` → `Api*Repository` ทั้งหมด

---

## Phase 4 — Community Layer

> เป้าหมาย: user publish recipe ออก community ได้

### 4-1 Recipe Publishing

- [ ] `status` flow: `draft → pending_review → published`
- [ ] `POST /api/v1/recipes/:id/publish` — user submit สำหรับ review
- [ ] Admin endpoints: list pending, approve, reject (with reason)
- [ ] Frontend: publish button + status indicator ใน Manage Recipes

### 4-2 Community Browse

- [ ] Recipe browse page — community recipes ทั้งหมด (published)
- [ ] Filter: step_type, film, developer brand, tags
- [ ] Save / unsave community recipe เป็น favourite

### 4-3 Social Features (Optional / Phase 4b)

- [ ] Rating (1–5 stars) + optional comment
- [ ] Fork recipe (copy เป็น personal แล้วแก้ได้)
- [ ] Recipe version history

---

## Architecture Decisions (V2 — ตัดสินใจแล้ว)

| ประเด็น | Decision |
|---------|---------|
| Film catalog | `films[]` เป็น string array (kebab-case slug) — ไม่ normalize เป็น entity |
| Two-bath kit slot ordering | Auto-generate โดย system เมื่อ detect `is_two_bath = true` |
| Session entry point 2 | Anonymous session — ไม่ track inventory, ไม่ update use_count |
| Equipment profile scope | User settings (default) + session-level override temporary เท่านั้น |
| Prep mode | Multi-select recipes → summary → เลือก Prep Mode หรือ Step-by-Step Mode |
| Navigation | 5 tabs: Dev / Mix / Recipes / My Kit / Settings |
| Responsive nav | Bottom bar (mobile) → Left sidebar (tablet 768px+) |

---

## Architecture Decisions (ไม่เปลี่ยนจาก V1)

| ประเด็น | ตัดสินใจ | เหตุผล |
|---------|---------|--------|
| Database | PostgreSQL | JSONB สำหรับ nested recipe data, full-text search |
| ORM | Drizzle ORM | Type-safe, Bun compatible |
| Auth | Google OAuth | ไม่ต้อง manage password |
| Token | JWT (httpOnly cookie) | ป้องกัน XSS |
| Hosting | Railway | รองรับ Postgres + Node.js |
| localStorage keys | prefix `v2-` ทุก key | แยกจาก V1 data ชัดเจน |