# Developer Reference

ข้อมูลเจาะลึกแต่ละ developer สูตร — dilution, timing ranges, push/pull, pros/cons

---

## One-Bath Developers

### D-76 (Kodak) / ID-11 (Ilford) — Powder Kit

**Format:** powder_kit — ผสมด้วยน้ำร้อน 50°C แล้วเติมน้ำเย็นให้ครบ 1 ลิตร
**Dilutions:**
- Stock (undiluted) — fine grain มากที่สุด, reusable (เพิ่ม 10% ต่อ roll)
- 1+1 — sharpness ดีกว่า stock เล็กน้อย, เวลา ~2× stock, one-shot แนะนำ
- 1+3 — เวลายาวมาก, contrast ต่ำ, ใช้น้อย

**Development time (HP5 Plus, 20°C, 1+1):** ~13 นาที
**Temperature range:** 18–24°C optimal, ±1°C ส่งผลประมาณ 5–8%
**Push/Pull:** +1 stop ≈ +25–30% เวลา, -1 stop ≈ −20–25%
**Reuse (stock):** max 10 rolls/litre, +10% ต่อ roll linear
**Shelf life:** stock ผสมแล้ว 6 เดือนในขวดเต็ม, diluted 1+1 = one-shot เท่านั้น

**เหมาะกับ:** HP5, Tri-X, Delta 400 — film ISO ปานกลางถึงสูง ต้องการ grain ควบคุมได้
**ไม่เหมาะ:** stand development (มี sulfite สูง → compensating effect ลด)

---

### HC-110 (Kodak) — Liquid Concentrate

**Format:** liquid_concentrate, syrup หนืด — dilution ratio สำคัญมาก
**Dilutions (จาก concentrate ตรง):**
| Dilution | Ratio | ลักษณะ |
|----------|-------|--------|
| A | 1+15 | เข้มข้นมาก, เวลาสั้น, ใช้น้อย |
| B | 1+31 | most popular, balanced |
| E | 1+47 | ใกล้เคียง D-76 1+1 |
| H | 1+63 | dilute มาก, อ่อน |

> ⚠️ HC-110 มีวิธี dilute 2 แบบ: จาก **syrup ตรง** (ratios ข้างบน) หรือจาก **1+3 working solution** (Dilution B = 1+7 จาก stock นั้น) — ต้องระวังสับสน

**Development time (HP5, 20°C, Dilution B):** ~5 นาที
**Agitation:** standard inversion (30s initial + 5s ทุก 30s)
**Shelf life concentrate:** หลายปีในขวดปิดสนิท (long shelf life เป็น selling point หลัก)
**One-shot:** แนะนำ — ไม่คุ้มเก็บ working solution ข้ามวัน

**เหมาะกับ:** ผู้ที่ล้างฟิล์มไม่บ่อย (ขวดเก็บได้นาน), ต้องการเวลาสั้น

---

### Rodinal / Adonal (Agfa/Rollei) — Liquid Concentrate

**Format:** liquid_concentrate, open ratio
**Dilutions ที่ใช้บ่อย:**
| Ratio | ลักษณะ | Use case |
|-------|--------|---------|
| 1+25 | เวลาสั้น, grain, contrast สูง | ฟิล์ม ISO ต่ำ เช่น APX 100 |
| 1+50 | balanced, most common | ทั่วไป |
| 1+100 | stand development, compensating | highlight control |
| 1+200 | semi-stand, extreme compensation | ต้องการ shadow detail มาก |

**Stand development (1+100):**
- เวลา: 1 ชั่วโมง (fixed — ไม่ใช้ temp table)
- Agitation: กวน 60s แรก แล้วทิ้งตลอด
- ผล: grain เรียบกว่า 1+50, acutance สูง, highlights ถูก exhaust ก่อน
- ปัญหาที่อาจเจอ: bromide drag (เส้นขนาน) — แก้ด้วยการกลับถัง 1 ครั้งตรงกลาง (semi-stand)

**Shelf life:** ไม่มีวันหมด (ถ้าไม่เปิดขวด), เปิดแล้วหลายปีได้
**One-shot:** เสมอ — ราคาถูก dilute มาก คุ้มค่า

**เหมาะกับ:** ฟิล์ม ISO 25–400, ต้องการ acutance สูง, slow film + stand dev
**ไม่เหมาะ:** ฟิล์ม ISO 1600+ (grain จะใหญ่มาก)

---

### XTOL (Kodak) — Powder Sachet

**Format:** powder kit sachet (5 ลิตร) — ละลายในน้ำอุณหภูมิห้อง
**Dilutions:** Stock / 1+1 / 1+2 / 1+3
**ลักษณะ:** fine grain มากที่สุดในบรรดา standard developer, แสง push ได้ดี

> ⚠️ Catastrophic failure risk: XTOL บางครั้งล้มเหลวโดยไม่มีสัญญาณเตือน (unexpected exhaustion) — ทดสอบ working strength ก่อนใช้ฟิล์มสำคัญ

**เหมาะกับ:** HP5, Delta 3200, ต้องการ fine grain และ push performance สูง

---

### Ilfosol 3 (Ilford) — Liquid Concentrate

**Format:** liquid_concentrate, **fixed** dilution 1+9
**Development time (HP5, 20°C):** ~7.5 นาที
**One-shot เท่านั้น:** ไม่รองรับ reuse
**Shelf life concentrate:** ~2 ปี

**เหมาะกับ:** beginner — dilution ตายตัว ไม่มีทางผิด, ให้ผลดีกับ Ilford films

---

### Caffenol — DIY Homebrew

**Format:** DIY powder_raw สด
**สูตรพื้นฐาน (Caffenol-C-M per litre):**
| สาร | ปริมาณ |
|-----|--------|
| Instant coffee (soluble) | 40g |
| Washing soda (Na₂CO₃ anhydrous) | 16g |
| Vitamin C (ascorbic acid) | 4g |

**ผสม:** ละลายแยกกัน แล้วเทรวม — อย่าผสมกาแฟกับ washing soda ตรงๆ (ฟอง)
**Development time (HP5, 20°C):** 13–15 นาที, agitation standard
**ข้อจำกัด:**
- ต้องใช้ภายใน 30 นาที — Vitamin C oxidize เร็วมาก
- Potency ต่ำกว่า commercial developer
- ไม่เหมาะ push processing
- Stop bath และ fixer ใช้ standard ได้ปกติ

---

## Two-Bath Developers

อ่านกลไกแบบละเอียดจาก `two-bath-chemistry.md`

### Divided D-23 — Powder Raw

**Bath A (ต่อ 1 ลิตร):**
| สาร | ปริมาณ | บทบาท |
|-----|--------|-------|
| Sodium Sulphite (anhydrous) | 100g | Preservative, developing agent carrier |
| Metol (Elon) | 7.5g | Primary developing agent |
| Water | to 1 litre | — |

> **ลำดับการผสม:** เติม sodium sulphite ก่อนเสมอ — Metol oxidize เร็วในน้ำ sulfite ช่วยป้องกัน

**Bath B (ต่อ 1 ลิตร):**
| สาร | ปริมาณ | บทบาท |
|-----|--------|-------|
| Borax (Sodium Tetraborate) | 8g | Alkali activator |
| Water | to 1 litre | — |

**N-level ผ่าน Bath B concentration:**
| N-level | Borax/litre |
|---------|-------------|
| N-1 | 4g |
| N | 8g |
| N+1 | 12g |

**เวลา:** Bath A = 5 นาที, Bath B = 5 นาที (ตายตัว, ไม่ขึ้นกับ temp)
**Temperature range:** 18–24°C (กว้างกว่า one-bath มาก)
**Agitation Bath A:** vigorous 30s initial + 5s ทุก 30s
**Agitation Bath B:** 5s initial only — น้อยมาก

---

### Thornton's 2-Bath — Powder Raw

คล้าย Divided D-23 แต่ Bath B ใช้ Sodium Metaborate (Kodalk) แทน Borax — alkali แรงกว่า Bath B เล็กน้อย

---

### Diafine — Ready-to-Use Two-Bath

ซื้อมาพร้อมใช้ ไม่ต้องผสม temperature insensitive มากที่สุดในบรรดา 2-bath developer ทนอุณหภูมิ 18–27°C ได้
