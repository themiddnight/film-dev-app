# Film Dev Guidance — Rules & Constraints

> เอกสารนี้รวบรวม business rules, chemistry constraints, และ implementation decisions
> ที่ถูก encode ไว้ในระบบตั้งแต่เริ่มต้นจนถึงปัจจุบัน (April 2026)
>
> **ใช้ไฟล์นี้เป็น reference แรก** ก่อนแก้ logic ใน `utils/dev.ts`, timer pages, หรือ data types

---

## 1. Timing Calculation Rules
> ⚗️ Chemistry constraint — เปลี่ยน algorithm ได้เฉพาะเมื่อ verify กับ domain research

### 1.1 เส้นทางหา base time

Developer timing มีสี่ประเภท (`DevelopTiming.type`):

| type | กฎ |
|------|-----|
| `fixed` | ใช้ `fixed_seconds` ตรงๆ ไม่คำนึงถึงอุณหภูมิ/dev_type |
| `temp_table` | หา entry ที่ temperature ใกล้ที่สุด → เลือก key ที่ตรงกับ `dev_type` → fallback `N` |
| `push_pull_table` | ใช้ base temp คงที่ → เลือก `dev_type` key → fallback `N` |
| `combined` | ลองทั้งสองและ combine ตาม implementation |

**กฎ fallback:** ถ้า `dev_type` ไม่มีใน table → fallback ไปใช้ `N` เสมอ

**Two-bath override:** ถ้า `recipe.constraints.is_two_bath === true` และ `recipe.develop_steps` มีข้อมูล → อย่าใช้ `develop_timing` เลย ให้ไปอ่าน duration จาก `develop_steps[].duration_seconds` แทน (ดูรายละเอียดใน section 4.2)

### 1.2 Temperature lookup

ใช้ **closest neighbor** (ไม่ใช่ interpolation):
```ts
let closest = temps[0]
for (const t of temps) {
  if (Math.abs(t - tempCelsius) < Math.abs(closest - tempCelsius)) closest = t
}
```
ยังไม่มี interpolation ระหว่างอุณหภูมิในระบบปัจจุบัน

### 1.3 Temperature Range Constraints

`optimal_temp` ใน recipe schema กำหนด **ช่วงการทำงานที่แนะนำ**:

```ts
optimal_temp?: { min: number; max: number }  // หน่วย °C
```

| สถานการณ์ | พฤติกรรม |
|-----------|----------|
| อยู่ภายใน `optimal_temp` range | ใช้ closest-neighbor lookup ปกติ ไม่มี warning |
| นอก `optimal_temp` range | Warning แสดง — แต่ยังคำนวณได้ (ห้าม hard-block) |
| ไม่มี temp_table entry ตรง | Fallback ไป closest entry ใน temp_table |
| recipe type = `fixed` | ใช้ `fixed_seconds` เสมอ — temperature ไม่มีผล |

**Two-bath exception:** temperature ไม่ใช้คำนวณ timing — ไม่มี temp range check สำหรับ two-bath developer

**หลักการ:** user มีอิสระในการเลือก temperature แต่ system แสดง warning เมื่อนอก `optimal_temp` ที่ recipe กำหนด ห้าม hard-block เพราะ user อาจตั้งใจทำงานนอก optimal range

---

## 2. Reuse Compensation Rules
> ⚗️ Chemistry constraint — สูตรและ model (linear) มาจาก chemistry ห้ามเปลี่ยนโดยไม่ verify

### กฎหลัก (ห้ามเปลี่ยน)

- Compensation คำนวณแบบ **linear ต่อ roll** — ไม่ใช่ bucket/step tier
- สูตร: `adjustedSeconds = baseSeconds × (1 + (time_increase_per_roll × use_count))`
- `use_count` มาจาก `InventoryItem.use_count` ของ developer item (bath_a สำหรับ two-bath)
- ถ้า `use_count === 0` → ไม่มี compensation (ของใหม่)
- `max_rolls` ใน schema เป็นแค่ warning hint ไม่ได้บล็อกการใช้งาน

### Two-bath compensation

สำหรับ two-bath developer:
- **Bath A เท่านั้นที่ compensate** — Bath A เป็นตัวที่ deplete ตาม use_count
- **Bath B duration ไม่เปลี่ยน** — คงที่ตาม `develop_steps[].duration_seconds` เสมอ
- สูตร: `adjustedBathA = bathASeconds × (1 + (time_increase_per_roll × use_count))`

> ⚠️ ห้ามใช้สูตร proportional split (`adjustedTotal × (bathSeconds / baseTotal)`) — Bath B ถูก limit โดย chemistry (developer ที่ absorbed ถูก exhaust) ไม่ใช่โดยเวลา การ scale Bath B ตาม compensation จะให้ผลผิด

---

## 3. Agitation Time Multipliers
> ⚗️ Chemistry constraint — multiplier values ในแต่ละ recipe มาจาก chemistry ของสูตรนั้น

Recipe สามารถระบุ multiplier ตาม `agitation_method` ได้ใน `recipe.constraints.agitation_time_multipliers`:

```ts
agitation_time_multipliers?: {
  inversion?: number  // 1.0 = default
  rotary?: number     // rotary/rotation map ไปหา key เดียวกัน
  stand?: number
}
```

**กฎ:** multiplier apply หลัง temp_table lookup แต่ก่อน reuse compensation

**ไม่มี multiplier สำหรับ two-bath:** two-bath developer ใช้ duration ตายตัวใน `develop_steps` — multiplier ไม่ได้ถูก apply ต่อที่ step level

---

## 4. Developer Types — 1-Bath vs 2-Bath
> ⚗️ Chemistry constraint — กลไกและ rules ทุกข้อในหมวดนี้มาจาก chemistry ห้ามเปลี่ยนโดยไม่ verify

### 4.0 ความแตกต่างพื้นฐาน

Developer ทุกตัวใน B&W photography มีกลไกหลักเหมือนกัน คือ **reducing agent** (metol, phenidone, hydroquinone ฯลฯ) ในสภาพ alkaline จะ reduce **silver halide (AgX)** บนฟิล์มที่มี latent image ให้กลายเป็น metallic silver สีดำ แต่ differ ที่ *ว่าสองส่วนนี้อยู่ด้วยกันหรือแยกห้อง*:

---

### 4.1 One-Bath Developer — กลไกและ rules

**กลไก:** reducing agent + alkali + sulfite อยู่ในสารละลายเดียว → film แช่อยู่ → development เกิดขึ้นต่อเนื่องตราบเท่าที่มี developer ในสารละลายและ silver halide บนฟิล์ม

**ลักษณะสำคัญ:**
- Development rate ขึ้นอยู่กับ **เวลา** และ **อุณหภูมิ** โดยตรง (Arrhenius kinetics)
  - ทุก ±1°C = เวลาเปลี่ยนประมาณ ±5–10%
  - ทุก ±2°C ควรปรับเวลา
- **Push/Pull ผ่านเวลา**: เพิ่มเวลา = push (contrast + shadow detail เพิ่ม), ลดเวลา = pull
- **Agitation มีผล**: inversion ≠ stand ≠ rotary — agitation ที่มากขึ้น = fresh developer ถึงฟิล์มมากขึ้น = development เร็วขึ้น
- Highlight และ shadow develop พร้อมกันตลอดเวลา → ยิ่งอยู่นานยิ่ง dense ทุกส่วน
- **Temperature latitude แคบ**: ±1–2°C สำหรับ precision work
- Exhaustion: developer deplete ทั้ง bath ทีละน้อยตาม exposure ของ silver halide

**กฎที่ app ใช้:**
- Timing มาจาก `develop_timing` → `temp_table` หรือ `push_pull_table`
- Agitation multiplier apply ก่อน reuse compensation
- Reuse compensation: linear per roll บน `use_count` (`InventoryItem`)

**ตัวอย่าง:** D-76, HC-110, Rodinal, ID-11, XTOL, Ilfosol

---

### 4.2 Two-Bath Developer — กลไกและ rules

**กลไก (2 ขั้นตอนแยกกัน):**

1. **Bath A (Absorption):** ฟิล์มแช่ใน Bath A ซึ่งมี **developing agent** (เช่น metol, hydroquinone) และ **alkali น้อยมาก** (ไม่เพียงพอสำหรับ vigorous development) → gelatin ในฟิล์มดูดซับ developer เข้าไป → development เกิดขึ้นเพียงเล็กน้อยหรือแทบไม่เกิด ขึ้นอยู่กับ formulation ของ Bath A แต่ละสูตร

2. **Bath B (Activation):** ฟิล์มย้ายเข้า Bath B ซึ่งเป็น **alkali solution** (borax, sodium metaborate, sodium carbonate ฯลฯ) → alkali ใน Bath B เข้าไป activate developer ที่ absorbed ไว้ใน gelatin → development เริ่มเกิดขึ้น

**กลไก Self-Exhaustion Compensation (สำคัญมาก):**

ปริมาณ developer ที่ gelatin ดูดซับจาก Bath A มี **ขีดจำกัด (จำนวนคงที่)** — บริเวณ highlight ที่มี silver halide หนาแน่น developer ที่ absorbed จะถูกใช้หมดเร็ว → development หยุดเองโดยอัตโนมัติก่อนที่ highlight จะ "block up" — ขณะที่บริเวณ shadow ที่มี silver halide น้อยกว่า developer ที่ absorbed ยังเหลือพอ → develop ต่อได้ ผลที่ได้คือ **highlight compression + shadow preservation** = compensating effect

**ผลสำคัญของกลไกนี้:**
- **Temperature latitude กว้างกว่า 1-bath อย่างมาก**: self-exhaustion mechanism ทำหน้าที่ buffer อุณหภูมิ — two-bath developer tolerant ต่ออุณหภูมิมากกว่า one-bath อย่างมีนัยสำคัญ แต่ range ที่ยอมรับได้ยังขึ้นอยู่กับ chemistry ของแต่ละสูตร
- **Time latitude กว้าง**: เมื่อ developer absorbed หมดแล้วก็ exhaust — อยู่นานเกินก็ไม่ overdevelop (developer หมดไปแล้ว)
- **Push/Pull ไม่ใช้เวลา — ใช้ Bath B concentration แทน**: เพิ่ม alkali ใน Bath B = activate เร็วและแรงขึ้น = contrast เพิ่ม (push); ลด alkali = pull

> **ข้อยกเว้น:** Temperature latitude กว้างขึ้นกว่า 1-bath แต่ไม่ได้ infinite — อุณหภูมิต่ำมากอาจทำให้ absorption ช้าหรือ activation ไม่สมบูรณ์ อุณหภูมิสูงมากอาจทำให้ fog เพิ่มหรือ shadow detail ลด

**กฎที่ app ใช้:**
- ⚠️ **อย่าใช้ `develop_timing`** สำหรับ two-bath — ใช้ `develop_steps[].duration_seconds` แทนเสมอ
- ⚠️ **ห้าม rinse/stop ระหว่าง Bath A → Bath B** — developer carryover ใน gelatin ต้องไม่ถูกชะออก
- Agitation multiplier (rotary/stand) **ไม่ apply** กับ two-bath (duration ตายตัว)
- Temperature ไม่ส่งผลต่อ timing → `temperature_celsius` ยังบันทึกไว้เพื่อ tracking แต่ไม่ใช้ lookup
- N-level ผ่าน `n_level` บน Bath B InventoryItem — เลือกขวด Bath B ที่ผสมมาตามความเข้มข้นที่ต้องการ

**ตัวอย่าง:** Thornton's 2-Bath, Divided D-23, Diafine, Acu-1 (2-bath variant)

---

### 4.3 ตารางเปรียบเทียบ

| Feature | 1-Bath | 2-Bath |
|---------|--------|--------|
| กลไก | Continuous reduction ตลอด | Absorption → Activation → Self-exhaustion |
| Push/Pull | เพิ่ม/ลดเวลา | เปลี่ยน Bath B concentration (ผสมขวดใหม่) |
| Temperature effect | สูงมาก (±5–10%/°C) | ต่ำมาก (±2–5°C ยอมรับได้) |
| Time effect | ยิ่งนาน ยิ่ง dense ทุกส่วน | Development หยุดเองเมื่อ developer exhaust |
| Agitation effect | ส่งผลต่อ rate และ uniformity | มีผลน้อยกว่า — compensation มาจาก chemistry |
| Highlight control | ขึ้นอยู่กับเวลา/temp | Self-compressing (highlight exhaust developer ก่อน) |
| Reuse | มีสูตร compensation per roll | Bath A depletes ช้า; Bath B reuse ได้หลายครั้ง |
| App timing source | `develop_timing` (temp/push-pull table) | `develop_steps[].duration_seconds` (fixed) |

---

### 4.4 Two-Bath System — กฎโดยรวม

Developer แบบ **two-bath** คือสูตรที่แบ่งเป็น 2 ขวดแยก ซึ่งต้องใช้คู่กันในลำดับที่ตายตัว:

| Bath | บทบาท | ตัวอย่าง |
|------|--------|----------|
| Bath A | Developer solution — film ดูดซับ developer ที่นี่ | Metol + Sodium Sulphite |
| Bath B | Activator/Alkaline accelerator — activate developer ที่ carryover มา | Sodium Metaborate, Sodium Carbonate |

**ตัวอย่าง recipes:** Thornton's 2-Bath, Divided D-23, Diafine ฯลฯ

**กฎหลัก:**
- สอง Bath ต้องใช้คู่กันจาก **recipe เดียวกันเสมอ** — ห้ามจับ Bath A จาก recipe X กับ Bath B จาก recipe Y
- แต่แต่ละขวด **track lifecycle แยกกัน** — เช่น Bath A หมดอายุก่อน ผสมใหม่แค่ขวด A ได้ (Bath B ยังใช้ตัวเดิม)
- N-level ควบคุมผ่าน Bath B concentration (ไม่ใช่เวลา) — `InventoryItem.n_level` บน Bath B item

**Data model:**
```ts
// InventoryItem สำหรับ two-bath developer
{ recipe_id: 'thornton-2bath', bath_id: 'thornton-2bath-a', developer_bath_role: 'bath_a' }  // Bath A bottle
{ recipe_id: 'thornton-2bath', bath_id: 'thornton-2bath-b', developer_bath_role: 'bath_b' }  // Bath B bottle
```

### 4.4.1 ห้าม rinse/stop ระหว่าง Bath A และ Bath B

> นี่คือ **ข้อห้ามหลักทางเคมี** — ต้องแสดง warning ทุกครั้งก่อน transition

สาเหตุ: Bath A ต้องนำ developer ที่ absorbed ไว้ในฟิล์มไปเข้า Bath B เพื่อ activate — ถ้าล้างน้ำก่อน developer จะถูกชะออกและ **compensation effect จะลดลงอย่างมาก**

> **Nuance (verified):** การล้างน้ำไม่ได้ทำให้ Bath B "ไม่ทำงานเลย" แต่จะลด carryover developer ที่นำไปใช้ใน Bath B ทำให้สูญเสีย compensation benefit หลักของสูตรนี้ไป — rule ที่ enforce ห้าม rinse จึงถูกต้องเพื่อ best practice

**ข้อความ warning ที่ใช้ใน code:** `"ห้ามล้างน้ำ — เท Bath B ทันที"`

### 4.4.2 Bath B N-level (Push/Pull)

N-level ของ two-bath developer ถูก control ผ่าน **Bath B alkaline concentration** — ไม่ใช่ผ่าน develop time:

| N-level | Bath B | ผลลัพธ์ |
|---------|--------|---------|
| N-1 | concentration ต่ำกว่า N-standard | contrast ลดลง |
| N | standard concentration ตาม recipe | standard |
| N+1 | concentration สูงกว่า N-standard | contrast เพิ่ม |

**ค่า concentration จริงของแต่ละ N-level กำหนดใน recipe schema** (`baths[].n_variations`) — ต่างกันตามชนิดและปริมาณของ alkaline agent ใน Bath B ของแต่ละสูตร

**กฎใน code:** `InventoryItem.n_level` เป็นตัวบ่งชี้ว่า Bath B item นั้นอยู่ที่ระดับไหน — user เลือก Bath B item ใน DevSetupPage → ส่งผลต่อ contrast ไม่ใช่เวลา

### 4.4.3 Agitation ต่างกันแต่ละ Bath

Two-bath developer ใช้ agitation ต่างกันระหว่าง Bath A และ Bath B — **ค่า agitation ที่แน่นอนกำหนดใน recipe schema** (`develop_steps[].agitation`):

- **Bath A**: vigorous initial agitation (continuous หรือ extended) — จากนั้น moderate agitation ตาม interval
- **Bath B**: brief initial agitation — จากนั้น minimal agitation (สั้นกว่า Bath A โดยตั้งใจ)

เหตุผลที่ Bath B ใช้ agitation น้อยกว่า: กลไก compensation หลักมาจาก **developer carryover จาก Bath A ที่มีปริมาณจำกัดและ exhaust ในบริเวณ highlight เอง** — agitation pattern ที่แนะนำช่วยให้ผลออกมาสม่ำเสมอที่สุด

> **Nuance (verified):** compensation เกิดขึ้นโดย chemistry ไม่ว่า agitate เท่าไหร่ — Bath B agitation amount ไม่ใช่ตัวการหลักของ compensation effect

### 4.4.4 Temperature

Standard temperature และ acceptable range กำหนดใน **recipe schema** (`optimal_temp.min` / `optimal_temp.max`) — ค่าเฉพาะของแต่ละสูตรไม่ได้ hard-code ใน rules

**กฎสำหรับ two-bath:** temperature ไม่ใช้คำนวณ timing — `temperature_celsius` บันทึกไว้เพื่อ record-keeping เท่านั้น ห้ามใช้ temp table lookup กับ two-bath recipe

> กลไก two-bath exhaustion ทำหน้าที่เป็น temperature buffer ในตัวเอง ทำให้ two-bath developer tolerant ต่อ temperature variation มากกว่า one-bath อย่างมีนัยสำคัญ — แต่ acceptable range ของแต่ละสูตรยังถูกกำหนดโดย chemistry ของสูตรนั้นๆ และกำหนดไว้ใน `optimal_temp`

### 4.4.5 Two-Bath Kit Pairing Rules

> กฎเหล่านี้ apply กับ **ทุก two-bath recipe** ไม่ใช่เฉพาะ Thornton

1. **Pairing required:** Bath A slot และ Bath B slot ใน Kit ต้องมี `recipe_id` เดียวกัน → `error` ถ้าไม่ตรง
2. **Slot dropdown filter:** Bath B dropdown แสดงเฉพาะ `InventoryItem` ที่มี `recipe_id` ตรงกับ Bath A ที่เลือกอยู่
3. **Recipe toggle → slot rebuild:** เมื่อ Bath A slot เปลี่ยนจาก single-bath เป็น two-bath recipe หรือกลับกัน → Kit slots ถูก rebuild อัตโนมัติ (`remapSlots`)
4. **Independent lifecycle:** Bath A และ Bath B คือ `InventoryItem` คนละตัว — ผสมใหม่แยกขวดได้อิสระ เพียงแต่ต้องคัดเลือกให้ตรง recipe ตอน assign เข้า Kit

### 4.4.6 Capacity

- ค่า capacity สูงสุด (จำนวน roll/sheet ต่อ litre) กำหนดใน **recipe schema** (`constraints.reuse_compensation.max_rolls`) — ต่างกันตามสูตร
- บาง recipe ออกแบบสำหรับ limited-reuse โดยไม่รองรับ replenishment — ดู Section 12.3

---

## 5. Dev Session Rules
> ⚙️ App/workflow decision — เปลี่ยนได้ตาม product requirement

### 5.1 Source types

| type | ความหมาย | Inventory tracking |
|------|---------|-------------------|
| `kit` | มาจาก My Kit → มี inventory items | ✅ บันทึก use_count |
| `recipe` | anonymous → เลือก recipe โดยตรง | ❌ ไม่ track |

**Anonymous session warning:** แสดงข้อความแจ้ง user เสมอว่าไม่มี inventory tracking

### 5.2 DevSetupPage → DevTimerPage data flow

```
DevSetupPage → startTimerSession(adjustedSeconds) → navigate('/dev/timer')
DevTimerPage → buildSteps() → อ่านจาก source ใหม่ผ่าน repositories
```

**ห้ามส่ง steps ผ่าน store** — DevTimerPage สร้าง steps เองจาก source เพื่อให้ step data ใหม่เสมอ

### 5.3 Timer phase states

```
phase: 'ready'   → แสดง step preview, ปุ่ม "Start Timer"
phase: 'running' → countdown active, running = true/false (pause/play)
```

`isTimerActive = running && remaining > 0`

### 5.4 Agitation Window

Agitation spec: `{ initial_seconds, interval_seconds, duration_seconds }`

- `initial_seconds`: วินาทีแรก — agitate ทันที (count down จาก step เริ่ม)
- `interval_seconds`: ทุก N วินาที → เปิด agitation window ใหม่
- `duration_seconds`: กว้าง N วินาที

`isAgitationTime` คำนวณจาก elapsed time ของ step นั้นๆ → ไม่ข้าม step

**กฎ:** sound + vibrate fire เฉพาะ leading edge (`prevAgitationRef` → false → true)
**กฎ:** screen flash blink ตลอด agitation window (`setInterval` ทุก 900ms)
**กฎ:** pause (`running = false`) → หยุด flash interval ทันที

---

## 6. Kit Structure Rules
> ⚙️ App/workflow decision — structure และ fallback logic เปลี่ยนได้ตาม product requirement

### 6.1 Slot types

```ts
slot_type: 'developer' | 'stop' | 'fixer' | 'wash_aid' | 'wetting_agent'
```

Slot เป็น **optional** — slotที่ `inventory_item_id` เป็น `null` หมายถึงช่องนั้นเว้นว่าง

### 6.2 Water rinse fallback (DevTimerPage)

ถ้า stop slot ว่างไม่มี item → สร้าง step แทนด้วย:
```ts
{ name: 'Water Rinse', durationSeconds: 45, warnings: ['ไม่มี stop bath ใน kit — ใช้ water rinse แทน'] }
```

**ห้าม skip stop slot** เพราะต้องหยุด development เสมอ

### 6.3 Bath A / Bath B ใน Two-Bath Kit

- `developer_slot_role: 'bath_a'` → slot สำหรับ Bath A bottle
- `developer_slot_role: 'bath_b'` → slot สำหรับ Bath B bottle
- Kit ที่เป็น two-bath ต้องมีทั้งสอง slot ที่มี `developer_slot_role` ต่างกัน
- **Pairing constraint:** Bath A item กับ Bath B item ต้องมี `recipe_id` เดียวกัน — validate ก่อน save kit (`chemistryErrors`)
- **Dropdown filter:** Bath B dropdown แสดงเฉพาะ items ที่มี `recipe_id` ตรงกับ Bath A ที่เลือกอยู่

---

## 7. Inventory Rules
> ⚙️ App/workflow decision — tracking model เปลี่ยนได้ตาม product requirement

### 7.1 use_count tracking

เพิ่มทุกครั้งที่ session complete — `rolls_count` ของ session บวกเพิ่มไปที่ item โดยตรง

```ts
rolls_added: rolls  // บวกตาม rolls ไม่ใช่จำนวน session
```

**กฎ:** session ที่ไม่มี inventory (anonymous) → ไม่บันทึก use_count เลย

### 7.2 Status

```ts
status: 'active' | 'exhausted' | 'expired'
```

- `exhausted` = ใช้ครบ capacity (system/user set) → ไม่แสดงใน Bath B selection ของ DevSetupPage
- `expired` = เลย shelf life ที่กำหนด — คำนวณอัตโนมัติจาก `shelf_life_days` ใน `LocalInventoryRepository`

DevSetupPage filter Bath B options: `status === 'active'` เท่านั้น

---

## 8. Navigation & Session Guard Rules
> ⚙️ App/workflow decision — navigation policy เปลี่ยนได้ตาม UX requirement

อ้างอิงรายละเอียดใน `BACK_BUTTON_POLICY.md`

### สรุปหลักสำหรับ dev flow:

| จาก | ไป | พฤติกรรม |
|----|----|---------| 
| DevEntryPage | DevSetupPage | forward เสมอ |
| DevSetupPage | DevEntryPage | back ได้เสรี (no confirmation) |
| DevTimerPage | ออกไป | bloc + confirmation modal (`ConfirmLeaveModal`) |
| DevDonePage | DevEntryPage | reset store ก่อน navigate |

**กฎ:** ออกจาก DevTimerPage ที่ `phase === 'running'` → ต้องมี confirmation เสมอ ไม่ว่าจะกด back หรือ exit session

---

## 9. Notification Settings
> ⚙️ App/workflow decision — เปลี่ยนได้ตาม UX requirement

Notification toggles อยู่ใน `useSettingsStore` — `{ sound, vibrate, screenFlash }`

| setting | event |
|---------|-------|
| `sound` | ตี Bell ที่ leading edge ของ agitation window |
| `vibrate` | Vibration ที่ leading edge ของ agitation window |
| `screenFlash` | Flash overlay blink ตลอด agitation window + transition ด้วย `transition-opacity duration-300` |

**กฎ:** แต่ละ setting เป็นอิสระ — ปิด screenFlash ไม่กระทบ sound/vibrate

---

## 10. Chemistry Compatibility Constraints
> ⚗️ Chemistry constraint — compatibility rules มาจาก chemistry ห้ามเปลี่ยนโดยไม่ verify

```ts
required_fixer_type?: 'standard' | 'alkaline'
fixer_grade?: 'film' | 'paper'
```

- `alkaline` fixer: **strongly recommended** สำหรับ pyro developers (PMK Pyro, ABC Pyro) — การใช้ acid fixer กับ pyro ยังทำงานได้ แต่จะทำลาย staining dye ซึ่งเป็น characteristic หลักของ pyro ทำให้สูญเสีย acutance และ highlight separation ที่เป็นจุดขายของสูตร
- `film` grade: ต้องใช้ film-grade fixer เสมอ — paper fixer สลาย silver iodide complex ได้ไม่สมบูรณ์ (ฟิล์มมี silver halide density สูงกว่ากระดาษ ~5 เท่า) ทำให้เกิด residual silver ที่จะเปลี่ยนเป็นสีเหลือง/น้ำตาลเมื่อเวลาผ่านไป

ปัจจุบัน constraints เหล่านี้ถูก **store ใน recipe schema** แต่ **ยังไม่มี validation UI** ที่ block user — เป็น Phase 2 feature

### 10.1 Two-Bath Fixing (Archival — future consideration)

> ยังไม่ได้ implement แต่บันทึกไว้เพื่อพิจารณาในอนาคต

**Best practice สำหรับ archival permanence:** การ fix ด้วยขวดเดียวเป็น standard practice ที่ใช้งานได้ดี แต่ถ้าต้องการ archival grade ควรใช้ two-bath fixing:

1. **Fix รอบแรก** — ใช้ fixer เก่า (exhausted batch) เพื่อ dissolve silver halide หลักออก
2. **Fix รอบสอง** — ใช้ fixer ใหม่ (fresh bath) เพื่อ clear residual silver thiosulfate complex ที่เหลือ

เหตุผล: single-bath fixing ทำให้ fixer ใหม่แบกรับ silver complex จำนวนมากตั้งแต่ต้น — two-bath ช่วยให้แน่ใจว่า final bath ยังคง active พอที่จะ remove ทุกอย่างได้สมบูรณ์

---

## 11. Data Persistence Boundaries
> ⚙️ App/technical decision — เปลี่ยนได้เมื่อ migrate ไป backend (Phase 3)
>
> ⚠️ **MVP Note:** `system recipes` ที่ hard-code อยู่ใน `data/systemRecipes.ts` เป็นแค่สถานะ MVP เท่านั้น — ในระยะยาวข้อมูล recipes ทั้งหมดจะถูกย้ายไปเก็บใน database และดึงผ่าน API แทน

| ข้อมูล | Storage | เหตุผล |
|--------|---------|--------|
| system recipes | TypeScript (`data/systemRecipes.ts`) | static seed |
| personal recipes | localStorage (`recipes` key) | local-only Phase 1 |
| inventory | localStorage (`inventory` key) | |
| kits | localStorage (`kits` key) | |
| sessions | localStorage (`sessions` key) | |
| settings, equipment | Zustand persist (localStorage) | |
| dev-session (in-progress) | Zustand persist (`dev-session` key) | survive page reload |
| mixing state | Zustand persist (`mixing` key) | |
| favoriteRecipes | IndexedDB (Dexie `FilmDevDB`) | prep for backend sync |
| offlineSavedRecipes | IndexedDB (Dexie `FilmDevDB`) | offline snapshot |

**กฎ:** เมื่อ swap ไป backend (Phase 3) เปลี่ยนเฉพาะ Repository implementation — ห้ามแตะ component/hook

---

## 12. Chemistry Mixing Constraints
> ⚗️ Chemistry constraint — mixing order และ compatibility rules มาจาก chemistry

### 12.1 Min Volume

```ts
min_volume_ml?: {
  '35mm_1roll'?: number
  '35mm_2roll'?: number
  '120_1roll'?: number
  '4x5_1sheet'?: number
}
```

ใช้บอก user ว่าต้องผสมน้ำยาอย่างน้อยเท่าไหร่ต่อ roll/format — เป็น **warning เท่านั้น ไม่มี system block** user มีอิสระในการผสมปริมาณที่ต้องการ

### 12.2 Mixing Order & Steps

- ลำดับการละลายสารเคมีกำหนดใน **recipe schema** (`chemicals[].order` และ `mixing_steps[]`)
- **กฎ:** App แสดง mixing steps ตามลำดับที่ recipe กำหนด — ไม่ generate หรือ reorder steps เอง
- ห้าม substitute สารเคมีโดยไม่สร้าง recipe ใหม่ — chemical ที่ใช้ต้องตรงกับ `chemicals[]` ใน recipe
- `mixing_steps[]` ใน recipe เป็น **informational guidance** — app ไม่ validate ว่า user ทำตามจริงหรือไม่

### 12.3 Replenishment Policy

- recipe ที่มี `constraints.reuse_compensation` กำหนดว่า developer สามารถ reuse ได้กี่ roll (`max_rolls` เป็น soft limit — warning เมื่อถึง limit แต่ไม่บล็อก)
- recipe ที่ออกแบบมาสำหรับ limited-reuse โดยไม่รองรับ replenishment **ห้ามเติมสาร** เพื่อยืด capacity — ต้องผสมใหม่เท่านั้น
- ค่า capacity จริงของแต่ละสูตรเก็บใน recipe schema ไม่ใช่ใน rules

---

## Changelog

| วันที่ | เพิ่ม/แก้ |
|--------|---------|
| 2026-04 | Initial creation — รวม rules จาก: N-level Bath B, dev timer rewrite, agitation flash system, sticky session setup CTA, two-bath no-rinse rule, reuse compensation linear policy |
| 2026-04-15 | Crosscheck กับ real-world chemistry — แก้ 4.1 (no-rinse nuance), 4.3 (compensation mechanism), 4.4 (temperature tolerance ±2–3°C), 4.5 (4×5 capacity 30–35 แผ่น), 10 (alkaline fixer: required → strongly recommended), เพิ่ม 10.1 two-bath fixing archival note |
| 2026-04-16 | Consistency & accuracy fix — เพิ่ม 1.3 (temp range constraint policy), แก้ 2 (two-bath compensation: Bath A only, Bath B fixed — ลบ proportional split ที่ผิด), แก้ 4.2 (Bath A alkali: น้อยมากไม่ใช่ไม่มีเลย), generalize 4.4.2/4.4.3/4.4.4/4.4.6 (ย้าย formula-specific values ไป recipe schema), ขยาย 12 → Chemistry Mixing Constraints (เพิ่ม 12.2 mixing order, 12.3 replenishment policy) |
