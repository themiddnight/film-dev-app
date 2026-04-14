# Film Dev Guidance — Rules & Constraints

> เอกสารนี้รวบรวม business rules, chemistry constraints, และ implementation decisions
> ที่ถูก encode ไว้ในระบบตั้งแต่เริ่มต้นจนถึงปัจจุบัน (April 2026)
>
> **ใช้ไฟล์นี้เป็น reference แรก** ก่อนแก้ logic ใน `utils/dev.ts`, timer pages, หรือ data types

---

## 1. Timing Calculation Rules

### 1.1 เส้นทางหา base time

Developer timing มีสี่ประเภท (`DevelopTiming.type`):

| type | กฎ |
|------|-----|
| `fixed` | ใช้ `fixed_seconds` ตรงๆ ไม่คำนึงถึงอุณหภูมิ/dev_type |
| `temp_table` | หา entry ที่ temperature ใกล้ที่สุด → เลือก key ที่ตรงกับ `dev_type` → fallback `N` |
| `push_pull_table` | ใช้ base temp คงที่ → เลือก `dev_type` key → fallback `N` |
| `combined` | ลองทั้งสองและ combine ตาม implementation |

**กฎ fallback:** ถ้า `dev_type` ไม่มีใน table → fallback ไปใช้ `N` เสมอ

**Two-bath override:** ถ้า `recipe.constraints.is_two_bath === true` และ `recipe.develop_steps` มีข้อมูล → อย่าใช้ `develop_timing` เลย ให้ไปอ่าน duration จาก `develop_steps[].duration_seconds` แทน

### 1.2 Temperature lookup

ใช้ **closest neighbor** (ไม่ใช่ interpolation):
```ts
let closest = temps[0]
for (const t of temps) {
  if (Math.abs(t - tempCelsius) < Math.abs(closest - tempCelsius)) closest = t
}
```
ยังไม่มี interpolation ระหว่างอุณหภูมิในระบบปัจจุบัน

---

## 2. Reuse Compensation Rules

### กฎหลัก (ห้ามเปลี่ยน)

- Compensation คำนวณแบบ **linear ต่อ roll** — ไม่ใช่ bucket/step tier
- สูตร: `adjustedSeconds = baseSeconds × (1 + (time_increase_per_roll × use_count))`
- `use_count` มาจาก `InventoryItem.use_count` ของ developer item (bath_a สำหรับ two-bath)
- ถ้า `use_count === 0` → ไม่มี compensation (ของใหม่)
- `max_rolls` ใน schema เป็นแค่ warning hint ไม่ได้บล็อกการใช้งาน

### Two-bath compensation

สำหรับ Thornton's 2-Bath:
- Bath A เท่านั้นที่มี `reuse_compensation` (Bath A เป็นตัวที่ exhaust)
- Bath B ไม่มีกลไก compensation — ใช้ N-level เป็นตัวแทนแทน
- หลัง compensate แล้ว แบ่งเวลาตามสัดส่วน original: `adjustedTotal × (bathSeconds / baseTotal)`

---

## 3. Agitation Time Multipliers

Recipe สามารถระบุ multiplier ตาม `agitation_method` ได้ใน `recipe.constraints.agitation_time_multipliers`:

```ts
agitation_time_multipliers?: {
  inversion?: number  // 1.0 = default
  rotary?: number     // rotary/rotation map ไปหา key เดียวกัน
  stand?: number
}
```

**กฎ:** multiplier apply หลัง temp_table lookup แต่ก่อน reuse compensation

**ไม่มี multiplier สำหรับ two-bath:** Thornton's 2-Bath ใช้ duration ตายตัวใน `develop_steps` — multiplier ไม่ได้ถูก apply ต่อที่ step level

---

## 4. Thornton's 2-Bath — Chemistry Rules

### 4.1 ห้าม rinse/stop ระหว่าง Bath A และ Bath B

> นี่คือ **ข้อห้ามหลักทางเคมี** — ต้องแสดง warning ทุกครั้งก่อน transition

สาเหตุ: Bath A ต้องนำ developer ที่ absorbed ไว้ในฟิล์มไปเข้า Bath B เพื่อ activate — ถ้าล้างน้ำก่อน developer จะถูกชะออกและ **compensation effect จะลดลงอย่างมาก**

> **Nuance (verified):** การล้างน้ำไม่ได้ทำให้ Bath B "ไม่ทำงานเลย" แต่จะลด carryover developer ที่นำไปใช้ใน Bath B ทำให้สูญเสีย compensation benefit หลักของสูตรนี้ไป — rule ที่ enforce ห้าม rinse จึงถูกต้องเพื่อ best practice

**ข้อความ warning ที่ใช้ใน code:** `"ห้ามล้างน้ำ — เท Bath B ทันที"`

### 4.2 Bath B N-level (Push/Pull)

N-level ของ Thornton's 2-Bath ถูก control ผ่าน Bath B concentration — ไม่ใช่ผ่าน develop time:

| N-level | Bath B (Sodium Metaborate) | ผลลัพธ์ |
|---------|---------------------------|---------|
| N-1 | ประมาณ 8–10 g/L | contrast ลดลง |
| N (standard) | 12 g/L | standard |
| N+1 | ประมาณ 14–16 g/L | contrast เพิ่ม |

**กฎใน code:** `InventoryItem.n_level` เป็นตัวบ่งชี้ว่า Bath B นี้อยู่ที่ระดับไหน — user เลือก Bath B item ใน DevSetupPage → ส่งผลต่อ contrast ไม่ใช่เวลา

### 4.3 Agitation ต่างกันแต่ละ Bath

| Bath | Initial | ทุกนาที |
|------|---------|---------|
| Bath A | 30–60 วินาที (continuous initial) | 10 วินาที |
| Bath B | 5 วินาที | 5 วินาที (น้อยกว่า A โดยตั้งใจ) |

เหตุผล: กลไก compensation หลักมาจาก **developer carryover จาก Bath A ที่มีปริมาณจำกัดและ exhaust ในบริเวณ highlight เอง** — shadow ที่มี silver density ต่ำกว่าจึงยังคง develop ต่อได้ Agitation ที่น้อยใน Bath B ช่วยเสริมความสม่ำเสมอ แต่ไม่ใช่ตัวการหลักของ compensation

> **Nuance (verified):** การบอกว่า "agitate น้อย → compensation ดีขึ้น" เป็นการ simplify — จริงๆ compensation เกิดขึ้นโดย chemistry ไม่ว่า agitate เท่าไหร่ก็ตาม แต่ agitation pattern ที่แนะนำ (5 sec/min) ช่วยให้ผลออกมาสม่ำเสมอที่สุด

### 4.4 Temperature

21°C (70°F) เป็น standard — สูตรนี้ tolerant ต่ออุณหภูมิมากกว่า developer ทั่วไป (เช่น D-76) แต่ไม่ได้ immune

**ช่วงที่ยอมรับได้ (verified):** ±2–3°C จาก 21°C — ที่ 23–24°C ขึ้นไปควร test ก่อน เพราะอาจส่งผลต่อ shadow density

> เหตุที่ tolerant กว่าปกติ: กลไก two-bath exhaustion ทำหน้าที่เป็น temperature buffer ในตัวเอง แต่ยังคงมีผลอยู่บ้างเมื่ออุณหภูมิสูงขึ้นมากกว่า ±3°C

### 4.5 Capacity

- 35mm / 120: สูงสุด **15 ม้วน** ต่อ 1 litre (Thornton ระบุ 10–15 ม้วน — ค่า 15 คือ upper bound)
- 4×5 sheet: **~30–35 แผ่น** ต่อ 1 litre (จากข้อมูลจริง ~33 แผ่น/litre — ค่าเดิม 45 สูงเกินไป)
- **ไม่มี replenishment** — เป็น one-shot / limited-reuse developer โดยการออกแบบ ห้ามเติมสารเพื่อยืด capacity

---

## 5. Dev Session Rules

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

- `developer_bath_role: 'bath_a'` → Developer solution (Metol + Sodium Sulphite)
- `developer_bath_role: 'bath_b'` → Alkaline accelerator (Sodium Metaborate)
- Kit ที่เป็น two-bath ต้องมีทั้งสอง slot ที่มี `developer_bath_role` ต่างกัน

---

## 7. Inventory Rules

### 7.1 use_count tracking

เพิ่มทุกครั้งที่ session complete — `rolls_count` ของ session บวกเพิ่มไปที่ item โดยตรง

```ts
rolls_added: rolls  // บวกตาม rolls ไม่ใช่จำนวน session
```

**กฎ:** session ที่ไม่มี inventory (anonymous) → ไม่บันทึก use_count เลย

### 7.2 Status

```ts
status: 'active' | 'exhausted' | 'discarded'
```

- `exhausted` = ใช้ครบ capacity (system/user set) → ไม่แสดงใน Bath B selection ของ DevSetupPage
- `discarded` = ทิ้งแล้ว manually

DevSetupPage filter Bath B options: `status === 'active'` เท่านั้น

---

## 8. Navigation & Session Guard Rules

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

Notification toggles อยู่ใน `useSettingsStore` — `{ sound, vibrate, screenFlash }`

| setting | event |
|---------|-------|
| `sound` | ตี Bell ที่ leading edge ของ agitation window |
| `vibrate` | Vibration ที่ leading edge ของ agitation window |
| `screenFlash` | Flash overlay blink ตลอด agitation window + transition ด้วย `transition-opacity duration-300` |

**กฎ:** แต่ละ setting เป็นอิสระ — ปิด screenFlash ไม่กระทบ sound/vibrate

---

## 10. Chemistry Compatibility Constraints

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

## 12. Min Volume Rules

```ts
min_volume_ml?: {
  '35mm_1roll'?: number
  '35mm_2roll'?: number
  '120_1roll'?: number
  '4x5_1sheet'?: number
}
```

ใช้บอก user ว่าต้องผสมน้ำยาอย่างน้อยเท่าไหร่ต่อ roll/format ปัจจุบันเป็น informational เท่านั้น — ไม่มี system block

---

## Changelog

| วันที่ | เพิ่ม/แก้ |
|--------|---------|
| 2026-04 | Initial creation — รวม rules จาก: N-level Bath B, dev timer rewrite, agitation flash system, sticky session setup CTA, two-bath no-rinse rule, reuse compensation linear policy |
| 2026-04-15 | Crosscheck กับ real-world chemistry — แก้ 4.1 (no-rinse nuance), 4.3 (compensation mechanism), 4.4 (temperature tolerance ±2–3°C), 4.5 (4×5 capacity 30–35 แผ่น), 10 (alkaline fixer: required → strongly recommended), เพิ่ม 10.1 two-bath fixing archival note |
