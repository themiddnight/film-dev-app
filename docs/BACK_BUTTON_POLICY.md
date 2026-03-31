# Back Button Policy

> **Status:** Finalized · Phase 1
> **Last updated:** 2026-03-30

กฎหลัก: **"ฟิล์มอยู่ในน้ำยา = ห้าม back ตรงๆ"**

---

## สรุปเร็ว

| Screen | Back ได้? | ปลายทาง | หมายเหตุ |
|--------|-----------|---------|----------|
| 01 · Home | — | — | no back |
| 02 · Recipe Select (Develop) | ✅ ได้เสมอ | 01 Home | |
| 03 · Step Preview | ⚠️ confirm ถ้าแก้เวลา | 02 Recipe Select | reset custom times |
| 04 · Active Timer (running) | 🚫 ไม่มีปุ่ม back | — | pause → dialog ก่อน |
| 04 · Active Timer (paused) | ⚠️ confirm | 01 Home | warning: ฟิล์มเสียหาย |
| 05 · Step Complete | 🚫 ไม่มีปุ่ม back | — | มีแค่ "เริ่ม [step ถัดไป]" + emergency exit |
| 06 · All Done | ✅ — | 01 Home (ปุ่ม "กลับหน้าหลัก") | ไม่มีลูกศร back |
| 07 · Settings | ✅ ได้เสมอ | 01 Home | save auto |
| 12 · Mixing: Recipe Select | ✅ ได้เสมอ | 01 Home | |
| 08 · Mixing: Selection Screen | ✅ ได้เสมอ | 12 | |
| 09 · Shopping List (Prep) | ⚠️ confirm ถ้า tick ไปแล้ว | 08 | |
| 10 · Shopping List (SBS) | ⚠️ confirm ถ้า tick ไปแล้ว | 08 | |
| 11 · Mix Checklist | ⚠️ confirm ถ้า tick ไปแล้ว | 09 หรือ 10 | |

---

## รายละเอียดแต่ละ screen

### 01 · Home
ไม่มีปุ่ม back — เป็น root screen

### 02 · Recipe Select (Develop)
- Back ได้ทันทีเสมอ — ยังไม่มี state ที่จะเสีย
- Implementation: `navigate(-1)` หรือ `navigate('/')`

### 03 · Step Preview
- ถ้าผู้ใช้ **ยังไม่แก้เวลาใดๆ** → back ได้ทันที
- ถ้าผู้ใช้ **แก้เวลาไปแล้ว** (มี custom overrides) → แสดง confirm dialog:
  > "ออกจากหน้านี้? การแก้ไขเวลาจะถูกยกเลิก"
  - ยืนยัน → clear overrides จาก store → navigate back
  - ยกเลิก → อยู่หน้าเดิม
- Implementation: ตรวจ `hasUnsavedOverrides` จาก store ก่อน navigate

### 04 · Active Timer
**สถานะ running:**
- **ไม่มีปุ่ม back / ลูกศร back ใน navbar**
- มีแค่ปุ่ม Pause
- browser back gesture (swipe/button) → intercept ด้วย `useBlocker` หรือ `beforeunload`

**สถานะ paused:**
- แสดง dialog:
  > "⚠️ ออกจาก session?
  > ฟิล์มยังอยู่ในน้ำยา — การออกกลางคันอาจทำให้ฟิล์มเสียหาย"
  > [ออก — กลับหน้าหลัก] [อยู่ต่อ]
- ถ้าเลือก "ออก" → clear session state → navigate('/')
- ไม่ navigate ย้อนกลับไป Step Preview (ฟิล์มเริ่มล้างแล้ว)

### 05 · Step Complete
- **ไม่มีปุ่ม back** — ไม่ควร back ไป Active Timer ของ step ที่เสร็จแล้ว
- มี "Emergency exit" เล็กๆ (ไม่ใช่ปุ่มหลัก):
  > "ออก session" → confirm dialog เดียวกับ 04 paused → navigate('/')
- ปุ่มหลักมีแค่ "เริ่ม [step ถัดไป] →"

### 06 · All Done
- ไม่มีปุ่ม back — session จบแล้ว
- มีปุ่ม "กลับหน้าหลัก" และ "ล้างฟิล์มม้วนใหม่"

### 07 · Settings
- Back ได้ทันทีเสมอ — settings save ทันทีที่เปลี่ยน (no "save" button)
- Implementation: `navigate(-1)` หรือ `navigate('/')`

### 12 · Mixing: Recipe Select
- Back ได้ทันทีเสมอ → 01 Home

### 08 · Mixing: Selection Screen
- Back ได้ทันทีเสมอ → 12
- ยังไม่มี state ที่จะเสีย

### 09, 10 · Shopping List (Prep / SBS)
- ถ้ายัง **ไม่ tick** อะไร → back ได้ทันที
- ถ้า **tick ไปแล้ว ≥ 1 รายการ** → confirm:
  > "ออกจากการเตรียม? tick ที่ทำไว้จะหายไป"
  - ยืนยัน → clear prep progress → navigate back

### 11 · Mix Checklist
- ถ้ายัง **ไม่ tick** → back ได้ทันที → 09/10
- ถ้า **tick ไปแล้ว ≥ 1 step** → confirm:
  > "ออกจากการผสม? ความคืบหน้าจะหายไป"
  - ยืนยัน → clear mix progress → navigate back

---

## Implementation Notes

### Router blocking
```tsx
// ใช้ useBlocker จาก react-router-dom v6.9+
const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    isTimerRunning && currentLocation.pathname !== nextLocation.pathname
);
```

### Confirm dialog component
ใช้ DaisyUI `modal` component เดียวกันทั่วทั้ง app:
```tsx
<ConfirmLeaveModal
  open={blocker.state === 'blocked'}
  message="ฟิล์มยังอยู่ในน้ำยา — ออกกลางคันอาจทำให้ฟิล์มเสียหาย"
  confirmLabel="ออก — กลับหน้าหลัก"
  cancelLabel="อยู่ต่อ"
  onConfirm={() => blocker.proceed()}
  onCancel={() => blocker.reset()}
/>
```

### Recipe-specific considerations
- **One-shot recipes** (Rodinal, HC-110): ใน Step Complete เพิ่ม note "ทิ้งน้ำยาทันที — ใช้ซ้ำไม่ได้" แต่ไม่เปลี่ยน back policy
- **Divided D-23**: transition warning "ห้ามล้างน้ำ — เท Bath B ทันที" ใน Step Complete แต่ back policy เหมือนกัน
