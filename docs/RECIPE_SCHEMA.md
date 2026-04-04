# Recipe Schema Design

> การออกแบบ data model สำหรับ B&W film development recipes
> อ้างอิงจาก: Massive Dev Chart, filmdev.org, Ilford/Kodak/Adox technical datasheets
> Last updated: 2026-04-04

---

## 1. ความซับซ้อนที่พบในโลกจริง

จาก research พบว่า recipe ในโลกจริงมีความหลากหลายดังนี้:

### Chemical Formats
| Format | ตัวอย่าง | วิธีใช้ |
|--------|---------|--------|
| `powder_kit` | D-76, ID-11, Microphen | ผสมน้ำตามสูตร (อาจหลายขั้น) |
| `powder_raw` | Divided D-23 (ซื้อสาร individual) | ชั่งสารแต่ละตัวแล้วผสม |
| `liquid_concentrate` | HC-110, Rodinal/Adonal, Ilfosol 3 | เจือจางตาม dilution ratio |
| `ready_to_use` | บางแบรนด์ premium | เทใช้เลย ไม่ต้องผสม |

### Dilution Patterns
- **Fixed**: Ilfosol 3 → `1+9` เท่านั้น
- **Preset slots**: HC-110 มี dilution A/B/E/H (แต่ละ slot = recipe ต่างกัน)
- **Open ratio**: Rodinal → user เลือกเองได้ `1+25`, `1+50`, `1+100`, `1+200`
- **No dilution**: ready-to-use หรือ kit developer ที่ผสมแล้ว

### Agitation Styles
| Style | รายละเอียด |
|-------|-----------|
| `inversion` | กลับถัง — Kodak std: 30s initial + 5s ทุก 30s, Ilford std: 10s initial + 10s ทุกนาที |
| `stand` | ไม่กวน เลย — Rodinal 1+100 → 1 ชั่วโมง |
| `semi_stand` | กวนแค่ตอนแรก แล้วทิ้ง |
| `rotary` | Jobo drum — continuous, เวลาสั้นกว่า ~15% |

### Development Steps ที่เป็นไปได้ทั้งหมด
```
pre_wet (optional)  → developer  → stop  → fixer
→ wash_aid/hypo_clear (optional)  → wash  → wetting_agent (optional)  → dry
```

---

## 2. Core Entities

### 2.1 Recipe (root entity)

```ts
Recipe {
  id:           uuid
  slug:         string          // "divided-d23-v2", สำหรับ URL
  name:         string          // "Divided D-23"
  description:  string
  author_id:    uuid (FK → User)
  visibility:   'public' | 'private'
  status:       'draft' | 'pending_review' | 'published'
  tags:         string[]        // ["two-bath", "low-contrast", "tropical"]
  film_types:   string[]        // ["any"] | ["hp5", "delta-100"]
  references:   string[]        // URLs (datasheets, forum posts)
  base_volume_ml: number        // 1000 — สำหรับ scale สูตร
  optimal_temp:   { min: number, max: number }  // celsius

  // nested as JSONB in Postgres
  baths:          Bath[]        // อาจเป็น [] ถ้าไม่ต้องผสม
  develop_steps:  DevelopStep[]

  created_at:   timestamp
  updated_at:   timestamp
}
```

> **ทำไม JSONB?** `baths` และ `develop_steps` มี structure ที่ซ้อนกันลึกมาก (Chemical → MixingStep → template vars) query ส่วนใหญ่ดึงทั้ง recipe ไม่ได้ query ลงไปใน chemical individual ดังนั้น JSONB เหมาะกว่า normalized tables

---

### 2.2 Bath (สำหรับ mixing guide)

```ts
Bath {
  id:               string        // "bath-a", "stop-bath"
  name:             string        // "Bath A — Developer"
  role:             BathRole
  chemical_format:  ChemicalFormat
  mixing_required:  boolean       // derived: false ถ้า ready_to_use

  // สำหรับ liquid_concentrate เท่านั้น
  dilution?:        DilutionSpec

  // สำหรับ powder_kit / powder_raw
  chemicals?:       Chemical[]
  mixing_steps?:    MixingStep[]

  storage?: {
    shelf_life:  string    // "6 months"
    container:   string    // "brown glass bottle"
    notes?:      string
  }

  // Chemistry compatibility constraints (ดู section 6)
  required_fixer_type?: 'standard' | 'alkaline'
  // 'alkaline' สำหรับ pyro developers เท่านั้น (PMK Pyro, ABC Pyro ฯลฯ)
  // ถ้าไม่ระบุ = 'standard' (ใช้ได้กับ fixer ทุกชนิด)

  fixer_grade?: 'film' | 'paper'
  // บอกว่า recipe นี้ต้องการ film-grade fixer เสมอ
  // ส่วนใหญ่ระบุแค่ใน fixer bath เพื่อ warn user

  reuse_compensation?: {
    max_rolls?:               number  // จำนวน roll สูงสุดก่อนทิ้ง (เช่น 4)
    time_increase_per_roll?:  number  // สัดส่วนที่เพิ่มต่อ roll (0.25 = +25%)
    notes?:                   string  // "ใช้ได้ 4 rolls, เพิ่ม 25% ต่อ roll"
  }
}

BathRole = 'developer' | 'activator' | 'stop' | 'fixer' | 'wash_aid' | 'wetting_agent'
// 'activator' เพิ่มสำหรับ Bath B ของ two-bath systems

ChemicalFormat = 'powder_kit' | 'powder_raw' | 'liquid_concentrate' | 'ready_to_use'
```

---

### 2.3 DilutionSpec — จุดสำคัญ

นี่คือส่วนที่ต้องออกแบบให้รองรับทุก pattern:

```ts
DilutionSpec {
  type: 'fixed' | 'preset' | 'open'
}

// fixed — มี dilution เดียว เช่น Ilfosol 3 (1+9)
DilutionSpec_Fixed {
  type: 'fixed'
  concentrate_parts: number   // 1
  water_parts:       number   // 9
  label?:            string   // "standard"
}

// preset — มีหลาย slot ที่ตั้งชื่อไว้ เช่น HC-110 Dilution A/B/E/H
DilutionSpec_Preset {
  type: 'preset'
  options: {
    label:             string   // "Dilution B"
    concentrate_parts: number   // 1
    water_parts:       number   // 31
    notes?:            string   // "most popular"
  }[]
  default_label?: string        // "Dilution B"
}

// open — user กรอกเองได้ เช่น Rodinal
DilutionSpec_Open {
  type: 'open'
  suggested_ratios: {
    concentrate_parts: number   // 1
    water_parts:       number   // 50
    notes?:            string   // "most common, 400 ISO films"
  }[]
  min_water_parts?: number      // ป้องกัน too concentrated
  max_water_parts?: number
}
```

**ตัวอย่างการใช้งาน:**
```json
// HC-110
"dilution": {
  "type": "preset",
  "options": [
    { "label": "Dilution A", "concentrate_parts": 1, "water_parts": 15 },
    { "label": "Dilution B", "concentrate_parts": 1, "water_parts": 31, "notes": "most popular" },
    { "label": "Dilution E", "concentrate_parts": 1, "water_parts": 47 },
    { "label": "Dilution H", "concentrate_parts": 1, "water_parts": 63 }
  ],
  "default_label": "Dilution B"
}

// Rodinal
"dilution": {
  "type": "open",
  "suggested_ratios": [
    { "concentrate_parts": 1, "water_parts": 25,  "notes": "high acutance, more grain" },
    { "concentrate_parts": 1, "water_parts": 50,  "notes": "balanced, most common" },
    { "concentrate_parts": 1, "water_parts": 100, "notes": "stand development" }
  ]
}
```

---

### 2.4 Chemical

```ts
Chemical {
  name:              string    // "Sodium Sulphite"
  amount_per_liter:  number    // 100 (grams หรือ ml ตาม unit)
  unit:              'g' | 'ml'
  order:             number    // ลำดับการผสม (chemistry constraint!)
  note?:             string    // "เติมก่อน Metol เสมอ"
}
```

---

### 2.5 MixingStep + Template Variables

นี่คือส่วนที่ซับซ้อนที่สุด ปัญหาของ approach ปัจจุบันคือ hardcode string เช่น `"เทน้ำอุ่น {volume_75pct} ml"` ซึ่งไม่ flexible

**แนวทางที่แนะนำ: Structured Step แทน Template String**

แทนที่จะเก็บ instruction เป็น string ที่มี `{variable}` ให้เก็บเป็น structured array ของ "tokens":

```ts
MixingStep {
  tokens:   StepToken[]    // ดูด้านล่าง
  warning?: string
  chemicals?: string[]    // chemical names ที่เกี่ยวข้องใน step นี้
}

StepToken =
  | { type: 'text';    value: string }
  | { type: 'var';     var: TemplateVar }

TemplateVar =
  | { name: 'target_volume' }           // เช่น 1000 ml (ผู้ใช้เลือก)
  | { name: 'volume_pct'; pct: number } // 75% ของ target_volume
  | { name: 'chemical_amount'; chemical_name: string }  // คำนวณจาก amount_per_liter × volume
  | { name: 'temperature'; celsius: number }            // "50°C"
  | { name: 'dilution_concentrate' }    // ปริมาณ concentrate (จาก dilution ratio)
  | { name: 'dilution_water' }          // ปริมาณน้ำ (จาก dilution ratio)
```

**ตัวอย่าง:**
```json
// "เทน้ำอุ่น 750 ml ลงในภาชนะ"
{
  "tokens": [
    { "type": "text", "value": "เทน้ำอุ่น " },
    { "type": "var",  "var": { "name": "volume_pct", "pct": 75 } },
    { "type": "text", "value": " ml ลงในภาชนะ" }
  ]
}

// "เติม Sodium Sulphite 100 g"
{
  "tokens": [
    { "type": "text", "value": "เติม Sodium Sulphite " },
    { "type": "var",  "var": { "name": "chemical_amount", "chemical_name": "Sodium Sulphite" } },
    { "type": "text", "value": " g" }
  ],
  "chemicals": ["Sodium Sulphite"]
}
```

**ข้อดีของ approach นี้:**
- UI render ได้ถูกต้องทุก unit (metric/imperial)
- Scale ตาม target volume ได้อัตโนมัติ
- แปลภาษาได้ง่าย (token เป็น i18n key ได้)
- Validate ได้ว่า var reference ชี้ไปที่ chemical ที่มีอยู่จริง

---

### 2.6 DevelopStep

```ts
DevelopStep {
  id:       string       // "developer", "stop", "fixer-1"
  name:     string       // "Developer Bath"
  type:     StepType
  duration: DurationSpec
  agitation?: AgitationSpec
  temp_table?: TempTable   // ถ้า duration ขึ้นกับ temp
  push_pull_table?: PushPullTable  // ถ้า duration ขึ้นกับ N-1/N/N+1
  bath_ref?:  string      // Bath.id ที่ใช้ใน step นี้
  warnings?:  string[]
  transition_warning?: string
  optional?:  boolean
  optional_note?: string

  // Chemistry modularity constraints (ดู section 6)
  must_follow_immediately?: boolean
  // true = ห้ามแทรก step อื่นระหว่าง step นี้กับ step ถัดไปใน recipe
  // ใช้สำหรับ two-bath developer: Bath A → Bath B ต้องติดกันเสมอ
  // UI ต้องไม่แสดงปุ่ม "เพิ่ม step" ระหว่าง steps ที่ marked ว่า must_follow_immediately
}

StepType = 'pre_wet' | 'developer' | 'activator' | 'stop' | 'fixer'
         | 'wash_aid' | 'wash' | 'wetting_agent' | 'dry'
// หมายเหตุ: 'activator' เพิ่มเพื่อรองรับ Bath B ของ two-bath systems
```

---

### 2.7 Duration — รองรับทุกกรณี

```ts
DurationSpec =
  | { type: 'fixed';    seconds: number }
  | { type: 'variable'; default_seconds?: number; key?: string }  // user กำหนดเอง
  | { type: 'temp_table' }    // ดูจาก TempTable
  | { type: 'push_pull_table' }  // ดูจาก PushPullTable
  | { type: 'combined' }      // ดูจากทั้ง temp + push/pull ร่วมกัน

// TempTable: temp_celsius → duration
TempTable = Record<number, {
  'N-2'?: number
  'N-1'?: number
  'N':    number
  'N+1'?: number
  'N+2'?: number
}>

// PushPullTable: เมื่อ base temp fixed (เช่น 20°C) แต่ต้องการ override ตาม push/pull
PushPullTable = {
  base_temp_celsius: number
  entries: Record<'N-2' | 'N-1' | 'N' | 'N+1' | 'N+2', number>
}
```

**ตัวอย่าง:**
```json
// D-76 1+1 at various temps + push/pull
"duration": { "type": "combined" },
"temp_table": {
  "18": { "N-1": 9, "N": 11, "N+1": 14 },
  "20": { "N-1": 8, "N": 10, "N+1": 12 },
  "24": { "N-1": 6, "N": 7,  "N+1": 9  }
}
```

---

### 2.8 AgitationSpec

```ts
AgitationSpec =
  | { type: 'inversion'; initial_seconds: number; interval_seconds: number; duration_seconds: number }
  | { type: 'stand' }
  | { type: 'semi_stand'; initial_seconds: number }
  | { type: 'rotary';     rpm: number }
  | { type: 'custom';     description: string }
```

---

## 3. Database Schema (Drizzle)

```ts
// recipes table — เก็บ nested data เป็น JSONB
export const recipes = pgTable('recipes', {
  id:             uuid('id').primaryKey().defaultRandom(),
  slug:           varchar('slug', { length: 100 }).unique().notNull(),
  name:           varchar('name', { length: 200 }).notNull(),
  description:    text('description'),
  author_id:      uuid('author_id').references(() => users.id),
  visibility:     varchar('visibility', { length: 20 }).default('public'),
  status:         varchar('status', { length: 30 }).default('draft'),
  tags:           text('tags').array(),
  film_types:     text('film_types').array(),
  references:     text('references').array(),
  base_volume_ml: integer('base_volume_ml').default(1000),
  optimal_temp:   jsonb('optimal_temp'),       // { min, max }
  baths:          jsonb('baths').default([]),   // Bath[]
  develop_steps:  jsonb('develop_steps'),       // DevelopStep[]
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// users table (Phase 2b)
export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  google_id:    varchar('google_id', { length: 100 }).unique().notNull(),
  email:        varchar('email', { length: 255 }).unique().notNull(),
  display_name: varchar('display_name', { length: 100 }),
  avatar_url:   text('avatar_url'),
  role:         varchar('role', { length: 20 }).default('user'),  // 'user' | 'admin'
  created_at:   timestamp('created_at').defaultNow(),
});
```

---

## 4. เปรียบเทียบ: Template String vs Structured Tokens

| | Template String `{variable}` | Structured Tokens |
|--|--|--|
| ง่ายสำหรับ author | ✅ เขียนเป็น text ธรรมดา | ⚠️ ต้องเข้าใจ structure |
| Validate ได้ | ❌ ตรวจยาก | ✅ validate ได้ทุก field |
| i18n / แปลภาษา | ❌ ยาก | ✅ ง่าย |
| Scale/compute | ⚠️ regex replace | ✅ traverse token array |
| Render UI ที่ซับซ้อน | ❌ ต้องแยก parse | ✅ map ตรงๆ |
| **แนะนำสำหรับ phase** | Phase 2a (seed ข้อมูล) | Phase 3a (user-created) |

> **แนวทาง pragmatic**: Phase 2a ใช้ template string ต่อไปก่อน (เพราะ static data ที่เราควบคุมได้) แล้วค่อย migrate ไป structured tokens ตอนเปิด community submit ใน Phase 3a

---

## 5. Recipe ตัวอย่างที่ต้องรองรับ

### A. Powder Raw (Divided D-23) — มีอยู่แล้ว
- 2 baths, powder_raw, ไม่มี dilution
- temp_table + push_pull_table

### B. Liquid Concentrate (HC-110)
- 1 bath, liquid_concentrate, dilution type = preset (A/B/E/H)
- ไม่ต้อง mixing guide (แค่เจือจาง)
- temp_table ตาม film + dilution

### C. Ready-to-Use (Ilford Ilfosol 3)
- 1 bath, liquid_concentrate, dilution type = fixed (1+9)
- ไม่ต้อง mixing guide
- one-shot (ใช้แล้วทิ้ง)

### D. Stand Development (Rodinal 1+100)
- 1 bath, liquid_concentrate, dilution type = open
- develop_step duration = fixed (3600s = 1 ชั่วโมง)
- agitation = { type: 'stand' }
- ไม่มี temp_table (stand dev ไม่ sensitive ต่อ temp)

### E. Kit Developer (D-76 powder kit)
- 1 bath, powder_kit
- mixing_steps: เทน้ำร้อน → เทผง → เติมน้ำเย็นให้ครบ
- dilution type = preset (stock / 1+1 / 1+3)

---

## 6. Chemistry Modularity — ระดับที่ steps สามารถ mix & match ได้

> Research-based findings (2026-04-04) สำหรับออกแบบว่า recipe steps ควร coupled หรือ independent แค่ไหน
> Domain knowledge แบบละเอียด (ไม่มี code) อยู่ที่: `../Analog Photographic/film-chemistry-research.md`

### หลักการใหญ่: ~95% Modular

B&W film chemistry ทำงานเป็น independent modules โดยธรรมชาติ เพราะแต่ละ step ทำงานด้วย chemistry คนละแบบ:
- Developer ทำงานใน alkaline environment
- Stop bath แค่ neutralize pH — ไม่ interact กับ developer molecule โดยตรง
- Fixer ทำงานกับ silver halide ที่เหลือ — ไม่สนใจว่า developer คืออะไร

ผลคือ **photographer สามารถใช้ developer ยี่ห้อนึง กับ stop bath และ fixer ของอีกยี่ห้อได้เลย** โดยไม่มีปัญหา เป็น practice ปกติมากใน darkroom จริง

### Compatibility Matrix

| Step | Developer | Stop Bath | Fixer | Wash Aid | Wetting Agent |
|------|-----------|-----------|-------|----------|---------------|
| **Developer** | — | ✅ any | ✅ any | ✅ any | ✅ any |
| **Stop Bath** | ✅ any | — | ✅ any | ✅ any | ✅ any |
| **Fixer** | ✅ any* | ✅ any | — | ✅ any | ✅ any |
| **Wash Aid** | ✅ any | ✅ any | ✅ any | — | ✅ any |
| **Wetting Agent** | ✅ any | ✅ any | ✅ any | ✅ any | — |

*ยกเว้น constraints ที่ระบุด้านล่าง

### Constraints (ข้อยกเว้นที่สำคัญ)

#### 1. Two-Bath Developer — ห้ามแทรก stop ระหว่าง baths
**เคสที่เจอ:** Divided D-23, Stoeckler two-bath, และ two-bath systems ทั้งหมด

```
❌ Bath A → Stop → Bath B   (ทำลาย mechanism)
✅ Bath A → Bath B → Stop   (ถูกต้อง)
```

Bath B (Borax/activator) ทำงานโดย activate developer ที่ emulsion ดูดซึมมาจาก Bath A หาก stop bath เข้ามาก่อน developer ใน emulsion จะถูก neutralize ก่อน Bath B จะทำงานได้ — กระบวนการล้มเหลว

**หลัง Bath B ปกติ:** stop bath ใดก็ได้ ทำงานได้ปกติ (Borax alkaline + acid stop = pH neutralization ธรรมดา)

**Schema implication:** DevelopStep ต้องมี field `must_follow_immediately: boolean` เพื่อ enforce ว่าห้าม inject step อื่นระหว่างนี้

#### 2. Pyro Developer — ต้องใช้ fixer พิเศษ
**เคสที่เจอ:** Pyrogallol, Pyrocatechin-based developers (PMK Pyro, WD2D, ABC Pyro)

- Standard sodium thiosulfate (hypo) fixer → ทำให้เกิด stain ที่ไม่พึงประสงค์ / fixer ไม่ทำงานถูกต้อง
- ต้องใช้ **alkaline fixer** เท่านั้น: TF-4, TF-5, Formulary TF-5

**Schema implication:** Bath (developer) ต้องมี `required_fixer_type?: 'standard' | 'alkaline'` และ validate ก่อน session

#### 3. Film Fixer ≠ Paper Fixer
Fixer formulation ต่างกัน ใช้แทนกันไม่ได้ recipe ควรระบุ `fixer_grade: 'film' | 'paper'` เพื่อ warn user

### Stop Bath: Optional หรือ Required?

ขึ้นอยู่กับ **fixer reuse strategy** ของ user ไม่ใช่ developer:

| Fixer strategy | Stop Bath | เหตุผล |
|----------------|-----------|--------|
| One-shot (ทิ้งทุกครั้ง) | Optional — water stop ก็พอ | ไม่ต้อง extend fixer life |
| Reusable | **แนะนำ chemical stop** | Carry-over developer alkalinity exhausts fixer เร็วขึ้น มาก |

**App implication:** ถ้า My Kit ระบุว่า user ใช้ reusable fixer → warn ถ้า recipe ใช้ water stop เท่านั้น

### Wash Aid และ Wetting Agent

**สมบูรณ์แบบที่สุดในแง่ modularity** — ใช้ได้กับทุก combination ไม่มี constraint เลย:
- Wash aid (sodium sulfite / Kodak HCA / Ilford Washaid) → interchangeable ทั้งหมด
- Wetting agent (Photo-Flo / Ilfotol / ฯลฯ) → interchangeable ทั้งหมด
- ข้อควรระวังเดียว: อย่าใส่ wetting agent ลงใน developer (foam) — เป็น user error ไม่ใช่ compatibility issue

### Summary: Schema Design Implication

| Constraint Type | Scope | ต้อง enforce ใน schema? |
|----------------|-------|------------------------|
| Two-bath: no inter-bath rinse | Recipe-level (step order) | ✅ Phase 1 — `must_follow_immediately` |
| Pyro: alkaline fixer required | Recipe-level (developer type) | ⚠️ Phase 2+ เมื่อ support pyro recipe |
| Film vs paper fixer | Bath-level | ⚠️ Phase 2+ |
| Stop bath optional (one-shot fixer) | User Kit level | ⚠️ Phase 1b — My Kit suggestion logic |
| Everything else | N/A | ❌ ไม่ต้อง — modular โดยธรรมชาติ |

---

## 7. Development Variables ที่กระทบ Schema

### Agitation method → time adjustment

Recipe ต้องรองรับ time adjustment ตาม agitation method ที่ user ใช้ โดยเฉพาะ rotary (Jobo) ซึ่งเร็วกว่า inversion ~15%

```ts
// DevelopStep เพิ่ม field นี้ใน Phase 2+
agitation_time_multipliers?: {
  inversion?: number   // 1.0 (baseline)
  rotary?:    number   // 0.85 (15% less time)
  stand?:     number   // N/A — stand dev มี fixed time อยู่แล้ว
}
```

### Reusable developer → time compensation

Recipe ที่ reusable developer ควรมี compensation guideline:

```ts
// Bath เพิ่ม optional field นี้
reuse_compensation?: {
  max_rolls?: number              // จำนวน roll สูงสุดก่อนทิ้ง
  time_increase_per_roll?: number // % ที่เพิ่มต่อ roll เช่น 0.25 = +25%
  notes?: string                 // "ใช้ได้ 4 rolls, เพิ่ม 25% ต่อ roll"
}
```

### Film format → minimum volume constraint

```ts
// Bath เพิ่ม field นี้
min_volume_ml?: {
  '35mm_1roll':  number   // 300 ml
  '35mm_2roll':  number   // 500 ml
  '120_1roll':   number   // 500 ml
  '4x5_1sheet':  number   // 300 ml ขึ้นกับ tank
}
```

---

## 7. คำถามที่ยังต้องตัดสินใจ

1. **Film catalog** — ควร normalize `film_types` เป็น `films` table แยก เพื่อ search/filter ได้ดีขึ้น ไหม? หรือเก็บเป็น string array ก่อน?
   > **Tentative:** เก็บเป็น string array ก่อน (Phase 2a) แล้วค่อย normalize เมื่อมี community features (Phase 3)

2. **Developer catalog** — ควรมี `chemicals` table สำหรับ developer brands (Rodinal, HC-110 ฯลฯ) แยกจาก recipe? ประโยชน์: filter "recipes ที่ใช้ HC-110" ได้ง่าย
   > **Tentative:** เก็บเป็น string ใน recipe ก่อน — ถ้า My Kit ต้องการ match จะใช้ fuzzy match แทน foreign key ใน Phase 2

3. **Versioning** — ถ้า published recipe ถูกแก้ เก็บ history ไว้ใน `recipe_versions` table ไหม?
   > **Deferred to Phase 3b** — ไม่ implement จนกว่าจะมี community recipe จริง

4. **Minimum volume** — HC-110 มี minimum concentrate per roll (6ml/roll) ควรเก็บ constraint นี้ที่ไหน?
   > **Resolved:** เก็บใน `Bath.min_volume_ml` เป็น per-format lookup (ดูหัวข้อ 6 ข้างบน)
