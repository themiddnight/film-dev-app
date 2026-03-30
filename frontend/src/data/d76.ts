// data/d76.ts
// Kodak D-76 (≡ Ilford ID-11) — classic one-bath developer from raw chemicals
// Formula: Kodak published formula / Anchell & Troop "The Film Developing Cookbook"
// Development times: Massive Dev Chart + Kodak Technical Data

import type { Recipe } from '../types/recipe'

export const d76: Recipe = {
  id: 'd76',
  name: 'Kodak D-76',
  description: 'Classic fine-grain one-bath developer. Excellent sharpness and tonality for box-speed shooting. The industry reference standard — predictable, forgiving, and well-documented. Identical formula to Ilford ID-11.',
  author: { id: 'system', name: 'Film Dev Guidance' },
  visibility: 'public',
  tags: ['one-bath', 'fine-grain', 'classic', 'reusable', 'standard'],
  film_types: ['any'],
  base_volume_ml: 1000,
  optimal_temp_range: { min: 20, max: 24 },
  references: [
    'https://www.digitaltruth.com/devchart.php',
    'https://filmdev.org/recipe/show/53',
    'https://www.kodak.com/content/products-brochures/Film/D-76-Developer.pdf',
  ],

  // ── Mixing Guide ──────────────────────────────────────────────────────────
  baths: [
    {
      id: 'd76-stock',
      name: 'D-76 Stock',
      role: 'developer',
      chemical_format: 'raw_powder',
      mixing_required: true,
      dilution_ratio: '1:1',
      chemicals: [
        {
          name: 'Metol (Elon)',
          amount_per_liter: 2,
          unit: 'g',
          order: 1,
          note: 'ใส่ก่อนเสมอ — ต้องละลายหมดก่อนใส่ Hydroquinone มิฉะนั้น Hydroquinone จะไม่ละลาย',
        },
        {
          name: 'Sodium Sulphite (anhydrous)',
          amount_per_liter: 100,
          unit: 'g',
          order: 2,
          note: 'ใส่หลัง Metol — ช่วยป้องกัน oxidation',
        },
        {
          name: 'Hydroquinone',
          amount_per_liter: 5,
          unit: 'g',
          order: 3,
          note: 'ใส่หลัง Sodium Sulphite เสมอ — ห้ามใส่ก่อน Metol',
        },
        {
          name: 'Borax (Sodium Tetraborate)',
          amount_per_liter: 2,
          unit: 'g',
          order: 4,
        },
      ],
      mixing_steps: [
        {
          instruction: 'เทน้ำอุ่น ~52°C ({volume_75pct} ml) ลงในภาชนะ — น้ำอุ่นช่วยละลายสารเคมีได้ดีขึ้น',
        },
        {
          instruction: 'ใส่ Metol {metol_d76} g คนจนละลายหมด — อาจใช้เวลาสักครู่',
          warning: 'ต้องละลาย Metol ให้หมดก่อนใส่ Hydroquinone เสมอ',
          chemicals: [{ name: 'Metol (Elon)', amount_per_liter: 2, unit: 'g', order: 1 }],
        },
        {
          instruction: 'ใส่ Sodium Sulphite {sodium_sulphite} g คนจนละลายหมด',
          chemicals: [{ name: 'Sodium Sulphite (anhydrous)', amount_per_liter: 100, unit: 'g', order: 2 }],
        },
        {
          instruction: 'ใส่ Hydroquinone {hydroquinone} g คนจนละลายหมด',
          chemicals: [{ name: 'Hydroquinone', amount_per_liter: 5, unit: 'g', order: 3 }],
        },
        {
          instruction: 'ใส่ Borax {borax_d76} g คนจนละลายหมด',
          chemicals: [{ name: 'Borax (Sodium Tetraborate)', amount_per_liter: 2, unit: 'g', order: 4 }],
        },
        {
          instruction: 'เติมน้ำเย็น (อุณหภูมิห้อง) จนครบ {target_volume} ml ปล่อยให้เย็นลงก่อนใช้',
        },
      ],
      storage: {
        shelf_life: '6 months (stock) · 24 hours (diluted 1:1)',
        container: 'dark glass bottle, filled to top, sealed',
        notes: 'เก็บให้เต็มขวดที่สุดเพื่อลด headspace — อากาศทำให้เสื่อมสภาพ ห้ามใช้ diluted solution ข้ามวัน',
      },
    },
  ],

  // ── Develop Session ────────────────────────────────────────────────────────
  // Times for D-76 1:1 dilution (one-shot), Kodak Tri-X 400 / Ilford HP5 Plus 400
  // Source: Massive Dev Chart, Kodak Technical Data
  develop_steps: [
    {
      id: 'd76-dev',
      name: 'D-76 1:1',
      type: 'developer',
      bath_ref: 'd76-stock',
      duration_seconds: 660, // 11:00 @ 20°C N — default
      duration_override_key: 'd76.dev.duration',
      agitation: {
        initial_seconds: 30,
        interval_seconds: 60,
        duration_seconds: 5,
      },
      warnings: ['ใช้ dilution 1:1 (stock 1 ส่วน : น้ำ 1 ส่วน) — one-shot ทิ้งหลังใช้'],
      transition_warning: 'เท D-76 ทิ้ง (one-shot) — ไม่ใช้ซ้ำ ล้างน้ำสั้นๆ ก่อน Stop Bath',
      temp_table: {
        18: { 'N-1': 600, 'N': 780, 'N+1': 1020 }, // 10:00 / 13:00 / 17:00
        20: { 'N-1': 495, 'N': 660, 'N+1': 870 }, // 8:15  / 11:00 / 14:30
        21: { 'N-1': 450, 'N': 600, 'N+1': 780 }, // 7:30  / 10:00 / 13:00
        22: { 'N-1': 405, 'N': 540, 'N+1': 720 }, // 6:45  / 9:00  / 12:00
        24: { 'N-1': 345, 'N': 465, 'N+1': 600 }, // 5:45  / 7:45  / 10:00
        26: { 'N-1': 300, 'N': 390, 'N+1': 510 }, // 5:00  / 6:30  / 8:30
        28: { 'N-1': 255, 'N': 330, 'N+1': 435 }, // 4:15  / 5:30  / 7:15
      },
    },
    {
      id: 'd76-water-rinse',
      name: 'Water Rinse',
      type: 'rinse',
      duration_seconds: 60,
      agitation: {
        initial_seconds: 60,
        interval_seconds: 60,
        duration_seconds: 60,
      },
      transition_warning: 'ล้างน้ำ 3 รอบก็พอ แล้วเท Stop Bath เข้าทันที',
    },
    {
      id: 'd76-stop',
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
      id: 'd76-fixer',
      name: 'Fixer',
      type: 'fixer',
      duration_seconds: 480, // 8:00 default — user วัด clearing time × 2
      duration_override_key: 'd76.fixer.duration',
      agitation: {
        initial_seconds: 30,
        interval_seconds: 60,
        duration_seconds: 5,
      },
      warnings: ['วัด clearing time แล้วคูณ 2 — อย่าใช้ default โดยไม่ทดสอบ'],
    },
    {
      id: 'd76-wash',
      name: 'Final Wash',
      type: 'wash',
      duration_seconds: 600, // 10:00
      agitation: {
        initial_seconds: 600,
        interval_seconds: 600,
        duration_seconds: 600,
      },
    },
    {
      id: 'd76-dry',
      name: 'ผึ่งแห้ง',
      type: 'dry',
      duration_seconds: 'variable',
      warnings: ['ผึ่งแห้งในที่ไม่มีฝุ่น 1–2 ชั่วโมง ห้ามเช็ดฟิล์มก่อนแห้ง'],
    },
  ],
}
