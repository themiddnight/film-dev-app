// data/hc110.ts
// Kodak HC-110 — liquid concentrate developer (Dilution B: 1+31)
// Source: Kodak Technical Data J-24, Massive Dev Chart
// Note: HC-110 was reformulated in 2019 (less viscous) — times unchanged

import type { Recipe } from '../types/recipe'

export const hc110: Recipe = {
  id: 'hc110-dil-b',
  name: 'HC-110 Dilution B',
  description: 'Liquid concentrate developer, Dilution B (1+31). One-shot, short development times, excellent shelf life of concentrate. Very active at temperatures above 24°C — popular for tropical and push processing.',
  author: { id: 'system', name: 'Film Dev Guidance' },
  visibility: 'public',
  tags: ['one-bath', 'concentrate', 'one-shot', 'fast', 'push'],
  film_types: ['any'],
  base_volume_ml: 1000,
  optimal_temp_range: { min: 20, max: 24 },
  references: [
    'https://www.digitaltruth.com/devchart.php',
    'https://filmdev.org/recipe/show/6923',
    'https://www.kodak.com/content/products-brochures/Film/HC-110-Developer.pdf',
  ],

  // ── Mixing Guide ──────────────────────────────────────────────────────────
  // HC-110 เป็น liquid concentrate — ไม่มี raw chemicals
  // mixing_steps แสดงวิธี dilute จาก concentrate เท่านั้น
  baths: [
    {
      id: 'hc110-working',
      name: 'HC-110 Working Solution (Dil. B)',
      developer_type: 'concentrate',
      chemicals: [
        {
          name: 'HC-110 Concentrate',
          amount_per_liter: 32, // 32 ml per 1000 ml = 1:31 (1 part concentrate + 31 parts water)
          unit: 'ml',
          order: 1,
          note: 'วัดให้แม่นยำ — HC-110 เข้มข้นมาก ต่างกัน 1–2 ml มีผลต่อ development time',
        },
      ],
      mixing_steps: [
        {
          instruction: 'วัด HC-110 Concentrate {hc110_concentrate} ml โดยใช้ syringe หรือ graduated cylinder',
          warning: 'HC-110 เหนียวมากเหมือนน้ำเชื่อม — รอให้ไหลออกจนหมด อย่าเทรวดเร็ว (post-2019 formula เหนียวน้อยลงแล้ว)',
        },
        {
          instruction: 'เทน้ำ (อุณหภูมิที่ต้องการ) {hc110_water} ml ลงในถังก่อน',
        },
        {
          instruction: 'เท HC-110 Concentrate ลงในน้ำ คนเบาๆ จนเข้ากัน — พร้อมใช้ทันที',
          warning: 'ใช้ทันที — HC-110 working solution ไม่เก็บข้ามวัน',
        },
      ],
      storage: {
        shelf_life: 'Concentrate: ไม่เปิด indefinite · เปิดแล้ว 6 เดือน (ขวดเต็ม) หรือ 2 เดือน (ขวดครึ่ง)',
        container: 'ขวดเดิมของ Kodak (plastic สีน้ำตาล) ปิดฝาแน่น',
        notes: 'เก็บ concentrate ได้นานมาก เพราะละลายในน้ำมันไม่ใช่น้ำ — working solution ทิ้งหลังใช้ทันที',
      },
    },
  ],

  // ── Develop Session ────────────────────────────────────────────────────────
  // Times for HC-110 Dilution B (1+31), Kodak Tri-X 400 / Ilford HP5 Plus 400
  // Source: Massive Dev Chart, Kodak J-24
  // ⚠️ ห้าม dev ต่ำกว่า 5 นาที — เสี่ยง uneven development
  develop_steps: [
    {
      id: 'hc110-dev',
      name: 'HC-110 Dil.B',
      type: 'developer',
      duration_seconds: 390, // 6:30 @ 20°C N — safe minimum ≥ 5:00
      duration_override_key: 'hc110.dev.duration',
      agitation: {
        initial_seconds: 30,
        interval_seconds: 30, // HC-110 ต้อง agitate บ่อยกว่า D-76
        duration_seconds: 5,
      },
      warnings: [
        'ห้าม develop น้อยกว่า 5:00 นาที — เสี่ยง uneven development',
        'HC-110 active มากที่ temp สูง — จับเวลาให้แม่นยำ',
      ],
      transition_warning: 'เท HC-110 ทิ้ง — one-shot ไม่ใช้ซ้ำ เท Stop Bath เข้าทันที',
      temp_table: {
        18: { 'N-1': 390,  'N': 510,  'N+1': 660  }, // 6:30  / 8:30  / 11:00
        20: { 'N-1': 330,  'N': 420,  'N+1': 570  }, // 5:30  / 7:00  / 9:30 (≥5:00 enforced)
        21: { 'N-1': 300,  'N': 390,  'N+1': 510  }, // 5:00  / 6:30  / 8:30
        22: { 'N-1': 300,  'N': 360,  'N+1': 480  }, // 5:00  / 6:00  / 8:00 (N-1 floored at 5:00)
        24: { 'N-1': 300,  'N': 330,  'N+1': 420  }, // 5:00  / 5:30  / 7:00 (floored)
        26: { 'N-1': 300,  'N': 300,  'N+1': 375  }, // 5:00  / 5:00  / 6:15 (floored)
        28: { 'N-1': 300,  'N': 300,  'N+1': 330  }, // 5:00  / 5:00  / 5:30 (floored — consider Dil. D at this temp)
      },
    },
    {
      id: 'hc110-water-rinse',
      name: 'Water Rinse',
      type: 'rinse',
      duration_seconds: 60,
      agitation: {
        initial_seconds: 60,
        interval_seconds: 60,
        duration_seconds: 60,
      },
    },
    {
      id: 'hc110-stop',
      name: 'Stop Bath',
      type: 'stop',
      duration_seconds: 60,
      agitation: {
        initial_seconds: 30,
        interval_seconds: 30,
        duration_seconds: 5,
      },
    },
    {
      id: 'hc110-fixer',
      name: 'Fixer',
      type: 'fixer',
      duration_seconds: 480,
      duration_override_key: 'hc110.fixer.duration',
      agitation: {
        initial_seconds: 30,
        interval_seconds: 60,
        duration_seconds: 5,
      },
      warnings: ['วัด clearing time แล้วคูณ 2'],
    },
    {
      id: 'hc110-wash',
      name: 'Final Wash',
      type: 'wash',
      duration_seconds: 600,
      agitation: {
        initial_seconds: 600,
        interval_seconds: 600,
        duration_seconds: 600,
      },
    },
    {
      id: 'hc110-dry',
      name: 'ผึ่งแห้ง',
      type: 'dry',
      duration_seconds: 'variable',
      warnings: ['ผึ่งแห้งในที่ไม่มีฝุ่น 1–2 ชั่วโมง'],
    },
  ],
}
