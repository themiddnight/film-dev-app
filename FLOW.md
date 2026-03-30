# Film Dev Guidance — User Flow & Requirements

> **Status:** Planning · Phase 1 (Frontend only, static JSON)
> **Last updated:** 2026-03-30
> **Icon library:** Lucide React (sync กับ Figma ผ่าน Lucide Icons plugin)

---

## Terminology

| คำ | ความหมาย | ตัวอย่าง |
|----|----------|----------|
| **Bath** | ชุด developer solution ที่ผสมจาก raw chemicals — สูตรหนึ่งอาจมี 1 หรือ 2 bath | Bath A (Developer), Bath B (Activator) ใน Divided D-23 |
| **Process Step** | ขั้นตอนการล้างฟิล์มแต่ละขั้น ครอบคลุมทั้ง bath และ chemical อื่นๆ | Develop (Bath A+B), Stop Bath, Fix, Wash, Dry |
| **Prep** | การชั่ง/ตวงสารเคมีให้ครบก่อนเริ่มผสม | เตรียม Metol 7.5g, Sodium Sulphite 100g ก่อน |
| **Mix** | การผสมสารเคมีตามขั้นตอนจริง | เทน้ำ → ใส่ Sodium Sulphite → ใส่ Metol → เติมน้ำ |

---

## Overview

App มี 4 flow หลัก แบ่งเป็น 2 กลุ่ม:

| # | Flow | Phase |
|---|------|-------|
| 1 | **Mixing Guide** — ผสมน้ำยา step-by-step | Phase 1 ✅ |
| 2 | **Develop Session** — ล้างฟิล์ม real-time timer | Phase 1 ✅ |
| 3 | **Create Recipe** — สร้างสูตรใหม่ | Phase 2 (planned) |
| 4 | **Community Contribute** — ผู้ใช้ contribute สูตร | Phase 3 (planned) |

---

## Flow 1 — Mixing Guide

มี 2 sub-flow ที่ผลลัพธ์เหมือนกัน ต่างกันที่ลำดับการ Prep และ Mix

### Sub-flow A — Prep Mode
เหมาะสำหรับคนที่ผสมใหม่ทั้งชุด ชั่ง/ตวงสารเคมีทุก bath/process step ให้ครบก่อน แล้วค่อยไล่ผสมทีละ bath

```
Home
  → เลือกสูตร
    → เลือก Process Steps ที่จะทำ (multi-select) + ตั้ง Target Volume + เลือก Prep Mode
      → [PREP] Shopping List รวมทุก step ที่เลือก
          tick ✓ ชั่ง/ตวงสารเคมีแต่ละรายการให้ครบ (grouped by bath/step)
        → [MIX] ผสม Process Step 1 — Mix Checklist
        → [MIX] ผสม Process Step 2 — Mix Checklist
        → ...
        → Done ✅
```

### Sub-flow B — Step-by-Step Mode
เหมาะสำหรับคนที่ทำทีละ step เช่น fixer ยังเหลือ ผสมแค่ develop กับ stop

```
Home
  → เลือกสูตร
    → เลือก Process Steps ที่จะทำ (multi-select) + ตั้ง Target Volume + เลือก Step-by-Step Mode
      → Process Step 1:
          [PREP] Shopping List ของ step นี้ — tick ✓ ชั่ง/ตวงให้ครบ
          [MIX]  Mix Checklist — ผสมตามขั้นตอน
        → Process Step 2:
          [PREP] Shopping List ของ step นี้
          [MIX]  Mix Checklist
        → ...
        → Done ✅
```

### Selection Screen — fields

**User กำหนดได้ (input)**
| Field | Type | Default | หมายเหตุ |
|-------|------|---------|----------|
| Process Steps ที่จะทำ | multi-select | ทั้งหมด | เช่น ยกเลิก Fixer เพราะยังเหลือ |
| Target volume | number (free input) | 1000 ml | หน่วยตาม settings (metric/imperial) ใช้กับทุก step ที่เลือก |
| Mode | Prep / Step-by-Step | ค่าล่าสุดจาก localStorage | |

**ระบบคำนวณให้ตาม ratio (read-only)**
| Field | คำอธิบาย |
|-------|----------|
| ปริมาณสารเคมีแต่ละตัว | scale จาก base_volume ของสูตร → target volume |
| ปริมาณน้ำในแต่ละ step | recalculate ตาม target volume |

**คงที่เสมอ (ไม่ปรับได้)**
| Field | เหตุผล |
|-------|--------|
| ลำดับการใส่สารเคมี | chemistry constraint — ห้ามเปลี่ยน |
| Note / Warning ประจำ step | safety-critical information |

### PREP — Shopping List behavior
- แสดงสารเคมีทุกตัวที่ต้องชั่ง/ตวง
- Prep Mode: รวมทุก process step ที่เลือกในหน้าเดียว (grouped by bath/step)
- Step-by-Step Mode: แสดงเฉพาะ step ปัจจุบัน
- แต่ละรายการ tick ✓ ได้ (track ว่าชั่งแล้ว)
- ปริมาณ recalculate ตาม target volume แล้ว
- note เตือนลำดับการใส่ถ้ามี เช่น "(ชั่งไว้ก่อน ใส่หลัง Sodium Sulphite)"

**ตัวอย่าง Shopping List — Prep Mode (500 ml, เลือก Bath A + Stop Bath):**
```
Bath A — Developer
  □ Sodium Sulphite   50 g    (ใส่ก่อน Metol)
  □ Metol              3.75 g  (ใส่หลัง Sodium Sulphite)

Stop Bath
  □ Potassium Metabisulphite   10–12.5 g

[เตรียมครบแล้ว → เริ่มผสม Bath A]
```

### MIX — Checklist behavior
- แสดงขั้นตอนการผสมทีละ step ตามลำดับที่กำหนดในสูตร
- tick ✓ แต่ละ step ได้
- Warning สำคัญแสดงโดด เช่น "ใส่ Metol หลัง Sodium Sulphite เสมอ"
- ไม่มี timer
- หลังผสมเสร็จ 1 step → ไป step ถัดไป (ตาม mode ที่เลือก) หรือ Done

---

## Flow 2 — Develop Session

### Journey
```
Home
  → เลือกสูตร (Recipe Select)
    → Step Preview  ← ตั้งค่าและ custom ก่อนเริ่ม
      → Active Timer (loop ทีละ step)
        → Step Complete (transition)
        → (next step...)
      → All Done 🎉
```

### Step Preview — fields

**User กำหนดได้ (input)**
| Field | Type | Default | หมายเหตุ |
|-------|------|---------|----------|
| Development type | N-1 / N / N+1 | N | ปรับ contrast |
| อุณหภูมิน้ำยา | number | — | app คำนวณเวลา Bath A จาก temp table |
| เวลาแต่ละ step | number (per step) | จาก JSON | override ได้, save ใน localStorage |

**ระบบคำนวณให้ (read-only)**
| Field | คำอธิบาย |
|-------|----------|
| เวลา Bath A | lookup จาก temp × development type table |
| เวลา Bath B | คงที่ 5 นาทีเสมอ (สำหรับ Divided D-23) |
| เวลา Fixer | default จาก JSON, override ได้ |

**ปุ่ม Reset** — กลับค่าทั้งหมดเป็น default จาก JSON (ล้าง localStorage overrides)

### Active Timer — behavior
- Countdown ใหญ่ — readable at a glance
- Progress bar แสดง step ปัจจุบัน / ทั้งหมด
- Warning ของ step นั้น แสดงตลอด (เช่น "เท Bath A กลับขวดทันทีเมื่อเสร็จ")
- Agitation reminder — แจ้งเตือนตามเวลาที่กำหนดในสูตร (ปรับ type ได้ใน Settings)
- ปุ่ม Pause
- ปุ่ม "Step ต่อไป" — active ได้เมื่อหมดเวลา (หรือ override กด early ได้)
- เมื่อหมดเวลา → แจ้งเตือน → แสดงหน้า Step Complete

### Step Complete — behavior
- แสดง warning สำหรับ transition ไป step ถัดไป (เช่น "ห้ามล้างน้ำก่อนเท Bath B")
- แสดง step ถัดไปพร้อมเวลา
- กด "เริ่ม [step ถัดไป]" เพื่อไปต่อ

### Fixer time
- Default จาก JSON (เช่น 8 นาที)
- User override ได้ใน Step Preview (เช่น ถ้าวัด clearing time จริง → × 2)
- Save ใน localStorage

---

## Flow 3 — Create Recipe (Phase 2, planned)

### Journey (draft)
```
Admin / My Recipes
  → New Recipe
    → Recipe Info (ชื่อ, description, tags, base volume)
      → Add Bath/Step (loop)
        → Add Chemical (ชื่อ, ปริมาณ per base volume, ลำดับ, note)
        → Add Instruction step (text, warning flag, timer? )
      → Development Time Table (temp × N/N+1/N-1)
      → Review & Save
        → บันทึกใน localStorage (Phase 2) / POST to API (Phase 3)
```

> ยังไม่ implement ใน Phase 1 แต่ออกแบบ data model รองรับไว้แล้ว

---

## Flow 4 — Community Contribute (Phase 3, planned)

### Journey (draft)
```
Browse Recipes
  → Login / Sign up (required)
    → Submit Recipe (ใช้ Create Recipe flow เดิม)
      → Pending review (moderation queue)
        → Approved → แสดงใน public recipe list
        → Rejected → แจ้ง user พร้อมเหตุผล
```

> ต้องมี auth, moderation dashboard, และ backend API

---

## Settings

| Setting | Type | Default | เก็บที่ |
|---------|------|---------|--------|
| Agitation reminder: Sound | boolean | true | localStorage |
| Agitation reminder: Vibrate | boolean | true | localStorage |
| Agitation reminder: Screen Flash | boolean | false | localStorage |
| Theme | dark / light | dark | localStorage |
| Unit | metric / imperial | metric | localStorage |

> ข้อมูลสูตรเก็บเป็น metric เสมอ — แปลงหน่วยเฉพาะตอน display

---

## Data Model (Recipe JSON)

ออกแบบให้รองรับสูตรหลากหลาย ไม่ผูกกับ Divided D-23

```ts
// types/recipe.ts (draft)

type Chemical = {
  name: string           // "Metol", "Sodium Sulphite"
  amount_per_liter: number  // ปริมาณต่อ 1 ลิตร (metric เสมอ)
  unit: "g" | "ml"
  order: number          // ลำดับการใส่ — ห้ามเปลี่ยน
  note?: string          // "ใส่หลัง Sodium Sulphite เสมอ"
}

type MixingStep = {
  instruction: string    // "เทน้ำ {volume_75pct} ml ลงในภาชนะ"
                         // ใช้ template variable สำหรับ calculated values
  warning?: string       // แสดงโดดเด่น
  chemicals?: Chemical[] // สารที่ใส่ใน step นี้
}

type Bath = {
  id: string             // "bath-a", "stop-bath", "fixer"
  name: string           // "Bath A — Developer"
  chemicals: Chemical[]
  mixing_steps: MixingStep[]
  storage?: {
    shelf_life: string   // "6–12 months"
    container: string    // "amber bottle, sealed"
    notes?: string
  }
}

type AgitationSchedule = {
  initial_seconds: number     // เขย่า N วินาทีแรก
  interval_seconds: number    // จากนั้นทุก N วินาที
  duration_seconds: number    // ครั้งละ N วินาที
}

type DevelopStep = {
  id: string
  name: string
  type: "developer" | "activator" | "rinse" | "stop" | "fixer" | "wash" | "dry"
  duration_seconds: number | "variable"  // "variable" = user กรอกเอง
  duration_override_key?: string         // key ใน localStorage
  agitation?: AgitationSchedule
  warnings?: string[]         // แสดงตลอด step
  transition_warning?: string // แสดงตอน step complete ก่อนไป step ถัดไป
  temp_table?: {              // optional — ถ้ามี จะ override duration ตาม temp
    [temp_celsius: number]: {
      "N-1": number
      "N": number
      "N+1": number
    }
  }
}

type Recipe = {
  id: string                  // "divided-d23"
  name: string                // "Divided D-23 + Borax"
  description: string
  author: { id: string; name: string }
  visibility: "public" | "private"
  tags: string[]              // ["two-bath", "low-contrast", "tropical"]
  film_types: string[]        // ["any"] or ["Kodak Tri-X", "Ilford HP5"]
  base_volume_ml: number      // 1000 — ปริมาณที่สูตรกำหนด (ใช้ scale chemical amounts)
  optimal_temp_range: { min: number; max: number }
  baths: Bath[]               // สำหรับ Mixing Guide
  develop_steps: DevelopStep[] // สำหรับ Develop Session
}
```

### ตัวอย่างสูตรที่ต่างกัน — dynamic fields

| | Divided D-23 | HC-110 | Rodinal | D-76 | Caffenol |
|--|--|--|--|--|--|
| Mix from raw chemicals | ✅ | ❌ (liquid concentrate) | ❌ (liquid concentrate) | ✅ | ✅ |
| Baths | 2 (A+B) | 1 | 1 | 1 | 1 |
| Temp table | ✅ | ✅ | ✅ | ✅ | ✅ |
| N/N+1/N-1 | ✅ | ✅ | ✅ | ✅ | limited |
| One-shot | ❌ (reusable) | ✅ | ✅ | ❌ | ✅ |
| Variable fixer time | ✅ | ✅ | ✅ | ✅ | ✅ |

> HC-110 และ Rodinal เป็น liquid concentrate — `mixing_steps` จะเป็นแค่ dilution (เช่น "เท 6ml + น้ำ 294ml") ไม่มี raw chemicals
> ต้องเพิ่ม field `developer_type: "raw" | "concentrate"` ใน Bath เพื่อ handle การ display ที่ต่างกัน

---

## localStorage Keys

```
settings                          → { sound, vibrate, screenFlash, theme, unit, mixingMode }
                                     mixingMode: "prep" | "step-by-step" — default ล่าสุดที่ user เลือก
sessions.<recipeId>.overrides     → { [stepId]: duration_seconds }
```

---

## Phase 1 Scope (Frontend only)

**In scope:**
- Flow 1: Mixing Guide (Divided D-23 ครบทุก bath) รวม Prep Mode / Shopping List
- Flow 2: Develop Session (Divided D-23)
- Settings (agitation, theme, unit, prep mode default)
- PWA (offline, installable)
- Static JSON recipes

**Out of scope (Phase 2+):**
- Flow 3 & 4 (Create / Contribute recipe)
- Backend API
- Auth / accounts
- HC-110, Rodinal, Caffenol recipes (data only, not UI logic)
