# Film Dev Guidance — User Flow V2

> **Status:** Planning · V2 (ยังไม่ implement)
> **Last updated:** 2026-04-14
> **Icon library:** Lucide React

> ⚠️ **V2 Rewrite** — เอกสารนี้ describe flows ของ V2 ทั้งหมด
> V1 flow (FLOW.md เดิม) ถูก archive ไว้ใน git history
> Product concept ดูที่: `../Analog Photographic/film-dev-guidance-ux-requirements-v2.md`

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

### V2 App Entities

| คำ | ความหมาย | หมายเหตุ |
|----|----------|---------|
| **Recipe** | สูตรสำหรับ **1 chemical step** — developer, stop, fixer, wash_aid หรือ wetting_agent | ไม่ใช่ bundle อีกต่อไป |
| **System Recipe** | Recipe ที่ทีม seed ไว้ ทุกคนใช้ได้ | verified + read-only |
| **Personal Recipe** | Recipe ที่ user สร้างเอง private by default | สร้างได้เร็ว ไม่ผ่าน review |
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
| **Time Compensation** | เพิ่มเวลา develop เมื่อขวด developer เป็น reusable — +25%/roll |
| **Kit Validation** | ตรวจ kit ก่อนเริ่ม session: developer+fixer required, stop recommended |

---

## App Structure — 5 Tabs

Navigation: **Bottom bar บน mobile / Left sidebar บน tablet (768px+) และ desktop**

```
App
├── Dev       — Film Dev session (timer, entry point หลัก)
├── Mix       — Mixing Guidance (multi-select recipe → guided flow → inventory)
├── Recipes   — Browse / Create / Favorites / Community recipes
├── My Kit    — Inventory + Kits (sub-nav ภายใน tab)
└── Settings  — Equipment profile, preferences
```

| Tab | Icon (Lucide) | Default landing |
|-----|--------------|-----------------|
| Dev | `Timer` | ใช่ — หน้าแรกที่เปิดแอพ |
| Mix | `FlaskConical` | ไม่ |
| Recipes | `BookOpen` | ไม่ |
| My Kit | `Package` | ไม่ |
| Settings | `Settings` | ไม่ |

---

## Flow 1 — Manage Recipes

### Overview
Section สำหรับจัดการสูตรทั้งหมดของ user และ browse community

### Entry points
- Bottom nav → "Recipes"
- ปุ่ม "ดูสูตร" จาก recipe detail ใน section อื่น

### Flow: Browse & Save

```
Recipes page
  ├─ Personal tab
  │     แสดง: personal recipes (private + published)
  │     → แตะ recipe → Recipe detail
  └─ Community tab
        Filter: step_type / film / search
        → แตะ recipe → Recipe detail
              → [Save เป็น Favourite] ← เพิ่มใน personal list
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
- "ใช้ใน Mixing Guidance" จาก recipe detail
- "ผสมน้ำยาใหม่" จาก My Kit / Inventory

### Flow: Mixing (รวม Prep Mode)

```
Mix page
  ├─ เลือก Recipe (multiple choice — checkboxes)
  │     Filter: step_type / film / search
  │     แสดง: personal + system recipes ที่มี mixing_steps
  │     user tick ✓ ได้หลาย recipe พร้อมกัน
  │     (เช่น tick developer + stop + fixer)
  │
  → [ดำเนินการต่อ] (enabled เมื่อเลือก ≥ 1)
  │
  → Summary screen
  │     แสดง recipes ที่เลือกทั้งหมด
  │     รวม ingredients overview (สรุปว่าต้องซื้อ/เตรียมอะไรบ้าง)
  │
  │     ┌─ [Prep Mode]           ← ดูทุก recipe overview ก่อน mix
  │     └─ [Step-by-Step Mode]   ← walk through ทีละ recipe
  │
  ├── Prep Mode path:
  │     แสดงทุก recipe พร้อมกัน — shopping list รวม + mix checklist แต่ละตัว
  │     user ไล่ tick ✓ ได้เองตามสะดวก (ไม่บังคับลำดับ)
  │
  └── Step-by-Step Mode path (ทีละ recipe):
        สำหรับแต่ละ recipe ที่เลือก (วนลูป):
        
          → เลือก Target Volume (scale จาก base_volume)
          → เลือก Dilution (ถ้า recipe มี dilution — fixed/preset/open)
          → [เริ่มผสม]

          → Shopping List
              แสดงสารเคมีทุกตัวที่ต้องชั่ง/ตวง (scaled ตาม target volume)
              tick ✓ แต่ละรายการ
              note ลำดับการใส่ที่ chemistry constraint กำหนด
            → [เตรียมครบแล้ว]

          → Mix Checklist
              guided step-by-step ตาม mixing_steps ของ recipe
              tick ✓ แต่ละ step
              Warning โดด (safety-critical)
              ไม่มี timer
            → [ผสมเสร็จแล้ว]

          → Prompt "บันทึกลง Inventory?"
              ├─ [บันทึก] → Add Inventory Item form
              │                prefill: ชื่อ (จาก recipe name), step_type, mixed_date = วันนี้
              │                กรอก: bottle_type (one-shot / reusable), notes (optional)
              │                → Save → recipe ถัดไป หรือ Mix page
              └─ [ข้ามไป] → recipe ถัดไป หรือ Mix page
```

**พฤติกรรม:**
- เลือกได้หลาย recipe แต่ guided ทีละ recipe เรียงตาม order ที่เลือก
- `ready_to_use` recipes ไม่มี shopping list / mix checklist — ข้าม prompt add inventory โดยตรง
- Prompt add inventory เป็น optional เสมอ
- Prep Mode vs Step-by-Step เป็น UI state ล้วนๆ (ไม่มี entity ใน data model)

---

## Flow 3 — Inventory & Kit

### Overview
จัดการขวดน้ำยาที่มีอยู่จริง และ สร้าง/จัดการ kit presets

### Entry points
- Bottom nav → "Inventory"

---

### Flow 3A — Inventory Management

```
Inventory page
  ├─ แสดง: ขวดทั้งหมด grouped by step_type หรือ status
  │         badge: expiring soon / exhausted / near max rolls
  ├─ [+ เพิ่มขวด] → Add manually (ถ้าไม่ได้ผ่าน Mixing Guidance)
  │                   เลือก recipe → กรอก mixed_date, bottle_type
  ├─ แตะขวด → Inventory item detail
  │             แสดง: recipe ที่ใช้, วันผสม, shelf life countdown
  │             แสดง: use_count / max_rolls
  │             [แก้ไข notes], [Mark as exhausted], [ลบ]
  └─ Expiry logic (คำนวณ real-time ไม่เก็บใน DB):
        status = 'expired' ถ้า mixed_date + shelf_life_days < วันนี้
        status = 'exhausted' ถ้า user mark หรือ one-shot ที่ใช้แล้ว
```

---

### Flow 3B — Kit Management

```
Inventory page → [Kit] tab
  ├─ แสดง: kit ทั้งหมด
  │         warning badge ถ้า item ใดใน kit expired/exhausted
  ├─ [+ สร้าง Kit ใหม่]
  └─ แตะ kit → Kit detail
                [แก้ไข], [ลบ]
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

  → Kit Validation (ก่อน Save):
      ❌ developer slot ว่าง → block save
      ❌ fixer slot ว่าง → block save
      ⚠️ stop slot ว่าง → warn "ถ้า fixer เป็น reusable แนะนำ chemical stop"
      ❌ pyro developer + non-alkaline fixer → block save + explain
      ❌ paper fixer + film session → block save

  → Save ✅
```

**Two-bath developer:**
- ถ้า inventory item ที่เลือกใน developer slot มี `recipe.constraints.is_two_bath === true`
  → auto-add developer slot ที่สองสำหรับ Bath B
  → ทั้งสอง slot อยู่ติดกันใน order เสมอ ห้ามแทรก stop ระหว่างกัน

---

## Flow 4 — Film Dev Guidance

### Overview
ล้างฟิล์มจริง — guided timer + deduct inventory usage + สร้าง history

### Entry points
- Bottom nav → "Develop"
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
    Browse community/system developer recipes
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
    │                     (dedup ถ้า item เดียวอยู่หลาย slot)
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
  │     แตะ kit → Session Setup พร้อม kit applied (1 tap)
  ├─ [ถ้าไม่มี kit] → "สร้าง Kit แรกของคุณ" → My Kit tab
  ├─ Recent Sessions (3–5 รายการล่าสุด)
  │     tap → session detail (read-only)
  └─ [+ เริ่ม session จาก recipe] → Entry point 2 (anonymous)
```

---

## localStorage Keys (Phase 2 — ก่อนมี backend)

| Key | เนื้อหา | Entity |
|-----|---------|--------|
| `v2-recipes` | personal recipes | `Recipe[]` |
| `v2-inventory` | inventory items | `InventoryItem[]` |
| `v2-kits` | kit presets | `Kit[]` |
| `v2-sessions` | session history | `DevSession[]` |
| `v2-settings` | app settings | settings object |
| `v2-equipment` | equipment profile | `EquipmentProfile` |

> หมายเหตุ: prefix `v2-` ทุก key เพื่อแยกจาก V1 data (`my-kit`, `my-kit-devkits` ฯลฯ) ชัดเจน

---

## Session State (Zustand — ไม่ใช่ localStorage)

```ts
// developStore.ts (V2)
type DevelopStoreState = {
  // Session config
  sessionSource: SessionSource | null       // { type: 'kit', ... } | { type: 'recipes', ... }
  filmFormat: FilmFormat | null
  rollsCount: number
  temperatureCelsius: number | null
  devType: DevType                          // 'N-2' | 'N-1' | 'N' | 'N+1' | 'N+2'

  // Equipment — prefill จาก user settings, override ได้ per-session (ไม่ save กลับ)
  agitationMethod: AgitationMethod          // temporary session override
  tankType: string | null                   // temporary session override

  // Timer state
  currentStepIndex: number
  isRunning: boolean
  isPaused: boolean
  remainingSeconds: number

  // Computed
  calculatedSteps: SessionStep[]            // steps พร้อม final_duration_seconds แล้ว
}

// mixStore.ts (V2) — Mixing Guidance UI state
type MixStoreState = {
  selectedRecipeIds: string[]               // recipes ที่ tick เลือก
  mode: 'prep' | 'step_by_step' | null      // เลือกหลัง summary screen
  currentRecipeIndex: number                // ใช้ใน step_by_step mode
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
| Prep mode | Multi-select recipes → summary → เลือก Prep Mode หรือ Step-by-Step |
| Navigation | 5 tabs: Dev / Mix / Recipes / My Kit / Settings |
| Responsive nav | Bottom bar (mobile) → Left sidebar (tablet 768px+) |
