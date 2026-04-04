# Film Dev Guidance — Roadmap

> Last updated: 2026-04-05
> Stack: Bun · React 19 · Vite · Tailwind v4 · DaisyUI v5 · Zustand · Express 5 · PostgreSQL · Google OAuth

---

## สถานะปัจจุบัน (Phase 1 — Complete)

- [x] PWA offline-first frontend
- [x] Static recipe data (Divided D-23, HC-110, D-76)
- [x] Mixing guide (Prep mode + Step-by-step mode)
- [x] Develop session timer (countdown, agitation reminder, pause/resume)
- [x] Settings (theme, unit, sound/vibrate/flash)
- [x] Route guards + navigation policy
- [x] Backend skeleton (Express + health endpoint)

---

## Phase 1b — My Kit (Local-only) ✅ DONE

> เป้าหมาย: user track อุปกรณ์และน้ำยาของตัวเองได้ ทั้งหมดอยู่ใน localStorage
> **Data is throwaway** — ไม่มี migration plan เมื่อไป Phase 2 เพราะ app ยังไม่ production

### 1b-1 Equipment Profile ✅
- [x] เพิ่ม Settings fields: tank type, agitation method, water hardness, pre-soak default _(stop bath type ถูก remove ออกใน Phase 1c cleanup — ดูด้านล่าง)_
- [x] Save ใน `my-kit` localStorage key ผ่าน `LocalKitRepository` (EquipmentProfile อยู่ใน UserKit)
- [x] ใน Session Setup: แสดง equipment defaults + allow override ต่อ session (temporary — ไม่ persist)

### 1b-2 Chemical Bottle Tracking ✅
> My Kit integrate เข้า flow หลัก ไม่ใช่ section แยก — ดู `FLOW.md` → My Kit section

**My Kit page (จาก Home navbar icon):**
- [x] สร้าง `my-kit` localStorage key (ผ่าน `LocalKitRepository`)
- [x] หน้า My Kit: แสดงรายการ bottles + Equipment Profile summary
- [x] Expiry warning — badge เมื่อใกล้ครบ `shelfLifeDays`
- [x] Roll limit warning — badge เมื่อใกล้ครบ `maxRolls`

**Mixing Guide integration (Done → prompt):**
- [x] หลัง Mix Checklist Done → prompt "บันทึกลง Inventory?" (optional) — ทุก bath ที่ `mixing_required === true` (Phase 1c fix: เดิม trigger เฉพาะ developer bath)
- [x] Add Bottle form: prefill `bottleName` จากสูตร (qualified: "Divided D-23 Bath A"), `mixedAt` = วันนี้
- [x] `role` ถูก set อัตโนมัติจาก `bath.role`, default type: developer → `reusable`, อื่นๆ → `one-shot`
- [x] ถ้ามีขวดชื่อเดิมอยู่แล้ว → แสดง option "เพิ่มขวดใหม่" หรือ "อัปเดตขวดเดิม"

### 1b-3 Session Setup Enhancement ✅
> My Kit เชื่อมกับ Develop Session ที่ Step Preview — ดู `FLOW.md` → Flow 2

**Step Preview — My Kit integration:**
- [x] แสดง dropdown "เลือกขวดน้ำยา" (optional) — filter เฉพาะ bottles ที่ตรงกับ developer ของ recipe
- [ ] ถ้าเลือกขวด reusable → คำนวณ time compensation อัตโนมัติ และแสดงให้เห็น _(Phase 1c)_
- [x] ถ้าเลือกขวด → หลัง All Done เรียก `incrementRolls(bottleId)` อัตโนมัติ
- [x] ถ้าไม่มีขวดใน My Kit → แสดง hint "เพิ่มขวดได้ใน My Kit"

**Session fields เพิ่มเติม:**
- [x] Step Preview: เลือก film format + จำนวน rolls (UI เท่านั้น — ยังไม่ใช้คำนวณ volume)
- [x] Validate: ถ้า devType ≠ N และ rolls > 1 → warn "ม้วนที่มี push ต่างกันควร dev แยก session"
- [x] Temperature: hint "วัด temp จริงก่อนเริ่ม" ใต้ dropdown (ไม่ใช้ modal เพราะ user ที่ชำนาญรู้อยู่แล้ว)

### 1b-4 Repository Pattern Prep ✅
- [x] สร้าง `src/repositories/` folder พร้อม interfaces
- [x] `RecipeRepository` interface + `LocalRecipeRepository` implementation
- [x] `KitRepository` interface + `LocalKitRepository` implementation
- [x] ปรับ components ให้ใช้ repository แทน import static data โดยตรง

> ดู `DATA_MODEL.md` → Architecture section สำหรับ interface definitions
> ดู `DATA_MODEL.md` → My Kit section สำหรับ ChemicalBottle และ EquipmentProfile types

---

## Phase 1c — Kit Playlist (Local-only) ✅ DONE

> เป้าหมาย: user สร้าง "kit preset" ล่วงหน้า กำหนดว่าแต่ละ step ของ recipe ใช้ขวดไหน
> **Data is throwaway** เช่นเดียวกับ 1b — ไม่มี migration plan

**ที่มาของ feature:**
- 95% ของ B&W chemistry เป็น modular — developer จากสูตรไหนก็ใช้ stop/fixer ชุดเดิมได้
- User มีขวด stop และ fixer ที่ใช้ซ้ำข้ามสูตร — ควร select ได้ใน session โดยไม่ต้องเลือกทีละ step
- สูตร 2-bath (Divided D-23) ต้องการ slot 2 ช่องสำหรับ developer — Kit รู้เรื่องนี้จาก recipe step structure

**Spec:** ดู `DATA_MODEL.md` → DevKit, KitSlot sections

**หมายเหตุ Terminology:** ใน Phase 1c ตัดสินใจแยก terminology ให้ชัดเจน:
- **Inventory** = ขวดน้ำยาที่ user มีจริง (เดิมเรียก "My Kit" ใน UI)
- **Kit** = preset mapping ขวดต่อ recipe step (feature ใหม่ Phase 1c)
- UI label "My Kit" page → ชื่อ title เปลี่ยนเป็น "Inventory" — route path คงเดิม (`/my-kit`)

### 1c-1 Type + Data Layer ✅
- [x] เพิ่ม `role: 'developer' | 'stop' | 'fixer' | 'wash_aid' | 'wetting_agent'` ใน `ChemicalBottle` type (`types/kit.ts`)
- [x] เพิ่ม `DevKit` + `KitSlot` types (`types/kit.ts`)
- [x] เพิ่ม DevKit methods ใน `KitRepository` interface: `saveDevKit`, `getDevKits`, `deleteDevKit`
- [x] Implement ใน `LocalKitRepository` — store ใน localStorage key `my-kit-devkits`
- [x] เพิ่ม DevKit state ใน `kitStore`: `devKits`, `loadDevKits`, `saveDevKit`, `deleteDevKit`, `getBottlesByRole`
- [x] เพิ่ม Kit session state ใน `developStore`: `selectedKitId`, `slotSelections`, `setSelectedKit`, `setSlotSelection`, `applyKitSlots`

### 1c-2 Mixing Prompt Enhancement ✅
- [x] Bug fix: prompt เดิม trigger เฉพาะ developer bath (hardcode) — เปลี่ยนเป็นเช็ค `bath.mixing_required === true` ทำให้ stop, fixer และทุก bath ที่ต้องผสมได้ prompt
- [x] `role` ถูก set อัตโนมัติจาก `bath.role` ตอนบันทึกขวด
- [x] Default bottle type: developer baths → `'reusable'`, อื่นๆ → `'one-shot'`
- [x] Prompt title เปลี่ยนเป็น "บันทึกลง Inventory?"

### 1c-3 Create Kit UI ✅
- [x] หน้า `CreateKitPage` (`/my-kit/create-kit`) เข้าได้จาก Inventory page
- [x] Edit mode ผ่าน `?edit=<kitId>` search param
- [x] Two-step flow: เลือก recipe → configure slots + name
- [x] Auto-generate slots จาก `recipe.develop_steps` ที่มี `bath_ref`
- [x] ต่อแต่ละ slot: dropdown เลือก bottle — filter ตาม `Bath.role` ของ step นั้น
- [x] ถ้าไม่มีขวดตรง role → แสดง hint "ไม่มีขวดใน Inventory" พร้อมลิงก์เพิ่มขวด
- [x] Save → `saveDevKit` → กลับ Inventory page

### 1c-4 Kit Selection ใน Session Flow ✅
- [x] Step Preview: Kit dropdown + per-slot bottle dropdowns (filter by bath role)
- [x] เลือก Kit → `applyKitSlots` populate slots อัตโนมัติ
- [x] Override ต่อ slot ได้หลัง apply Kit
- [x] Inventory page: แสดง Kit list + Create/Edit/Delete Kit

### 1c-5 Kit Shortcut ใน RecipeSelectPage ✅ _(เพิ่มจาก spec เดิม)_
- [x] RecipeSelectPage แสดง Kit shortcuts section ด้านบน search bar
- [x] แตะ Kit → setRecipe + applyKitSlots + navigate ไป Step Preview ในขั้นตอนเดียว
- [x] แสดงเฉพาะเมื่อมี devKits

### 1c-6 Time Compensation (Reusable Developer) ✅
- [x] เมื่อ slot developer มี `bottle.type: 'reusable'` → คำนวณ time compensation จาก `rollsDeveloped`
- [x] แสดง time compensation badge ใน Step Preview ("ม้วนที่ 5–6: +50%")
- [x] Table: rolls 1–2: standard, 3–4: +25%, 5–6: +50%, 7–8: +75%, 9+: warn
- [x] All Done → `incrementRolls` สำหรับทุก slot ที่มี bottleId (dedup ถ้าขวดเดียวใช้หลาย slot)

### 1c-7 Pre-Phase 2 Cleanup ✅ _(เสร็จ 2026-04-05)_

**Stop bath always-present:**
- [x] เพิ่ม `water-stop` bath (`chemical_format: 'ready_to_use'`) ใน recipe data ทุกไฟล์ (divided-d23, hc110, d76)
- [x] เพิ่ม `bath_ref` ให้ stop step ใน hc110 และ d76 (เดิมไม่มี)
- [x] ออกแบบ: stop bath มีอยู่เสมอ — water stop คือ fallback ถ้าไม่มีขวด chemical stop ใน Inventory

**Remove `stopBathType` จาก EquipmentProfile:**
- [x] Remove `stopBathType` field จาก `EquipmentProfile` type (`types/kit.ts`)
- [x] Remove Stop Bath toggle จาก EquipmentSection ใน MyKitPage
- [x] Remove Stop Bath toggle + `stopBathLabel` function จาก StepPreviewPage
- [x] Update `DEFAULT_EQUIPMENT` constant

**Slot validation:**
- [x] CreateKitPage: developer slot ว่าง → disable Save button + แสดง error message
- [x] CreateKitPage: stop/fixer slot ว่าง → warn message แต่ยังบันทึกได้ (ยกเว้น `ready_to_use` baths)
- [x] StepPreviewPage: developer slot ว่าง → disable Start button + แสดง error message
- [x] StepPreviewPage: stop/fixer slot ว่าง → warn message แต่ยังเริ่มได้

> ดู `DATA_MODEL.md` → DevKit, KitSlot, KitRepository sections
> ดู `FLOW.md` → Kit Playlist section

---

## Phase 2a — Backend Foundation

> เป้าหมาย: API พร้อม, frontend อ่านข้อมูลจาก DB แทน static import

### 2a-1 Infrastructure

- [ ] ตั้งค่า PostgreSQL (Railway หรือ local dev via Docker)
- [ ] เลือก ORM: **Drizzle ORM** (type-safe, เข้ากับ Bun ดี)
- [ ] ตั้งค่า database connection + connection pooling
- [ ] สร้าง migration system (drizzle-kit)
- [ ] ตั้ง environment config (`.env` + validation ด้วย Zod)

### 2a-2 Recipe Schema & Seed

- [ ] ออกแบบ DB schema ตาม `RECIPE_SCHEMA.md`
- [ ] สร้าง Drizzle table definitions
- [ ] เขียน migration ตัวแรก
- [ ] seed script: แปลง static recipe (D-23, HC-110, D-76) เข้า DB

### 2a-3 Recipe API (Read-only)

- [ ] `GET /api/v1/recipes` — list ทั้งหมด (pagination, filter by tag)
- [ ] `GET /api/v1/recipes/:id` — recipe เดี่ยว + steps + baths
- [ ] Zod request/response validation
- [ ] Error handling middleware
- [ ] CORS config สำหรับ frontend dev

### 2a-4 Frontend Migration

- [ ] สร้าง `src/api/` layer (fetch wrapper + error types)
- [ ] สร้าง `useRecipes()` hook แทน static import
- [ ] เพิ่ม loading + error state ใน RecipeSelectPage
- [ ] เพิ่ม offline fallback (ถ้า API ไม่ตอบ ใช้ cached data)
- [ ] ปรับ PWA service worker ให้ cache API responses

---

## Phase 2b — Auth + Recipe Ownership

> เป้าหมาย: login ด้วย Google, เจ้าของ recipe รู้ว่าใครสร้าง

### 2b-1 Google OAuth

- [ ] ตั้งค่า Google Cloud Console (OAuth 2.0 Client)
- [ ] ติดตั้ง `passport.js` + `passport-google-oauth20` (หรือ `arctic` ถ้าใช้ Bun native)
- [ ] สร้าง `users` table: `id`, `google_id`, `email`, `display_name`, `avatar_url`, `created_at`
- [ ] Auth endpoints:
  - `GET /auth/google` — redirect to Google
  - `GET /auth/google/callback` — handle callback, issue JWT
  - `POST /auth/logout` — invalidate session
  - `GET /auth/me` — return current user
- [ ] JWT middleware (verify token ใน protected routes)
- [ ] Refresh token strategy

### 2b-2 Recipe Ownership

- [ ] เพิ่ม `author_id` FK ใน recipes table
- [ ] เพิ่ม `visibility: 'public' | 'private'` (มีอยู่แล้วใน type)
- [ ] เพิ่ม `status: 'draft' | 'published' | 'pending_review'`
- [ ] Admin route: `POST /api/v1/recipes` (require admin role)
- [ ] ปรับ GET recipes: public recipes เท่านั้น ยกเว้น owner เห็นของตัวเอง

### 2b-3 Frontend Auth

- [ ] `AuthContext` หรือ Zustand auth store
- [ ] Login button + Google OAuth redirect flow
- [ ] Protected route wrapper
- [ ] User profile display (avatar + name ใน navbar)
- [ ] Token storage strategy (httpOnly cookie แนะนำ)

---

## Phase 3a — Community Recipe Contribution

> เป้าหมาย: user สามารถ submit recipe ของตัวเองได้

### 3a-1 Recipe Submission API

- [ ] `POST /api/v1/recipes` — authenticated users (ไม่ใช่แค่ admin)
- [ ] `PUT /api/v1/recipes/:id` — owner เท่านั้น
- [ ] `DELETE /api/v1/recipes/:id` — owner หรือ admin
- [ ] status flow: `draft → pending_review → published`
- [ ] Input validation ครบทุก field (ใช้ Zod schema จาก `RECIPE_SCHEMA.md`)

### 3a-2 Moderation

- [ ] Admin dashboard (หรือแค่ admin API routes ก่อน):
  - `GET /api/v1/admin/recipes?status=pending_review`
  - `PATCH /api/v1/admin/recipes/:id/approve`
  - `PATCH /api/v1/admin/recipes/:id/reject` (พร้อม reason)
- [ ] Email notification เมื่อ recipe ถูก approve/reject (optional)

### 3a-3 Create Recipe UI

- [ ] Multi-step form (wizard):
  - Step 1: Basic info (name, description, tags, film types)
  - Step 2: Developer info (chemical format, dilution, temperature range)
  - Step 3: Mixing guide (baths + chemicals) — ถ้ามี
  - Step 4: Development steps (timer steps + agitation)
  - Step 5: Preview + submit
- [ ] Form validation ตาม schema
- [ ] Draft autosave (localStorage → DB)
- [ ] Template variable builder (ดู `RECIPE_SCHEMA.md` สำหรับ design)

### 3a-4 My Recipes

- [ ] `/my-recipes` page — draft, pending, published recipes ของตัวเอง
- [ ] Edit / delete draft
- [ ] View status ของ pending recipes

---

## Phase 3b — Social Layer (Optional / Future)

> ทำหลังจาก 3a stable แล้ว

- [ ] Save / bookmark recipe ของคนอื่น
- [ ] Rating (1–5 stars) + optional comment
- [ ] Fork recipe (copy เป็นของตัวเอง แล้วแก้ได้)
- [ ] Recipe version history (เก็บ snapshot ทุกครั้งที่ publish)
- [ ] Film + developer catalog (แยก entity เพื่อ search/filter)

---

## Architecture Decisions

| ประเด็น | ตัดสินใจ | เหตุผล |
|---------|---------|--------|
| Database | PostgreSQL | Full-text search, JSONB for nested recipe data, ecosystem ดี |
| ORM | Drizzle ORM | Type-safe, Bun compatible, migration ง่าย |
| Auth | Google OAuth | ไม่ต้อง manage password, UX ดีกว่า |
| Token | JWT (httpOnly cookie) | ป้องกัน XSS ได้ดีกว่า localStorage |
| Recipe nested data | JSONB columns | `baths[]` และ `develop_steps[]` ซับซ้อนเกินกว่าจะ normalize ทุก field |
| Hosting | Railway | รองรับ Postgres + Node.js, มี free tier |

---

## Dependencies ที่จะเพิ่ม

### Backend
```
drizzle-orm          — ORM
drizzle-kit          — migration CLI
pg / postgres        — PostgreSQL driver
arctic               — OAuth (Google) สำหรับ Bun
jose                 — JWT sign/verify
zod                  — validation (มีอยู่แล้วใน frontend)
```

### Frontend
```
(ไม่มีเพิ่มมาก — ใช้ fetch native + Zustand ที่มีอยู่)
```
