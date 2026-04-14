# Film Dev Guidance V2 — Data Model

> Version: 2.0 (complete rethink)
> Last updated: 2026-04-13
> Status: Planning — ยังไม่ได้ implement
>
> เอกสารนี้แทนที่ DATA_MODEL.md สำหรับ V2 architecture
> Product rationale และ UX requirements ดูที่:
> `../Analog Photographic/film-dev-guidance-ux-requirements-v2.md`

---

## Overview: สิ่งที่เปลี่ยนจาก V1

### V1 Recipe structure
Recipe 1 ตัว = bundle ของ dev + stop + fix ครบในตัว มี `baths[]` และ `develop_steps[]` อยู่ใน recipe เดียวกัน

### V2 Recipe structure
Recipe 1 ตัว = สูตรสำหรับ **chemical step เดียว** (developer, stop, fixer, wash_aid หรือ wetting_agent) ไม่มี bundle อีกต่อไป

---

## Core Entities

### 1. Recipe

```ts
type Recipe = {
  id: string                    // uuid
  slug: string                  // "rodinal-1-50-hp5", สำหรับ URL
  name: string                  // "Rodinal 1+50"
  description?: string
  step_type: RecipeStepType     // ประเภท chemical step (ดูด้านล่าง)

  // Film specificity (optional)
  film_compatibility: FilmCompatibility

  // Chemical details
  chemical_format: ChemicalFormat
  dilution?: DilutionSpec       // สำหรับ liquid_concentrate
  chemicals?: Chemical[]        // สำหรับ powder_raw / diy
  mixing_steps?: MixingStep[]   // guided mixing instructions

  // Development timing (developer recipes เท่านั้น)
  base_volume_ml?: number       // 1000 — สำหรับ scale สูตร
  optimal_temp?: { min: number; max: number }  // celsius
  develop_timing?: DevelopTiming

  // Agitation (developer recipes เท่านั้น)
  agitation?: AgitationSpec

  // Storage info
  storage?: StorageInfo

  // Chemistry constraints
  constraints?: RecipeConstraints

  // Authorship & visibility
  author_id?: string            // null = system recipe
  author_type: 'system' | 'personal' | 'community'
  visibility: 'private' | 'published'
  status: 'draft' | 'pending_review' | 'published'

  tags?: string[]
  references?: string[]         // URLs

  created_at: string            // ISO datetime
  updated_at: string
}
```

---

### RecipeStepType

```ts
type RecipeStepType =
  | 'developer'
  | 'stop'
  | 'fixer'
  | 'wash_aid'
  | 'wetting_agent'
```

---

### FilmCompatibility

```ts
type FilmCompatibility = {
  scope: 'general' | 'specific'
  films?: string[]              // ["hp5-plus", "delta-400"] ถ้า scope = 'specific'
  iso_range?: { min: number; max: number }  // optional hint
  notes?: string                // "ทดสอบแล้วได้ผลดีกับ HP5+ box speed"
}

// ตัวอย่าง:
// general: { scope: 'general' }
// specific: { scope: 'specific', films: ['hp5-plus'], notes: 'ทดสอบ N และ N+1' }
```

---

### ChemicalFormat (ไม่เปลี่ยน)

```ts
type ChemicalFormat =
  | 'powder_raw'          // ซื้อสารแยก ชั่งเองผสมเอง — ต้องมี chemicals[] + mixing_steps[]
  | 'powder_concentrate'  // ซอง dissolve ในน้ำ — ต้องมี mixing_steps[]
  | 'liquid_concentrate'  // เจือจาง — ต้องมี dilution
  | 'ready_to_use'        // เทใช้เลย — ไม่ต้องมี mixing_steps[]
  | 'diy'                 // household chemicals — ต้องมี chemicals[] + mixing_steps[]
```

---

### DilutionSpec (ไม่เปลี่ยน)

```ts
type DilutionSpec =
  | { type: 'fixed'; concentrate_parts: number; water_parts: number; label?: string }
  | { type: 'preset'; options: DilutionOption[]; default_label?: string }
  | { type: 'open'; suggested_ratios: DilutionOption[]; min_water_parts?: number; max_water_parts?: number }

type DilutionOption = {
  label?: string
  concentrate_parts: number
  water_parts: number
  notes?: string
}
```

---

### DevelopTiming

```ts
// Developer recipes: timing ขึ้นอยู่กับ temp และ/หรือ push/pull
type DevelopTiming = {
  type: 'fixed' | 'temp_table' | 'push_pull_table' | 'combined'
  fixed_seconds?: number
  temp_table?: TempTable        // temp_celsius → { 'N-2'?, 'N-1'?, N, 'N+1'?, 'N+2'? }
  push_pull_table?: PushPullTable
}

type TempTable = Record<number, Partial<Record<'N-2' | 'N-1' | 'N' | 'N+1' | 'N+2', number>>>

type PushPullTable = {
  base_temp_celsius: number
  entries: Partial<Record<'N-2' | 'N-1' | 'N' | 'N+1' | 'N+2', number>>
}
```

---

### AgitationSpec (ไม่เปลี่ยน)

```ts
type AgitationSpec =
  | { type: 'inversion'; initial_seconds: number; interval_seconds: number; duration_seconds: number }
  | { type: 'stand' }
  | { type: 'semi_stand'; initial_seconds: number }
  | { type: 'rotary'; rpm?: number }
  | { type: 'custom'; description: string }
```

---

### RecipeConstraints

ข้อมูล compatibility constraints ที่ app ใช้ validate Kit ก่อน session

```ts
type RecipeConstraints = {
  // สำหรับ developer recipes
  required_fixer_type?: 'standard' | 'alkaline'
  // 'alkaline' = Pyro developer (PMK Pyro, WD2D ฯลฯ) — ต้องใช้ TF-4, TF-5
  // ถ้าไม่ระบุ = 'standard' (ใช้ได้กับ fixer ทั่วไป)

  is_two_bath?: boolean
  // true = two-bath developer — Kit ต้องมี slot ที่เรียงถูกต้อง (Bath A → Bath B ห้ามแทรก stop)

  // สำหรับ fixer recipes
  fixer_grade?: 'film' | 'paper'
  // ส่วนใหญ่ระบุแค่ใน fixer recipes เพื่อ warn ถ้า user assign ผิด

  // สำหรับ developer recipes (reusable)
  reuse_compensation?: {
    max_rolls?: number            // จำนวน rolls สูงสุดก่อนทิ้ง
    time_increase_per_roll?: number // % ที่เพิ่มต่อ roll (0.25 = +25%)
    notes?: string
  }

  // Agitation time multiplier
  agitation_time_multipliers?: {
    inversion?: number            // 1.0 (baseline)
    rotary?: number               // 0.85 (-15%)
    stand?: number                // N/A สำหรับ stand dev (fixed time อยู่แล้ว)
  }

  // Volume constraints ตาม film format
  min_volume_ml?: {
    '35mm_1roll'?: number
    '35mm_2roll'?: number
    '120_1roll'?: number
    '4x5_1sheet'?: number
  }
}
```

---

### StorageInfo (ไม่เปลี่ยน)

```ts
type StorageInfo = {
  shelf_life?: string     // "6 months", "indefinite"
  container?: string      // "amber glass bottle, sealed"
  notes?: string
}
```

---

### Chemical (ไม่เปลี่ยน)

```ts
type Chemical = {
  name: string
  amount_per_liter: number
  unit: 'g' | 'ml'
  order: number           // ลำดับการเติม (chemistry constraint!)
  note?: string
}
```

---

### MixingStep (ไม่เปลี่ยน)

```ts
type MixingStep = {
  tokens: StepToken[]
  warning?: string
  chemicals?: string[]    // chemical names ที่เกี่ยวข้องใน step นี้
}

type StepToken =
  | { type: 'text'; value: string }
  | { type: 'var'; var: TemplateVar }

type TemplateVar =
  | { name: 'target_volume' }
  | { name: 'volume_pct'; pct: number }
  | { name: 'chemical_amount'; chemical_name: string }
  | { name: 'temperature'; celsius: number }
  | { name: 'dilution_concentrate' }
  | { name: 'dilution_water' }
```

---

## 2. InventoryItem

```ts
type InventoryItem = {
  id: string                    // uuid
  name: string                  // "Rodinal ขวดแรก" — user ตั้ง, prefill จาก recipe name
  recipe_id: string             // FK → Recipe (required เสมอ)
  recipe_snapshot?: {           // snapshot ของ recipe name ณ เวลาบันทึก
    name: string
    step_type: RecipeStepType
  }
  step_type: RecipeStepType     // copy จาก recipe — ใช้ filter slot ใน Kit
  bottle_type: 'one-shot' | 'reusable'

  // Lifecycle
  mixed_date: string            // ISO date — วันที่ผสมหรือเปิดขวด
  shelf_life_days?: number      // จาก recipe storage data หรือ user กรอกเอง
  use_count: number             // จำนวน rolls ที่ใช้ไปแล้ว (เพิ่มทุก session)
  max_rolls?: number            // warn เมื่อ use_count ≥ max_rolls

  // Status
  status: 'active' | 'exhausted' | 'expired'
  // 'exhausted' = one-shot ที่ถูกใช้แล้ว หรือ reusable ที่ user mark ว่าทิ้ง
  // 'expired' = เลย shelf_life_days แล้ว (คำนวณอัตโนมัติ)

  notes?: string
  created_at: string
  updated_at: string
}
```

**หมายเหตุ:** InventoryItem link กับ Recipe เสมอ แม้ user มีสูตรจากช่องทางอื่น ก็สร้าง personal recipe ก่อนได้เลย (ใส่แค่ชื่อ + step_type + timing) แล้วค่อย add เข้า inventory

---

## 3. Kit

```ts
type Kit = {
  id: string                    // uuid
  name: string                  // "HP5+ Standard Set" — user ตั้งเอง
  description?: string

  // Slots — ordered list ของ inventory items
  slots: KitSlot[]

  // Validation warnings (คำนวณ runtime ไม่ได้เก็บ)
  // - developer slot ว่าง → error (Kit ใช้ไม่ได้)
  // - fixer slot ว่าง → error
  // - stop slot ว่าง → warn (ใช้ water stop เป็น fallback ได้)
  // - fixer เป็น paper grade → error ถ้า session สำหรับ film

  created_at: string
  updated_at: string
}

type KitSlot = {
  id: string                    // uuid
  slot_type: KitSlotType        // ประเภทของ slot
  inventory_item_id: string | null  // FK → InventoryItem — null ถ้ายังไม่เลือก
  order: number                 // ลำดับ step ใน kit (0-based)
  optional: boolean             // wash_aid, wetting_agent เป็น optional
  notes?: string                // เช่น "water stop fallback"
}

type KitSlotType =
  | 'developer'
  | 'stop'
  | 'fixer'
  | 'wash_aid'
  | 'wetting_agent'
```

**ข้อสำคัญเรื่อง Slot ordering:**
- Two-bath developer: ต้องมี 2 developer slots เรียงต่อกัน (Bath A → Bath B)
- ห้ามมี stop slot ระหว่าง developer slots ใน two-bath
- App validate ก่อน session โดย check `recipe.constraints.is_two_bath`

**ข้อสำคัญเรื่อง Shared Inventory:**
- หลาย Kit สามารถ point ไป InventoryItem เดียวกันได้
- เมื่อ session ใช้ Kit → use_count เพิ่มสำหรับทุก InventoryItem ที่อยู่ใน slots (dedup ถ้า item เดียวอยู่หลาย slot)
- ถ้า InventoryItem ถูก exhaust หรือ expire → Kit ที่ชี้อยู่แสดง warning

---

## 4. DevSession (History)

```ts
type DevSession = {
  id: string                    // uuid

  // ที่มาของ session
  source: SessionSource

  // Session config
  film_format: '35mm' | '120' | '4x5' | 'other'
  rolls_count: number
  temperature_celsius: number
  dev_type: 'N-2' | 'N-1' | 'N' | 'N+1' | 'N+2'
  agitation_method: 'inversion' | 'rotation' | 'stand' | 'rotary'

  // Actual duration (อาจต่างจาก target ถ้า user pause นาน)
  target_duration_seconds: number
  actual_duration_seconds?: number

  // Inventory changes
  inventory_updates: InventoryUpdate[]

  // Result
  status: 'completed' | 'abandoned'
  notes?: string

  started_at: string
  completed_at?: string
  created_at: string
}

type SessionSource =
  | { type: 'kit'; kit_id: string; kit_name_snapshot: string }
  | { type: 'recipes'; recipe_ids: string[] }    // dev จาก community recipes โดยตรง

type InventoryUpdate = {
  inventory_item_id: string
  rolls_added: number           // ปกติ = rolls_count ของ session
  time_compensation_pct?: number  // % ที่เพิ่ม เช่น 25 = +25% สำหรับ reusable
}
```

---

## 5. Repository Interfaces

```ts
interface RecipeRepository {
  getAll(filter?: RecipeFilter): Promise<Recipe[]>
  getById(id: string): Promise<Recipe | null>
  getByStepType(type: RecipeStepType): Promise<Recipe[]>
  save(recipe: Recipe): Promise<void>
  delete(id: string): Promise<void>
}

type RecipeFilter = {
  step_type?: RecipeStepType
  author_type?: 'system' | 'personal' | 'community'
  visibility?: 'private' | 'published'
  film?: string                 // filter ด้วย film name
  search?: string               // full-text search
}

interface InventoryRepository {
  getAll(filter?: InventoryFilter): Promise<InventoryItem[]>
  getById(id: string): Promise<InventoryItem | null>
  getByStepType(type: RecipeStepType): Promise<InventoryItem[]>
  save(item: InventoryItem): Promise<void>
  updateUseCount(id: string, rolls_to_add: number): Promise<void>
  updateStatus(id: string, status: InventoryItem['status']): Promise<void>
  delete(id: string): Promise<void>
}

type InventoryFilter = {
  step_type?: RecipeStepType
  status?: InventoryItem['status']
  bottle_type?: 'one-shot' | 'reusable'
}

interface KitRepository {
  getAll(): Promise<Kit[]>
  getById(id: string): Promise<Kit | null>
  save(kit: Kit): Promise<void>
  delete(id: string): Promise<void>
}

interface SessionRepository {
  getAll(): Promise<DevSession[]>
  getById(id: string): Promise<DevSession | null>
  save(session: DevSession): Promise<void>
  getRecentSessions(limit: number): Promise<DevSession[]>
}
```

---

## 6. Kit Validation Rules (Runtime)

ก่อน user เริ่ม Dev Session จาก Kit ระบบต้อง validate:

```ts
type KitValidationResult = {
  valid: boolean
  errors: KitValidationError[]    // ต้องแก้ก่อนเริ่ม
  warnings: KitValidationWarning[] // แสดง warn แต่เริ่มได้
}

// Errors (block session)
type KitValidationError =
  | { type: 'missing_developer'; message: string }
  | { type: 'missing_fixer'; message: string }
  | { type: 'item_exhausted'; item_id: string; slot_type: KitSlotType }
  | { type: 'item_expired'; item_id: string; slot_type: KitSlotType }
  | { type: 'pyro_wrong_fixer'; developer_id: string; fixer_id: string }
    // developer ต้องการ alkaline fixer แต่ fixer ที่เลือกเป็น standard
  | { type: 'paper_fixer_on_film'; fixer_id: string }

// Warnings (แสดงแต่ไม่ block)
type KitValidationWarning =
  | { type: 'missing_stop'; message: 'water stop จะใช้เป็น fallback' }
  | { type: 'missing_wash_aid'; message: string }
  | { type: 'developer_near_max_rolls'; item_id: string; rolls_remaining: number }
  | { type: 'reusable_fixer_no_chemical_stop'; message: string }
    // fixer เป็น reusable แต่ stop slot ว่าง หรือใช้ water stop
    // warn เพราะ developer carry-over จะทำให้ fixer หมดเร็ว
```

---

## 7. Storage Strategy (per phase)

| Entity | Phase 1 (V2 rebuild) | Phase 2 (Backend) |
|--------|---------------------|-------------------|
| Recipes (system) | TypeScript static files | PostgreSQL + seed |
| Recipes (personal) | localStorage `v2-recipes` | PostgreSQL (tied to user) |
| InventoryItems | localStorage `v2-inventory` | PostgreSQL |
| Kits | localStorage `v2-kits` | PostgreSQL |
| Sessions | localStorage `v2-sessions` | PostgreSQL |
| User | N/A (no auth) | Google OAuth + users table |

**localStorage key naming:** ทั้งหมด prefix ด้วย `v2-` เพื่อแยกจาก V1 data (backward incompatible — throwaway)

---

## 8. Architecture: 2-Layer Design (ไม่เปลี่ยน)

### Layer 1 — Knowledge (static/curated)
- Recipes (system), film catalog
- Phase 1: TypeScript static files
- Phase 2+: PostgreSQL, seeded

### Layer 2 — User's World (dynamic/personal)
- InventoryItems, Kits, Sessions, personal Recipes
- Phase 1: localStorage (throwaway)
- Phase 3: PostgreSQL tied to user account

### Repository Pattern

Repository interface เดิม ยังคงใช้ pattern เดิม:
- `LocalRecipeRepository` → TypeScript static files
- `LocalInventoryRepository` → localStorage `v2-inventory`
- `LocalKitRepository` → localStorage `v2-kits`
- `LocalSessionRepository` → localStorage `v2-sessions`

Phase 2: swap เป็น `ApiRecipeRepository`, `ApiInventoryRepository` ฯลฯ โดยไม่แตะ component

---

## 9. ตัวอย่าง Data

### Recipe: Rodinal 1+50 (general)
```json
{
  "id": "rodinal-1-50-general",
  "slug": "rodinal-1-50-general",
  "name": "Rodinal 1+50",
  "step_type": "developer",
  "film_compatibility": { "scope": "general" },
  "chemical_format": "liquid_concentrate",
  "dilution": {
    "type": "open",
    "suggested_ratios": [
      { "concentrate_parts": 1, "water_parts": 25, "notes": "high acutance, more grain" },
      { "concentrate_parts": 1, "water_parts": 50, "notes": "balanced, most common" },
      { "concentrate_parts": 1, "water_parts": 100, "notes": "stand development" }
    ]
  },
  "develop_timing": {
    "type": "temp_table",
    "temp_table": {
      "18": { "N-1": 9, "N": 12, "N+1": 16 },
      "20": { "N-1": 8, "N": 11, "N+1": 14 },
      "24": { "N-1": 6, "N": 8,  "N+1": 11 }
    }
  },
  "agitation": { "type": "inversion", "initial_seconds": 30, "interval_seconds": 60, "duration_seconds": 10 },
  "storage": { "shelf_life": "years (opened)", "container": "original bottle", "notes": "เปิดแล้วเก็บได้หลายปี" },
  "author_type": "system",
  "visibility": "published",
  "status": "published"
}
```

### Recipe: Ilfostop (stop bath)
```json
{
  "id": "ilfostop",
  "slug": "ilfostop",
  "name": "Ilfostop",
  "step_type": "stop",
  "film_compatibility": { "scope": "general" },
  "chemical_format": "liquid_concentrate",
  "dilution": {
    "type": "fixed",
    "concentrate_parts": 1,
    "water_parts": 19,
    "label": "1+19"
  },
  "storage": { "shelf_life": "reuse until indicator changes color" },
  "author_type": "system",
  "visibility": "published",
  "status": "published"
}
```

### InventoryItem ที่ได้จาก Mixing Guidance
```json
{
  "id": "inv-001",
  "name": "Rodinal ขวดแรก",
  "recipe_id": "rodinal-1-50-general",
  "recipe_snapshot": { "name": "Rodinal 1+50", "step_type": "developer" },
  "step_type": "developer",
  "bottle_type": "reusable",
  "mixed_date": "2026-04-10",
  "shelf_life_days": null,
  "use_count": 3,
  "max_rolls": null,
  "status": "active",
  "notes": "ขวด 500ml ซื้อจาก Fotofile"
}
```

### Kit: HP5+ Standard Set
```json
{
  "id": "kit-001",
  "name": "HP5+ Standard Set",
  "slots": [
    {
      "id": "slot-001",
      "slot_type": "developer",
      "inventory_item_id": "inv-001",
      "order": 0,
      "optional": false
    },
    {
      "id": "slot-002",
      "slot_type": "stop",
      "inventory_item_id": "inv-002",
      "order": 1,
      "optional": false
    },
    {
      "id": "slot-003",
      "slot_type": "fixer",
      "inventory_item_id": "inv-003",
      "order": 2,
      "optional": false
    },
    {
      "id": "slot-004",
      "slot_type": "wetting_agent",
      "inventory_item_id": "inv-004",
      "order": 3,
      "optional": true
    }
  ]
}
```

---

## 10. Architecture Decisions (ตัดสินใจแล้ว)

### Film catalog — string array
`film_compatibility.films[]` ใช้ string array อิสระ (ไม่ normalize เป็น entity)

```ts
// ตัวอย่าง
film_compatibility: {
  scope: 'specific',
  films: ['ilford-hp5-plus', 'ilford-delta-400'],
  notes: 'ทดสอบกับ HP5+ box speed'
}
```

**Convention:** ใช้ kebab-case lowercase slug ("%brand%-name") เพื่อลด fuzzy mismatch
system recipes ใช้ slug มาตรฐาน — personal recipes กรอกอิสระ

---

### Two-bath slot ordering — auto-generate
เมื่อ user เลือก recipe ที่มี `constraints.is_two_bath = true` ระบบ auto-generate slots ให้:
- Slot 0: `developer` (Bath A) — required
- Slot 1: `developer` (Bath B) — required
- Slot 2: `fixer` — required
- ไม่มี stop slot (ห้ามแทรกระหว่าง Bath A → Bath B ตาม chemistry constraint)

User ไม่ต้อง drag หรือจัดเรียงเอง Kit validation จะ reject ถ้า stop ถูกแทรก

---

### Session Entry Point 2 — anonymous session (ไม่บังคับ inventory)
User สามารถรัน Dev Session จาก recipe โดยตรง โดยไม่ต้องมี InventoryItem:

```ts
type SessionSource =
  | { type: 'kit'; kit_id: string; kit_name_snapshot: string }
  | { type: 'recipes'; recipe_ids: string[] }    // anonymous — ไม่ track inventory
  | { type: 'anonymous'; recipe_ids: string[] }  // alias เดียวกัน, ไม่ update use_count
```

เมื่อ session มาจาก `type: 'recipes'` หรือ `type: 'anonymous'`:
- ไม่มี `inventory_updates` (array ว่าง)
- use_count ไม่ถูกเพิ่ม
- ยังบันทึก session history ได้

---

### Equipment Profile — user settings + session override (temporary)
EquipmentProfile เก็บที่ user settings (Phase 3 — tied to user account):

```ts
type EquipmentProfile = {
  tank_type?: string              // "Paterson System 4", "Jobo 1520"
  agitation_method?: 'inversion' | 'rotary' | 'stand'
  water_hardness?: 'soft' | 'medium' | 'hard'
  default_temperature_celsius?: number
}
```

**Session-level override:** user แก้ได้ต่อ session แต่ไม่ save กลับไป profile — เป็น temporary เท่านั้น

Phase 1 (V2 rebuild): Equipment settings อยู่ใน Settings tab, เก็บ localStorage `v2-equipment`
Phase 3: ย้ายไป user profile ใน PostgreSQL

---

### Prep Mode — multi-select + mode choice
ใน Mix tab เมื่อ user เข้าหน้า Mixing Guidance:

1. **Select recipes** — multiple choice checkboxes (developer, stop, fixer, etc.)
2. **Summary screen** — แสดง recipes ที่เลือก พร้อม total ingredients
3. **Mode choice:**
   - **Prep Mode** — แสดงทุก recipe พร้อมกัน (overview ก่อน mix)
   - **Step-by-Step Mode** — walk through ทีละ recipe ตามลำดับ

ไม่มี entity เพิ่มใน data model สำหรับ prep mode — เป็น UI state ล้วนๆ (Zustand session state)

---

### Navigation Structure — 5 Tabs
App ใช้ bottom navigation bar (mobile) / left sidebar (tablet+):

| Tab | เนื้อหา |
|-----|--------|
| **Dev** | Film Dev session — entry point หลัก |
| **Mix** | Mixing Guidance — multi-select recipe + guided flow |
| **Recipes** | Browse / Create / Favorites / Community recipes |
| **My Kit** | Inventory + Kits (sub-nav ภายใน tab) |
| **Settings** | Equipment profile, preferences |

Responsive: bottom nav บน mobile, sidebar บน tablet (768px+) และ desktop

---

## Related Files

- **V2 UX/Product requirements:** `../Analog Photographic/film-dev-guidance-ux-requirements-v2.md`
- **Chemistry domain knowledge:** `../Analog Photographic/film-chemistry-research.md`
- **V1 Data Model (reference):** `DATA_MODEL.md` (deprecated สำหรับ V2)
- **V1 Recipe Schema (reference):** `RECIPE_SCHEMA.md` (ยังใช้ได้บางส่วน — DilutionSpec, AgitationSpec, MixingStep ยังเหมือนเดิม)
