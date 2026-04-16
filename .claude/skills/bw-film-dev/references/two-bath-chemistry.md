# Two-Bath Developer — Chemistry Deep Dive

---

## กลไกหลัก: Absorption → Activation → Self-Exhaustion

### Bath A — Absorption Phase

Film แช่ใน Bath A ที่มี **developing agent** (Metol, Hydroquinone) ในสภาพ **alkaline น้อยมาก** (sulfite เป็น mild alkali)

- Gelatin emulsion ของฟิล์มดูดซับ developer เข้าไป
- Development เกิดขึ้นเพียงเล็กน้อยหรือแทบไม่เกิด (ขึ้นกับ formulation)
- **ปริมาณ developer ที่ absorbed มีขีดจำกัดตายตัว** — gelatin รับได้แค่เท่าที่อิ่มตัว

### Bath B — Activation Phase

Film ย้ายเข้า Bath B ที่เป็น **pure alkali solution** (Borax, Sodium Metaborate, Sodium Carbonate)

- Alkali ซึมเข้าไปใน gelatin
- Activate developer ที่ absorbed ไว้จาก Bath A
- Development เริ่มเกิดขึ้นอย่างจริงจัง

### Self-Exhaustion Mechanism — หัวใจของ two-bath

**บริเวณ highlight** (มี silver halide หนาแน่น):
→ developer ที่ absorbed ถูกใช้หมดเร็ว
→ development หยุดเองโดยอัตโนมัติ
→ highlight ไม่ "block up" แม้อยู่นานขึ้น

**บริเวณ shadow** (มี silver halide น้อย):
→ developer ที่ absorbed ยังเหลือ
→ development ดำเนินต่อได้
→ shadow detail ถูก preserve

**ผลลัพธ์:** Highlight compression + Shadow preservation = **Compensating effect**

---

## ผลที่ตามมาจากกลไก

### Temperature Latitude กว้าง

One-bath: อุณหภูมิส่งผลตรงต่อ reaction rate (Arrhenius kinetics) → ±1°C เปลี่ยนเวลา 5–10%

Two-bath: self-exhaustion เป็น buffer — development หยุดเมื่อ developer หมด ไม่ว่าอุณหภูมิจะเปลี่ยนเล็กน้อยแค่ไหน
- Practical range: **18–24°C สำหรับ Divided D-23, Thornton's**
- Diafine: **18–27°C** (ออกแบบให้ temperature insensitive เป็นพิเศษ)

### Time Latitude กว้าง

Bath B: เมื่อ developer ใน gelatin ถูก exhaust แล้ว development หยุดเอง ไม่ว่าจะอยู่ใน Bath B นานเท่าไหร่ → overdevelopment แทบไม่เกิด

### Push/Pull ผ่าน Bath B Concentration

**ไม่ใช้เวลา** — ใช้ความเข้มข้นของ alkali ใน Bath B แทน:
- เพิ่ม alkali → activate เร็วและแรงขึ้น → contrast เพิ่ม (push N+1, N+2)
- ลด alkali → activate ช้าและอ่อนกว่า → contrast ลด (pull N-1)

ผสม Bath B ใหม่แต่ละขวดตามระดับ N-level ที่ต้องการ — ไม่เปลี่ยนเวลา

### Agitation Effect น้อยกว่า One-Bath

Compensation มาจาก chemistry ไม่ใช่จาก agitation — แม้จะ agitate มากขึ้น developer ที่ absorbed ก็มีปริมาณคงที่อยู่แล้ว

- Bath A: agitation ช่วยให้ absorption สม่ำเสมอ → standard vigorous agitation
- Bath B: agitation น้อยที่สุด — สั้นๆ แค่ตอนเริ่ม เพื่อไม่ให้ solution เย็นชา

---

## กฎที่ต้องรู้ก่อนใช้

### ❌ ห้าม Rinse ระหว่าง Bath A → Bath B

```
❌ Bath A → Water Rinse → Bath B   (สูญเสีย compensation benefit)
✅ Bath A → Bath B ทันที           (ถูกต้อง)
```

**เหตุผล:** developer ที่ absorbed ใน gelatin จะถูกชะออกบางส่วน → ลด carryover developer → Bath B ทำงานได้แต่ compensating effect ลดลงอย่างมาก

> **Nuance:** น้ำล้างไม่ทำให้ Bath B "ไม่ทำงานเลย" แต่สูญเสีย highlight compression ซึ่งเป็นจุดขายหลักของสูตร

### ✅ Stop bath หลัง Bath B ได้ปกติ

Bath B เป็น alkali + acid stop = pH neutralization ธรรมดา ไม่มีปัญหา ใช้ stop bath ใดก็ได้

### ✅ Fixer ใช้ standard ได้ (ไม่ใช่ pyro)

Two-bath developer ใช้ Metol หรือ Hydroquinone ซึ่งไม่ต้องการ alkaline fixer — ใช้ standard sodium thiosulfate fixer ได้ปกติ

---

## Reuse และ Lifecycle

### Bath A — Depletes ตาม Use

- Developer agent ใน Bath A ถูกดูดซับทีละนิดต่อ roll
- Compensation: `adjustedBathA = baseSeconds × (1 + factor × use_count)`
- max_rolls ขึ้นกับ recipe — เป็น soft limit (warning ไม่ block)

### Bath B — Depletes ช้ามาก

- Bath B เป็นแค่ alkali solution — ไม่ได้ถูกใช้หมดเหมือน developer
- Reuse ได้หลาย session ก่อนที่จะต้องผสมใหม่
- **Bath B duration ไม่เปลี่ยนตาม use_count** — ตายตัวเสมอ

### Bath A และ Bath B — Independent Lifecycle

- ผสมใหม่แยกกันได้อิสระ
- แต่เมื่อ assign เข้า Kit ต้องมี recipe_id เดียวกัน (ห้ามจับ Bath A Divided D-23 กับ Bath B Thornton's)

---

## เปรียบเทียบ Two-Bath Developers

| | Divided D-23 | Thornton's 2-Bath | Diafine |
|--|--|--|--|
| Bath A alkali agent | Sodium Sulphite (very mild) | Sodium Sulphite | proprietary |
| Bath B alkali agent | Borax | Sodium Metaborate (Kodalk) | proprietary |
| Alkali strength B | ปานกลาง | แรงกว่าเล็กน้อย | — |
| Temperature range | 18–24°C | 18–24°C | 18–27°C |
| Typical times | 5+5 min | 5+5 min | 3+3 min |
| Format | powder_raw | powder_raw | ready_to_use |
| Mixing complexity | กลาง | กลาง | ไม่ต้องผสม |
