# Film Dev Guidance — User Flow & Requirements

> **Status:** Planning · Phase 1 (Frontend only, static JSON)
> **Last updated:** 2026-04-04
> **Icon library:** Lucide React (sync กับ Figma ผ่าน Lucide Icons plugin)

---

## Terminology

> คำศัพท์ที่ใช้ในเอกสาร, code, และ UI ของ app นี้
> เวลาไม่แน่ใจว่าคำไหนหมายความว่าอะไร — กลับมาดูที่นี่ก่อน

---

### Film Development Process

| คำ | ความหมาย | ตัวอย่าง |
|----|----------|----------|
| **Developer** | น้ำยาที่เปลี่ยน latent image บนฟิล์มให้เป็นภาพจริง — เป็น step แรกและสำคัญที่สุด | Divided D-23, HC-110, D-76 |
| **Stop Bath** | น้ำยาที่หยุดการทำงานของ developer ทันที — ใช้ acetic acid (chemical) หรือน้ำเปล่า (water stop) | Ilfostop, น้ำก๊อก |
| **Fixer** | น้ำยาที่ละลาย silver halide ที่ไม่ถูก expose ออกไป ทำให้ฟิล์มไวแสงถาวร | Ilford Rapid Fixer |
| **Wash** | ล้างน้ำยาออก — อาจมี wash aid ช่วยเร่งหรือใช้น้ำเปล่าอย่างเดียว | running water 5 นาที |
| **Develop Session** | กระบวนการล้างฟิล์ม 1 ครั้งทั้งหมด ตั้งแต่ developer → stop → fix → wash | — |
| **Push / Pull** | Push (+N stop) = ล้างนานขึ้นเพื่อเพิ่ม contrast / Pull (−N stop) = ล้างสั้นลงเพื่อลด | N+1 = push 1 stop |
| **N / N+1 / N-1** | Development type — N คือ normal, N+1 คือ push 1 stop, N-1 คือ pull 1 stop | |
| **Pre-soak** | แช่ฟิล์มในน้ำก่อน developer เพื่อให้ emulsion พองตัวสม่ำเสมอ — optional | |

---

### Chemistry

| คำ | ความหมาย | ตัวอย่าง |
|----|----------|----------|
| **Bath** | น้ำยา 1 ชุดที่ผสมพร้อมแล้ว — recipe 1 ตัวอาจมี 1 หรือ 2 bath | Bath A (Developer), Bath B (Activator) ใน Divided D-23 |
| **One-bath** | สูตรที่มี developer bath เดียว | HC-110, D-76 |
| **Two-bath** | สูตรที่แยก developer เป็น 2 bath ที่ฟิล์มต้องผ่านต่อกัน — bath แรกอิ่มตัวในฟิล์ม, bath สองกระตุ้น | Divided D-23 (Bath A → Bath B) |
| **One-shot** | ใช้ครั้งเดียวแล้วทิ้ง — ผลลัพธ์สม่ำเสมอ ไม่ต้อง track rolls | HC-110 working solution |
| **Reusable** | ใช้ซ้ำได้หลาย roll — ต้องเพิ่มเวลา develop ตามจำนวน roll ที่ผ่านไปแล้ว | stop bath, fixer, บาง developer |
| **Dilution** | อัตราส่วนผสมน้ำยากับน้ำ — เช่น "1:31" หมายถึง น้ำยา 1 ส่วน : น้ำ 31 ส่วน | HC-110 Dil.B = 1:31 |
| **Chemical Format** | วิธีที่น้ำยาถูกจำหน่าย/เตรียม — กำหนดว่าต้องทำอะไรก่อนใช้ | raw_powder, liquid_concentrate, ready_to_use |
| **Agitation** | การกวนน้ำยาระหว่าง develop เพื่อให้สัมผัสฟิล์มสม่ำเสมอ | inversion, rotation, stand |
| **Time Compensation** | การเพิ่มเวลา develop เมื่อใช้ developer แบบ reusable เพราะประสิทธิภาพลดลง | roll 3–4: +25%, roll 5–6: +50% |

---

### App Entities

| คำ | ความหมาย | อยู่ที่ไหนใน code |
|----|----------|-----------------|
| **Recipe** | สูตรล้างฟิล์ม 1 สูตร ครอบคลุม **ทั้ง session** ตั้งแต่ developer → stop → fix → wash — ประกอบด้วย baths (วิธีผสมน้ำยาแต่ละชุด) + develop steps (ลำดับและเวลาจริง) | Divided D-23, HC-110, D-76 |
| **Bath** | น้ำยา 1 ชุดย่อยภายใน recipe — recipe 1 ตัวมีได้หลาย bath | Bath A (Developer) และ Bath B (Activator) เป็น 2 bath ของ recipe Divided D-23 |
| **Process Step / Develop Step** | ขั้นตอน 1 ขั้นในการล้างฟิล์ม — บางขั้นใช้น้ำยา (bath_ref), บางขั้นไม่ใช้ (wash, dry) | `types/recipe.ts` → `DevelopStep` |
| **Inventory** | คลังขวดน้ำยาที่ user มีจริงในมือ — track วันผสม, roll count, shelf life | `types/kit.ts` → `ChemicalBottle` |
| **Kit** | Preset ที่ user สร้างล่วงหน้า — กำหนดว่าแต่ละ step ของ recipe จะใช้ขวดไหนจาก Inventory | `types/kit.ts` → `DevKit` |
| **Slot** | การ map ระหว่าง 1 develop step กับ 1 ขวดใน Inventory | `types/kit.ts` → `KitSlot` |
| **Session** | การล้างฟิล์ม 1 ครั้ง — user เลือก recipe + Kit/ขวด แล้วเริ่ม timer | developStore state |

---

### UI Actions / Flow Terms

| คำ | ความหมาย | ตัวอย่าง |
|----|----------|----------|
| **Prep** | ขั้นตอนชั่ง/ตวงสารเคมีให้ครบก่อนผสม | เตรียม Metol 7.5g, Sodium Sulphite 100g |
| **Mix** | ขั้นตอนผสมสารเคมีตามลำดับจริง | เทน้ำ → ใส่ Sodium Sulphite → ใส่ Metol |
| **Kit Shortcut** | Card บน RecipeSelectPage — แตะครั้งเดียวเพื่อโหลด recipe + Kit slots แล้วไป Step Preview เลย | — |
| **Apply Kit** | การโหลด slot selections จาก Kit preset เข้า session — override ได้ต่อ slot | — |
| **Time Compensation Badge** | แสดงใน Step Preview เมื่อเลือกขวด reusable — บอก % เวลาที่เพิ่มขึ้น | "ม้วนที่ 5–6: +50%" |

---

## Overview

App มี 4 flow หลัก แบ่งเป็น 2 กลุ่ม:

| # | Flow | Phase |
|---|------|-------|
| 1 | **Mixing Guide** — ผสมน้ำยา step-by-step | Phase 1 ✅ |
| 2 | **Develop Session** — ล้างฟิล์ม real-time timer | Phase 1 ✅ |
| 3 | **Create Recipe** — สร้างสูตรใหม่ | Phase 2 (planned) |
| 4 | **Community Contribute** — ผู้ใช้ contribute สูตร | Phase 3 (planned) |

**Inventory ไม่ใช่ flow แยก** — integrate เข้า Flow 1 และ Flow 2 โดยตรง:
- Flow 1 (Mixing): Done → prompt "บันทึกลง Inventory?" (optional, ทุก bath ที่ `mixing_required === true`)
- Flow 2 (Develop): RecipeSelect → เลือก Kit shortcut (optional) → Step Preview → เลือก Kit/ขวด (optional) → All Done → rollsDeveloped++ อัตโนมัติ
- จัดการขวด (ดู/แก้/ลบ) + จัดการ Kit presets → ผ่าน Inventory page เข้าจาก Home navbar icon

**Terminology (Phase 1c):**
- **Inventory** = ขวดน้ำยาที่ user มีจริง (UI label ใน page title, prompt, hint)
- **Kit** = preset mapping ขวดต่อ recipe step — สร้างล่วงหน้า ใช้ใน session
- Route path `/my-kit` คงเดิม (ไม่เปลี่ยน ไม่กระทบ PWA cache)

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

### Done — Inventory prompt (Phase 1b + 1c fix)

หลังจาก Done (น้ำยาพร้อม) → แสดง prompt **optional**:

```
"บันทึกลง Inventory?"
  ├─ บันทึก → เปิด Add Bottle form (prefill: bottleName จากสูตร, mixedAt = วันนี้)
  │            → บันทึก → กลับ Home
  └─ ข้ามไป → กลับ Home
```

**พฤติกรรม:**
- Prompt แสดงสำหรับ**ทุก bath** ที่ `bath.mixing_required === true` (Phase 1c fix — เดิม trigger เฉพาะ developer bath)
- `role` ถูก set อัตโนมัติจาก `bath.role` — developer baths → `reusable`, อื่นๆ → `one-shot`
- เป็น optional เสมอ — กด "ข้ามไป" ได้โดยไม่กระทบอะไร
- ถ้า user มีขวดชื่อเดิมอยู่แล้วใน Inventory → แสดง option "เพิ่มขวดใหม่" หรือ "อัปเดตขวดเดิม"

---

## Flow 2 — Develop Session

### Journey
```
Home
  → เลือกสูตร (Recipe Select)
      [Kit Shortcuts — optional] ← แสดงด้านบนสุดถ้ามี Kit
      ├─ แตะ Kit → setRecipe + applyKitSlots → ไป Step Preview โดยตรง (1 tap)
      └─ เลือกสูตรเอง → Step Preview
    → Step Preview  ← ตั้งค่าและ custom ก่อนเริ่ม
        [เลือก Kit — optional dropdown กรอง Kit ที่ตรงกับ recipe นี้]
        ├─ เลือก Kit → populate per-slot dropdowns อัตโนมัติ (override ได้ต่อ slot)
        └─ ข้าม → เลือก bottle ต่อ slot เองหรือข้าม
        [ต่อแต่ละ slot: dropdown bottle จาก Inventory — filter by bath role]
        ├─ reusable bottle → time compensation badge แสดง
        └─ ข้าม → ใช้ค่า default จาก recipe
      → Active Timer (loop ทีละ step)
        → Step Complete (transition)
        → (next step...)
      → All Done 🎉
          [อัปเดต rollsDeveloped ของทุก slot ที่มี bottleId — dedup ถ้าขวดเดียวซ้ำ]
```

### Inventory integration ใน Develop Session

**ทำไมเชื่อมกัน:**
- `type: reusable` → คำนวณ time compensation อัตโนมัติ (rolls 1–2: standard, rolls 3–4: +25%, ฯลฯ)
- `rollsDeveloped` → track จาก sessions จริง ไม่ต้องนับเอง
- `defaultDilution` → โหลดเป็น default แต่ override ได้ต่อ session

**พฤติกรรม:**
- การเลือกขวดใน Step Preview เป็น **optional เสมอ** — ข้ามได้ ไม่บังคับ
- ถ้าไม่มีขวดใน Inventory ที่ตรงกับ role → แสดง hint "เพิ่มขวดได้ใน Inventory"
- หลัง All Done → `incrementRolls(bottleId)` ถูกเรียกอัตโนมัติสำหรับทุก slot ที่มี bottleId (dedup ถ้าขวดเดียวใช้หลาย slot)

### Step Preview — fields

**User กำหนดได้ (input)**
| Field | Type | Default | หมายเหตุ |
|-------|------|---------|----------|
| Kit | dropdown | — (optional) | เลือก Kit preset → populate per-slot bottles อัตโนมัติ |
| ขวดน้ำยา (per slot) | dropdown | — (optional) | เลือกขวดจาก Inventory ต่อ slot — filter by bath role |
| Development type | N-1 / N / N+1 | N | ปรับ contrast (push/pull) |
| อุณหภูมิน้ำยา | number | — | app คำนวณเวลา Bath A จาก temp table · ควรวัดก่อนเริ่มทุกครั้ง |
| เวลาแต่ละ step | number (per step) | จาก JSON | override ได้, save ใน localStorage |
| Film format | 35mm / 120 / 4×5 | — | (Phase 2+) ใช้คำนวณ volume ที่ต้องใช้ |
| จำนวน rolls | number | 1 | (Phase 2+) บวก rolls เพื่อคำนวณ volume และ warn ถ้า push ต่างกัน |

**ระบบคำนวณให้ (read-only)**
| Field | คำอธิบาย |
|-------|----------|
| เวลา Bath A | lookup จาก temp × development type table |
| เวลา Bath B | คงที่ 5 นาทีเสมอ (สำหรับ Divided D-23) |
| เวลา Fixer | default จาก JSON, override ได้ |

**Temperature Warning:**
- ก่อนเริ่ม: app แนะนำให้วัด temp และ confirm ก่อน session — user รับผิดชอบรักษา temp ให้ stable
- ระหว่าง session: ถ้า temp เปลี่ยน สามารถ adjust ได้ แต่มี warn ว่า "การเปลี่ยน temp กลางคันอาจกระทบ evenness ของ development"

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

---

## Kit Playlist (Phase 1c)

**แนวคิด:** DevKit คือ "playlist" ที่ user สร้างล่วงหน้า — เลือกว่าแต่ละ step ของ recipe ใช้ขวดไหน
เหมือนมีเพลงอยู่ (bottles) แล้วจัด playlist (kit) ว่าจะเล่นลำดับไหน กับสูตรไหน

### ทำไมต้อง Kit แทน bottle-per-step?
- ปกติ user ใช้ stop + fixer ชุดเดียวซ้ำหลายสูตร — ไม่อยากเลือกใหม่ทุก session
- สูตร 2-bath ต้องการ developer 2 ขวด (Bath A + Bath B) — Kit รู้ว่าแต่ละ slot ใช้ขวดไหน
- Kit เป็นเพียง "default preset" — ยัง override ได้ต่อ session เสมอ

### Entry points

| จุดเข้า | ที่มา | action |
|---------|-------|--------|
| **Inventory page → "สร้าง Kit ใหม่"** | ทุกเวลา | สร้าง Kit ใหม่ / แก้ไข Kit ที่มีอยู่ |
| **RecipeSelectPage — Kit shortcuts** | เลือกสูตร | แตะ Kit → setRecipe + applyKitSlots → Step Preview (1 tap) |
| **Step Preview → "เลือก Kit"** | ก่อน session | โหลด Kit → populate slots → override ต่อ slot → เริ่ม session |

### Flow: Create Kit

```
Inventory page
  → [+ สร้าง Kit ใหม่]
    → เลือก recipe ที่จะผูก
      → ระบบ auto-generate slots จาก develop_steps ที่มี bath_ref
        → ตั้งชื่อ Kit (เช่น "D-23 + Ilfosol Stop Set")
        → ตั้งชื่อ Kit (เช่น "D-23 + Ilfosol Stop Set")
        → ต่อแต่ละ slot:
            แสดง step name (Bath A — Developer / Stop Bath / Fixer)
            dropdown เลือกขวด → filter ตาม role ของ bath นั้น
            (สามารถ leave blank สำหรับ stop/fixer — แต่ developer ต้องเลือก)
        → Validation: developer slot ว่าง → block Save, stop/fixer slot ว่าง → warn เท่านั้น
        → Save ✅
```

**ตัวอย่าง slots สำหรับ Divided D-23:**
```
Step "Bath A — Developer"   role=developer  → เลือก "Divided D-23 Bath A"
Step "Bath B — Activator"   role=developer  → เลือก "Divided D-23 Bath B"
Step "Stop Bath"            role=stop       → เลือก "Ilfostop"
Step "Fixer"                role=fixer      → เลือก "Ilford Rapid Fixer"
```

**ตัวอย่าง slots สำหรับ HC-110 (1-bath):**
```
Step "HC-110 Dil.B"         role=developer  → เลือก "HC-110 Working Solution"
Step "Stop Bath"            role=stop       → เลือก "Ilfostop"
Step "Fixer"                role=fixer      → เลือก "Ilford Rapid Fixer"
```

### Flow: Use Kit in Session

```
Step Preview
  → [เลือก Kit] dropdown — แสดงเฉพาะ Kits ที่ผูกกับ recipe ที่เลือก
      ├─ เลือก Kit → auto-fill slot dropdowns ด้วยขวดจาก Kit
      │               ยังสามารถเปลี่ยนต่อ slot ได้ก่อนเริ่ม
      └─ ข้ามหรือไม่มี Kit → เลือก developer bottle อย่างเดียว (Phase 1b behavior)
  → Validation: developer slot ว่าง → block [เริ่ม session], stop/fixer slot ว่าง → warn (ไม่ track usage)
  → [เริ่ม session]
      → All Done 🎉 → rollsDeveloped++ สำหรับ bottles ที่ถูกเลือก (ทุก slot ที่มี bottleId)
```

### Data flow

```
Bottles (My Kit)
    │
    ├── สร้าง DevKit → KitSlot[] mapping stepId → bottleId
    │
    └── Session Setup (Step Preview)
          เลือก Kit → load slots → resolve bottles → apply time compensation
          เริ่ม timer
          All Done → incrementRolls() สำหรับทุก slot ที่มี bottleId
```

### localStorage Keys (Phase 1c เพิ่ม)

```
my-kit-devkits  → DevKit[]  (แยกจาก my-kit เดิม — backward compatible)
```

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

## localStorage Keys

```
settings            → { sound, vibrate, screenFlash, theme, unit, mixingMode }
                       mixingMode: "prep" | "step-by-step" — default ล่าสุดที่ user เลือก
develop-session     → { stepOverrides, devType, tempCelsius, selectedKitId, slotSelections }  (persisted โดย Zustand)
my-kit              → { equipment: EquipmentProfile, bottles: ChemicalBottle[] }  (Phase 1b)
my-kit-devkits      → DevKit[]  (Phase 1c) — Kit presets สำหรับ session
```

> Type definitions ครบถ้วนอยู่ที่ `frontend/src/types/recipe.ts` — ดู `DATA_MODEL.md` สำหรับ field reference

---

## Development Variables — ภาพรวม

> Domain knowledge เรื่อง chemistry และอุปกรณ์แบบละเอียด (ไม่มี code) อยู่ที่: `../Analog Photographic/film-chemistry-research.md`
> Section นี้แสดงเฉพาะ **การจัดวางตัวแปรใน app** (อยู่ที่ไหน, default คืออะไร, validate อย่างไร)

ตัวแปรทั้งหมดที่ส่งผลต่อกระบวนการล้างฟิล์ม แบ่งตาม frequency of change:

### เปลี่ยนแทบไม่เคย (per person → Settings)
| ตัวแปร | ที่อยู่ | หมายเหตุ |
|--------|--------|---------|
| Tank type | Settings + editable ใน session | เผื่อไปล้างบ้านเพื่อน |
| Agitation method default | Settings + editable ใน session | Jobo ใช้เวลาต่างจาก inversion |
| Water hardness | Settings เท่านั้น | กำหนดพื้นที่ — warn ถ้า hard water |
| Pre-soak preference | Settings (default on/off) | preference ส่วนตัว |
| Stop bath type | N/A — removed from Settings | Stop bath มีอยู่เสมอ: chemical bottle จาก Inventory ถ้ามี, fallback เป็น water-stop bath ในทุก recipe |
| Wetting agent | Settings | reminder เท่านั้น ไม่กระทบ timing |

### เปลี่ยนต่อ session → Step Preview / Session Setup
| ตัวแปร | ที่อยู่ | หมายเหตุ |
|--------|--------|---------|
| Film format | Per session | กำหนด volume น้ำยา |
| จำนวน rolls | Per session | กำหนด volume + warn ถ้า push ต่างกัน |
| Development type (N/N+1/N-1) | Per session | core ของ session |
| อุณหภูมิ | Per session (+ real-time adjust) | ต้องวัดก่อนเริ่ม |
| One-shot vs reusable | Per session | กระทบ time compensation |
| Tank type override | Per session | override Settings ได้ถ้าใช้อุปกรณ์ต่าง |
| Agitation method override | Per session | override Settings ได้ |

### เปลี่ยนทุกครั้ง (per roll → session context)
| ตัวแปร | ที่อยู่ | หมายเหตุ |
|--------|--------|---------|
| Film stock | Per session | กระทบ recipe compatibility |
| Developer + dilution | จาก recipe / My Kit | core |
| Push/Pull stops | Per session | กระทบ time |

### Batch validation rules
- **Push ต่างกัน → บังคับ dev แยก**: ถ้า rolls ใน session เดียวมี push ต่างกัน → warn + block ไม่ให้เริ่มได้ user ต้อง dev แยก session

---

## Inventory (Phase 1b) + Kit Presets (Phase 1c)

แนวคิด: app รู้จัก "ของที่ user มี" (Inventory) และ "ชุดน้ำยาที่ใช้ประจำ" (Kit) — integrate เข้า flow หลักแทนที่จะเป็น section แยก

### Entry points — Inventory

| จุดเข้า | ที่มา | action |
|---------|-------|--------|
| **Home navbar icon 🧴** | ทุกเวลา | ดู/แก้ไข/ลบขวด, Equipment Profile, จัดการ Kit presets |
| **Mixing Done prompt** | หลังผสมน้ำยาเสร็จ (ทุก bath ที่ `mixing_required === true`) | เพิ่มขวดใหม่ (prefill จากสูตร) |
| **Step Preview** | ก่อนเริ่ม develop session | เลือก Kit / ขวดต่อ slot → track rolls |
| **RecipeSelectPage Kit shortcut** | เลือกสูตร | แตะ Kit → ข้าม Step Preview setup ส่วน Kit selection |

### Data flow
```
Mixing Guide → Done (mixing_required bath)
    ↓ (optional prompt)
    เพิ่มขวดใน Inventory   ←────────────────────┐
                                                 │
RecipeSelectPage                                 │
    └─ Kit shortcut (1 tap) ──────────────────────────────────────┐
                                                                   │
Step Preview → เลือก Kit/ขวด → Active Timer → All Done           │
    ↓ prefill slots                              ↓                 │
    time compensation                     rollsDeveloped++  ←──────┘
    (reusable bottle)                     (ทุก slot ที่มี bottleId)
```

### ChemicalBottle entity
```
ChemicalBottle {
  id:               uuid
  developerName:    string          // "Divided D-23 Bath A", "HC-110 Working Solution"
                                    // qualified เสมอ — ไม่ใช้ชื่อสั้นแบบ "Bath A"
  role:             'developer' | 'stop' | 'fixer' | 'wash_aid' | 'wetting_agent'
                                    // ใช้ filter ขวดให้ถูก slot ใน DevKit
  defaultDilution?: string          // default dilution, e.g., "1:25"
  type:             'one-shot' | 'reusable'
  mixedAt:          string          // ISO date — วันที่ผสมหรือเปิดขวด
  shelfLifeDays?:   number          // มาจาก recipe data — คำนวณ expiry warning
  rollsDeveloped:   number          // track จาก sessions จริง
  maxRolls?:        number          // มาจาก recipe data — warn เมื่อใกล้ครบ
  notes?:           string
  createdAt:        string          // ISO date
  updatedAt:        string          // ISO date
}
```

### Architecture
- **Phase 1b (ปัจจุบัน):** My Kit เก็บใน localStorage key `my-kit` — throwaway data
- **Phase 3 (with backend):** My Kit migrate ไป DB พร้อม auth — refactor ที่ repository layer เท่านั้น
- ดู `DATA_MODEL.md` → My Kit section สำหรับ entity types ครบถ้วน
- ดู `ARCHITECTURE.md` → Repository Pattern สำหรับ `KitRepository` interface

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
