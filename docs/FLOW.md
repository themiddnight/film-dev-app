# Film Dev Guidance — User Flow

> **Status:** Implemented · > **Last updated:** 2026-04-14
> **Icon library:** Lucide React

> เอกสารนี้ describe flows ของ codebase ปัจจุบันหลัง cleanup V1 ออกแล้ว
> Product concept ดูที่: `../Analog Photographic/film-dev-guidance-ux-requirements.md`

---

## Terminology

### Film Development Process

| คำ | ความหมาย | ตัวอย่าง |
|----|----------|----------|
| **Developer** | น้ำยาที่เปลี่ยน latent image บนฟิล์มให้เป็นภาพจริง | Rodinal, HC-110, D-76, Divided D-23 |
| **Stop Bath** | น้ำยาที่หยุดการทำงานของ developer — chemical (acetic acid) หรือ water stop | Ilfostop, น้ำก๊อก |
| **Fixer** | ละลาย silver halide ที่ไม่ถูก expose ออก ทำให้ฟิล์มไวแสงถาวร | Ilford Rapid Fixer |
| **Wash Aid** | เร่งการล้าง hypo ออก — optional แต่ช่วยลดเวลาล้างน้ำ | Kodak HCA, Ilford Washaid |
| **Wetting Agent** | ป้องกัน water spots ตอนแห้ง | Photo-Flo, Ilfotol |
| **Develop Session** | กระบวนการล้างฟิล์ม 1 ครั้ง ตั้งแต่ developer จนถึง dry | — |
| **Push / Pull** | Push (+N): ล้างนาน เพิ่ม contrast / Pull (−N): ล้างสั้น ลด contrast | N+1 = push 1 stop |
| **Two-Bath Developer** | developer แบบ 2 ขั้นตอนต่อกัน ห้ามแทรก stop ระหว่าง Bath A กับ Bath B | Divided D-23 |

---

### App Entities

| คำ | ความหมาย | หมายเหตุ |
|----|----------|---------|
| **Recipe** | สูตรสำหรับ **1 chemical step** — developer, stop, fixer, wash_aid หรือ wetting_agent | ไม่ใช่ bundle อีกต่อไป |
| **System Recipe** | Recipe ที่ทีม seed ไว้ ทุกคนใช้ได้ | verified + read-only |
| **Personal Recipe** | Recipe ที่ user สร้างเอง private by default | สร้างได้เร็ว ไม่ผ่าน review |
| **Favorite Recipe** | ความสัมพันธ์ระหว่าง user กับ recipe (`recipe_id`) | ไม่ copy recipe เป็น personal |
| **Offline Saved Recipe** | snapshot ของ recipe ที่ user save ไว้อ่าน offline | เก็บใน IndexedDB |
| **Community Recipe** | Personal recipe ที่ user publish ออก community | ผ่าน admin review |
| **Inventory Item** | ขวดน้ำยาที่ผสมแล้ว มี lifecycle (mixed_date, use_count, status) | link กลับไป Recipe เสมอ |
| **Kit** | Step preset — ordered list ของ Inventory Items ที่จะใช้ใน session | pointer ไม่ใช่ copy |
| **Kit Slot** | mapping ระหว่าง slot_type หนึ่งกับ Inventory Item หนึ่ง | slot_type: developer/stop/fixer/wash_aid/wetting_agent |
| **Dev Session** | การล้างฟิล์ม 1 ครั้ง — deduct use_count + สร้าง history | มาจาก kit หรือ recipes โดยตรง |

---

### UI Actions

| คำ | ความหมาย |
|----|----------|
| **Apply Kit** | โหลด inventory items จาก Kit preset เข้า session |
| **Time Compensation** | เพิ่มเวลา develop ตาม `time_increase_per_roll` แบบ linear ตามจำนวน roll ที่ใช้ไปแล้ว (ไม่ใช้ bucket) |
| **Kit Validation** | ตรวจ kit ก่อนเริ่ม session: developer+fixer required, stop recommended |

---

## App Structure — 5 Tabs

Navigation: **Bottom bar บน mobile / Left sidebar บน tablet (768px+) และ desktop**

```
App
├── Dev — Film Dev session (timer, entry point หลัก)
├── Mix — Mixing Guidance (multi-select recipe → guided flow → inventory)
├── Recipes — Browse / Create / Favorites / Community recipes
├── My Kit — Kits landing (`/kits`)
└── Settings — Equipment profile, preferences
```

| Tab | Icon (Lucide) | Default landing |
|-----|--------------|-----------------|
| Dev | `Timer` | ใช่ — หน้าแรกที่เปิดแอพ |
| Mix | `FlaskConical` | ไม่ |
| Recipes | `BookOpen` | ไม่ |
| My Kit | `Package` | ไม่ — landing ที่ `/kits` |
| Settings | `Settings` | ไม่ |

หมายเหตุ implementation ปัจจุบัน:
- Inventory อยู่ที่ `/inventory` และเข้าได้จาก Home โดยตรง
- Bottom nav / sidebar ตอนนี้ชี้ไปที่ Kits ไม่ได้มี tab แยกสำหรับ Inventory

---

## Flow 1 — Manage Recipes

### Overview
Section สำหรับจัดการสูตร system และ personal

### Entry points
- Bottom nav → "Recipes"
- ปุ่ม "ดูสูตร" จาก recipe detail ใน section อื่น

### Flow: Browse & Save

```
Recipes page
 ├─ Personal tab
 │ แสดง: personal recipes
 │ → แตะ recipe → Recipe detail
 └─ System tab
 Filter: step_type / film / search
 → แตะ recipe → Recipe detail
 → [Add favourite] ← บันทึก relation ด้วย `recipe_id`
 → [Save for offline] ← เก็บ recipe snapshot ลง IndexedDB
 → [ใช้ใน Mixing Guidance] ← shortcut ข้ามไป Flow 2
```

### Flow: Create Personal Recipe (Quick)

สำหรับ user ที่มีสูตรจากช่องทางอื่นและต้องการแค่ timer

```
Recipes page → [+ สร้างสูตร]
 → Quick form:
 ชื่อสูตร (required)
 Step type: developer / stop / fixer / wash_aid / wetting_agent (required)
 ถ้า developer:
 อุณหภูมิ + เวลา (required) หรือ temp table (optional)
 Film: general หรือ specific film (optional)
 Chemical format (optional — ถ้าต้องการ mixing guide)
 → Save → Personal recipe (private)
```

### Flow: Create Personal Recipe (Full)

สำหรับ user ที่ต้องการ mixing guide ครบถ้วน

```
Recipes page → [+ สร้างสูตร] → [สร้างแบบละเอียด]
 → Step 1: Basic info
 ชื่อ, description, step_type, film compatibility, tags
 → Step 2: Chemical details
 chemical_format → conditional fields (dilution / chemicals list)
 mixing_steps (ถ้ามี)
 storage info
 → Step 3: Development timing (developer เท่านั้น)
 temp table หรือ fixed time
 agitation spec
 reuse compensation (ถ้า reusable)
 → Step 4: Preview + Save
 → Personal recipe (private)
```

### Flow: Publish to Community

> ยังไม่ implement ใน frontend ปัจจุบัน

```
Personal recipe detail → [Publish ออก Community]
 → Confirm: "สูตรนี้จะถูก review โดย admin ก่อน publish"
 → status: pending_review
 → Admin approve → status: published (ทุกคนเห็น)
 → Admin reject → status: draft (พร้อม reason)
```

---

## Flow 2 — Mixing Guidance

### Overview
Guided flow ผสมน้ำยา 1 recipe ต่อครั้ง จนได้ขวดพร้อมใช้ → add to Inventory

### Entry points
- Bottom nav → "Mix"
- "Save as favourite" / browse recipe จาก Recipes แล้วเข้าผ่าน Mix เอง
- Home → "Mixing Guide ()"

### Flow: Mixing (Prep Mode vs Step-by-Step)

```
Mix page
 ├─ เลือก Recipe (multiple choice — checkboxes)
 │ Filter: step_type / film / search
 │ แสดง: personal + system recipes ที่มี mixing_steps
 │ user tick ✓ ได้หลาย recipe พร้อมกัน
 │ (เช่น tick developer + stop + fixer)
 │
 → [ดำเนินการต่อ] (enabled เมื่อเลือก ≥ 1)
 │
 → Summary screen
 │ แสดง recipes ที่เลือกทั้งหมด + ingredients count
 │ เลือก Target Volume (ml) สำหรับ dilution scaling
 │ ถ้า recipe เป็น two-bath: เลือกก่อนเริ่มว่า
 │   - Mix both baths (A + B)
 │   - Mix Bath A only
 │   - Mix Bath B only
 │
 │ ┌─ [Prep Mode]
 │ │ "Prepare all chemicals first, then mix them one by one"
 │ │
 └─ [Step-by-Step Mode]
   "Prepare and mix one step at a time, repeat for each step"
 │
 ├── Prep Mode path:
 │ Phase 1: Prepare All Chemicals
 │ → แสดง chemicals จากทั้ง recipes + amount per liter
 │ → user tick ✓ แต่ละ chemical ระหว่างชั่ง/ตวง
 │ → [Continue to Mix] เมื่อ all chemicals ready
 │
 │ Phase 2: Mix All Chemicals
 │ → แสดง mixing_steps จากทั้ง recipes ตามลำดับ
 │ → user tick ✓ แต่ละ step ระหว่าง mix
 │ → [Continue to Inventory] เมื่อเสร็จแล้ว
 │
 │ Phase 3: Add Bottles to Inventory
 │ → Select checkboxes: recipes จะบันทึกเป็น bottle
 │ → [Save to Inventory] → บันทึกทั้งหมด
 │ จาก: name (recipe name), mixed_date, bottle_type, step_type
 │ two-bath recipes:
 │   - both → save 2 bottles (Bath A + Bath B)
 │   - A only / B only → save only selected bath
 │
 └── Step-by-Step Mode path (วนลูป ทีละ recipe):
 สำหรับแต่ละ recipe ที่เลือก (เรียงตาม order):
  → Shopping List
    แสดง chemicals scaled ตาม target volume
    user tick ✓ แต่ละรายการ
    → [เตรียมครบแล้ว]

  → Mix Checklist
    guided step-by-step ตาม mixing_steps ของ recipe
    user tick ✓ แต่ละ step
    Warning โดด (safety-critical)
    → [ผสมเสร็จแล้ว]

  → Add to Inventory (optional)
    ├─ [บันทึก] → save bottle → ไป recipe ถัดไป
    └─ [ข้ามไป] → recipe ถัดไป เลย

 → After all recipes: Final Inventory Summary + ให้เลือก bottles ที่จะบันทึก
```

**พฤติกรรม:**
- **Prep Mode**: ทำให้ user เตรียมทั้ง setup ก่อน แล้วค่อยประมวลผล mix แบบ systematic
- **Step-by-Step**: ให้ user ทำทีละ step เพื่อ focus ในการ mix หละ bottling
- `ready_to_use` recipes ไม่มี prep/mix checklist — ข้าม prompt add inventory โดยตรง
- Mode selection เป็น UI state ล้วนๆ (ไม่มี entity ใน data model)
- Target volume ใช้ดำเนินการ scaling สำหรับ dilutions ได้


---

## Flow 3 — Inventory & Kit

### Overview
จัดการขวดน้ำยาที่มีอยู่จริง และ สร้าง/จัดการ kit presets

### Entry points
- Home → "Inventory ()"
- Home / sidebar → "My Kit" (`/kits`)

---

### Flow 3A — Inventory Management

```
Inventory page (`/inventory`)
 ├─ แสดง: ขวดทั้งหมด grouped by step_type หรือ status
 │ badge: expiring soon / exhausted / near max rolls
 ├─ [+ เพิ่มขวด] → Add manually (ถ้าไม่ได้ผ่าน Mixing Guidance)
 │ เลือก recipe → กรอก mixed_date, bottle_type
 ├─ แตะขวด → Inventory item detail
 │ แสดง: recipe ที่ใช้, วันผสม, shelf life countdown
 │ แสดง: use_count / max_rolls
 │ [แก้ไข notes], [Mark as exhausted], [ลบ]
 └─ Expiry logic (คำนวณ real-time ไม่เก็บใน DB):
 status = 'expired' ถ้า mixed_date + shelf_life_days < วันนี้
 status = 'exhausted' ถ้า user mark หรือ one-shot ที่ใช้แล้ว
```

---

### Flow 3B — Kit Management

```
Kits page (`/kits`)
 ├─ My Kits tab
 │ แสดง: kit ทั้งหมดที่ user สร้างหรือ clone มา
 │ warning badge ถ้า item ใดใน kit expired/exhausted หรือขาดน้ำยา
 │ [+ สร้าง Kit ใหม่]
 │ แตะ kit → Kit detail
 │  [แก้ไข], [ลบ]
 │  ถ้า slots ยังไม่เชื่อมขวดจริง (มีแต่ intended_recipe_id):
 │    [เตรียมน้ำยาที่ขาด] → Shortcut ไป Mix page (Flow 2) พร้อม pre-select recipes ที่ต้องผสม
 └─ Community Guides tab
   แสดง: Kit templates ที่แนะนำจาก community (ไม่มีขวดจริง)
   แตะ guide → [Clone เป็น My Kit]
   → กลายเป็น Kit ในช่อง My Kits ที่มี intended_recipe_id ชี้ไปยังสูตรต่างๆ ทำหน้าที่เหมือน To-Do list
```

### Flow: Create Kit

```
[+ สร้าง Kit ใหม่]
 → ตั้งชื่อ kit (เช่น "HP5+ Standard Set")
 → กำหนด Slots:
 slot_type ที่ต้องมี: developer (required), fixer (required)
 slot_type แนะนำ: stop (warn ถ้าว่าง)
 slot_type optional: wash_aid, wetting_agent

 ต่อแต่ละ slot:
 dropdown เลือก Inventory Item → filter ตาม step_type ที่ตรงกัน
 (หลาย kit ใช้ item เดียวกันได้ — เช่น fixer ร่วม)

 สำหรับ developer two-bath:
 slot ถูกแยกชัดเจนเป็น Developer Bath A และ Developer Bath B
 dropdown ของแต่ละช่อง filter ตาม role (A เห็นเฉพาะขวด A, B เห็นเฉพาะขวด B)

 → Kit Validation (ก่อน Save):
 ❌ developer slot ว่าง → block save
 ❌ fixer slot ว่าง → block save
 ⚠️ stop slot ว่าง → warn "ถ้า fixer เป็น reusable แนะนำ chemical stop"
 ❌ pyro developer + non-alkaline fixer → block save + explain
 ❌ paper fixer + film session → block save

 → Save ✅
```

**Two-bath developer:**
- ถ้าเลือก developer ขวด Bath A ที่ recipe เป็น two-bath
 → auto-add developer slot ที่สองเป็น Bath B
 → ทั้งสอง slot เป็น required และอยู่ติดกันใน order เสมอ
 → ห้ามแทรก stop ระหว่างกัน

---

## Flow 4 — Film Dev Guidance

### Overview
ล้างฟิล์มจริง — guided timer + deduct inventory usage + สร้าง history

### Entry points
- Bottom nav → "Dev"
- Home → kit shortcut (1-tap)

### 2 Entry Points สู่ Session

**Entry point 1: จาก Kit** (แนะนำ — track inventory ครบ)
```
Develop page → [เลือก Kit]
 แสดง kits ทั้งหมด พร้อม warning ถ้า item ใด expired/exhausted
 → แตะ Kit → ไป Session Setup
```

**Entry point 2: จาก Community/System Recipe** (ไม่ track inventory)
```
Develop page → [เลือก Recipe โดยตรง]
 Browse system developer recipes
 → แตะ recipe → ไป Session Setup (ไม่มี inventory tracking)
```

---

### Flow: Session Setup

```
Session Setup
 ├─ Film format: 35mm / 120 / 4x5
 ├─ จำนวน rolls (validate: push/pull ต่างกันใน rolls หลายม้วน → warn)
 ├─ อุณหภูมิจริง (°C) — ควรวัดก่อนเริ่มเสมอ
 ├─ Development type: N-2 / N-1 / N / N+1 / N+2
 └─ (ถ้ามาจาก Kit) แสดง slot summary + warning ถ้า item ใดมีปัญหา

 → ระบบคำนวณ:
 development time จาก temp_table × dev_type
 ถ้า recipe เป็น two-bath: ใช้เวลารวมจาก develop steps (Bath A + Bath B)
 ถ้า developer เป็น reusable → +time compensation
 ถ้า agitation method เป็น rotary → × 0.85

 → [เริ่ม Session]
```

---

### Flow: Active Session (Timer)

```
 Active Timer (loop per step)
 ├─ Countdown ใหญ่ — readable at a glance
 ├─ Step name + progress indicator (step X of Y)
 ├─ Step-specific warning แสดงตลอด (เช่น "Two-bath: ห้ามล้างน้ำก่อน Bath B")
 ├─ Agitation reminder — notify ตาม agitation spec ของ recipe
 ├─ [Pause] → dialog ก่อน back (ดู BACK_BUTTON_POLICY.md)
 └─ หมดเวลา → notify → Step Complete

 Step Complete
 ├─ Transition warning (เช่น "เท Bath B ทันที — ห้ามล้างน้ำ")
 ├─ Step ถัดไป + เวลา
 └─ [เริ่ม step ถัดไป] / [Emergency exit]

 All Done 🎉
 ├─ [ถ้ามาจาก Kit] → อัปเดต use_count ของ Inventory Items ทุกตัวใน slots
 │ (dedup ถ้า item เดียวอยู่หลาย slot)
 ├─ บันทึก DevSession (history)
 ├─ [ล้างฟิล์มม้วนใหม่] → กลับ Session Setup
 └─ [กลับหน้าหลัก]
```

---

### Development Time Calculation

```
base_time = recipe.develop_timing.temp_table[temperature][dev_type]

ถ้า developer bottle เป็น reusable:
 rolls = bottle.use_count
 compensation = rolls 1-2: ×1.0, 3-4: ×1.25, 5-6: ×1.50, 7-8: ×1.75, 9+: warn
 adjusted_time = base_time × compensation

ถ้า agitation_method === 'rotary':
 final_time = adjusted_time × 0.85
else:
 final_time = adjusted_time
```

---

## Dev Tab — Home (Default Landing)

```
Dev tab (หน้าแรกเมื่อเปิดแอพ)
 ├─ Kit Shortcuts (ถ้ามี kit)
 │ แตะ kit → Session Setup พร้อม kit applied (1 tap)
 ├─ [ถ้าไม่มี kit] → "สร้าง Kit แรกของคุณ" → My Kit tab
 ├─ Recent Sessions (3–5 รายการล่าสุด)
 │ tap → session detail (read-only)
 └─ [+ เริ่ม session จาก recipe] → Entry point 2 (anonymous)
```

---

## Persistence Map (Phase 2 — ก่อนมี backend)

### localStorage Keys

| Key | เนื้อหา | Entity |
|-----|---------|--------|
| `recipes` | personal recipes | `Recipe[]` |
| `inventory` | inventory items | `InventoryItem[]` |
| `kits` | kit presets | `Kit[]` |
| `sessions` | session history | `DevSession[]` |
| `settings` | app settings | settings object |
| `equipment` | equipment profile | `EquipmentProfile` |

### IndexedDB (Dexie / FilmDevDB)

| Table | เนื้อหา | Entity |
|------|---------|--------|
| `favoriteRecipes` | recipe ids ที่ user กด favourite | `FavoriteRecipe[]` |
| `offlineSavedRecipes` | recipe snapshots สำหรับ offline read | `OfflineSavedRecipe[]` |

> หมายเหตุ: standard keys (no prefix) ทุก key เพื่อแยกจาก V1 data (`my-kit`, `my-kit-devkits` ฯลฯ) ชัดเจน

---

## Session State (Zustand)

หมายเหตุ: stores บางตัวใช้ `persist` และถูกเก็บใน localStorage (`settings`, `equipment`, `dev-session`, `mixing`)

```ts
// developStore.ts ()
type DevelopStoreState = {
 // Session config
 sessionSource: SessionSource | null // { type: 'kit', ... } | { type: 'recipes', ... }
 filmFormat: FilmFormat | null
 rollsCount: number
 temperatureCelsius: number | null
 devType: DevType // 'N-2' | 'N-1' | 'N' | 'N+1' | 'N+2'

 // Equipment — prefill จาก user settings, override ได้ per-session (ไม่ save กลับ)
 agitationMethod: AgitationMethod // temporary session override
 tankType: string | null // temporary session override

 // Timer state
 currentStepIndex: number
 isRunning: boolean
 isPaused: boolean
 remainingSeconds: number

 // Computed
 calculatedSteps: SessionStep[] // steps พร้อม final_duration_seconds แล้ว
}

// mixStore.ts () — Mixing Guidance UI state
type MixStoreState = {
 selectedRecipeIds: string[] // recipes ที่ tick เลือก
 mode: 'prep' | 'step_by_step' | null // เลือกหลัง summary screen
 currentRecipeIndex: number // ใช้ใน step_by_step mode
}
```

---

## Chemistry Constraints ที่ UI ต้องรู้

| Constraint | ที่เกิด | สิ่งที่ UI ทำ |
|-----------|---------|-------------|
| Two-bath: ห้ามแทรก stop ระหว่าง Bath A กับ Bath B | Kit creation | Auto-order slots, ไม่ให้แทรก stop ระหว่างกัน |
| Pyro developer + alkaline fixer required | Kit validation | Block save + อธิบาย |
| Paper fixer + film session | Kit validation | Block save + อธิบาย |
| Reusable fixer + water stop | Kit validation warning | ⚠️ warn เท่านั้น ไม่ block |
| Fixer exhausted | Session start | Block start |

> Domain knowledge ครบที่: `../Analog Photographic/film-chemistry-research.md`

---

## Architecture Decisions (สรุป)

| ประเด็น | Decision |
|---------|---------|
| Film catalog | `films[]` เป็น string array (kebab-case slug) — ไม่ normalize เป็น entity |
| Two-bath slot ordering | Auto-generate โดย system เมื่อ detect `is_two_bath = true` |
| Session entry point 2 | Anonymous session — ไม่บังคับ inventory, ไม่ update use_count |
| Equipment profile | User settings (default) + session override temporary เท่านั้น |
| Prep mode | Prepare all chemicals first → Mix all → Add bottle to inventory |
| Navigation | 5 tabs: Dev / Mix / Recipes / My Kit / Settings |
| Responsive nav | Bottom bar (mobile) → Left sidebar (tablet 768px+) |
