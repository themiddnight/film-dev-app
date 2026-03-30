// data/divided-d23.ts
// Divided D-23 + Borax — static recipe data (Phase 1)

import type { Recipe } from '../types/recipe'

export const dividedD23: Recipe = {
  id: 'divided-d23',
  name: 'Divided D-23 + Borax',
  description: 'Two-bath divided developer. Bath A provides soft, compensating development. Bath B (Borax activator) controls contrast. Excellent for high-ISO and push processing in tropical climates.',
  author: { id: 'system', name: 'Film Dev Guidance' },
  visibility: 'public',
  tags: ['two-bath', 'low-contrast', 'tropical', 'compensating', 'reusable'],
  film_types: ['any'],
  base_volume_ml: 1000,
  optimal_temp_range: { min: 24, max: 28 },
  references: [
    'https://www.digitaltruth.com/devchart.php',
    'https://filmdev.org/recipe/show/4850',
  ],

  // ── Mixing Guide ──────────────────────────────────────────────────────────
  baths: [
    {
      id: 'bath-a',
      name: 'Bath A — Developer',
      role: 'developer',
      chemical_format: 'raw_powder',
      mixing_required: true,
      chemicals: [
        {
          name: 'Sodium Sulphite',
          amount_per_liter: 100,
          unit: 'g',
          order: 1,
          note: 'ใส่ก่อน Metol เสมอ — ช่วยละลาย Metol ได้ดีขึ้นและป้องกัน oxidation',
        },
        {
          name: 'Metol',
          amount_per_liter: 7.5,
          unit: 'g',
          order: 2,
          note: 'ใส่หลัง Sodium Sulphite เสมอ — ห้ามกลับลำดับ',
        },
      ],
      mixing_steps: [
        {
          instruction: 'เทน้ำกลั่น {volume_75pct} ml ลงในภาชนะ (อุณหภูมิห้อง ~25°C)',
        },
        {
          instruction: 'ใส่ Sodium Sulphite {sodium_sulphite} g คนจนละลายหมด',
          warning: 'ต้องใส่ Sodium Sulphite ก่อน Metol เสมอ',
          chemicals: [{ name: 'Sodium Sulphite', amount_per_liter: 100, unit: 'g', order: 1 }],
        },
        {
          instruction: 'ใส่ Metol {metol} g คนจนละลายหมด',
          chemicals: [{ name: 'Metol', amount_per_liter: 7.5, unit: 'g', order: 2 }],
        },
        {
          instruction: 'เติมน้ำกลั่นให้ครบ {target_volume} ml',
        },
      ],
      storage: {
        shelf_life: '6–12 months',
        container: 'amber bottle, sealed, keep cool',
        notes: 'เก็บในขวดสีชา อุดฝาแน่น หลีกเลี่ยงแสงและความร้อน',
      },
    },
    {
      id: 'bath-b',
      name: 'Bath B — Activator',
      role: 'developer',
      chemical_format: 'raw_powder',
      mixing_required: true,
      chemicals: [
        {
          name: 'Borax',
          amount_per_liter: 10,
          unit: 'g',
          order: 1,
        },
      ],
      mixing_steps: [
        {
          instruction: 'เทน้ำอุ่น ~50°C จำนวน {volume_50pct} ml ลงในภาชนะ (ช่วยละลาย Borax)',
        },
        {
          instruction: 'ใส่ Borax {borax} g คนจนละลายหมด',
          chemicals: [{ name: 'Borax', amount_per_liter: 10, unit: 'g', order: 1 }],
        },
        {
          instruction: 'เติมน้ำกลั่น (อุณหภูมิห้อง) จนครบ {target_volume} ml',
        },
      ],
      storage: {
        shelf_life: '12+ months',
        container: 'any bottle, sealed',
        notes: 'เสถียรมาก เก็บได้นาน',
      },
    },
    {
      id: 'stop-bath',
      name: 'Stop Bath',
      role: 'stop',
      chemical_format: 'raw_powder',
      mixing_required: true,
      chemicals: [
        {
          name: 'Potassium Metabisulphite',
          amount_per_liter: 22.5,  // midpoint of 20–25g range
          unit: 'g',
          order: 1,
          note: 'ใช้ช่วง 20–25 g/L ได้ตามที่มี',
        },
      ],
      mixing_steps: [
        {
          instruction: 'เทน้ำ {target_volume} ml ลงในภาชนะ',
        },
        {
          instruction: 'ใส่ Potassium Metabisulphite {potassium_metabisulphite} g คนจนละลาย',
          chemicals: [{ name: 'Potassium Metabisulphite', amount_per_liter: 22.5, unit: 'g', order: 1 }],
        },
      ],
      storage: {
        shelf_life: '6 months',
        container: 'sealed bottle',
      },
    },
    {
      id: 'fixer',
      name: 'Fixer',
      role: 'fixer',
      chemical_format: 'raw_powder',
      mixing_required: true,
      chemicals: [
        {
          name: 'Sodium Thiosulphate (Hypo)',
          amount_per_liter: 250,
          unit: 'g',
          order: 1,
        },
        {
          name: 'Sodium Sulphite',
          amount_per_liter: 15,
          unit: 'g',
          order: 2,
          note: 'ใส่หลัง Sodium Thiosulphate',
        },
      ],
      mixing_steps: [
        {
          instruction: 'เทน้ำอุ่น ~40°C จำนวน {volume_75pct} ml ลงในภาชนะ',
        },
        {
          instruction: 'ใส่ Sodium Thiosulphate {sodium_thiosulphate} g คนจนละลายหมด',
          chemicals: [{ name: 'Sodium Thiosulphate (Hypo)', amount_per_liter: 250, unit: 'g', order: 1 }],
        },
        {
          instruction: 'ใส่ Sodium Sulphite {sodium_sulphite_fixer} g คนจนละลาย',
          chemicals: [{ name: 'Sodium Sulphite', amount_per_liter: 15, unit: 'g', order: 2 }],
        },
        {
          instruction: 'เติมน้ำให้ครบ {target_volume} ml ปล่อยให้เย็นก่อนใช้',
        },
      ],
      storage: {
        shelf_life: '3–6 months',
        container: 'sealed bottle',
        notes: 'ทิ้งเมื่อเริ่มเป็นสีเหลืองเข้มหรือ fix ช้าลงชัดเจน',
      },
    },
  ],

  // ── Develop Session ────────────────────────────────────────────────────────
  develop_steps: [
    {
      id: 'bath-a-dev',
      name: 'Bath A — Developer',
      type: 'developer',
      bath_ref: 'bath-a',
      duration_seconds: 210,  // default 3:30 @ 26°C, N — overridden by temp_table
      duration_override_key: 'divided-d23.bath-a.duration',
      agitation: {
        initial_seconds: 30,
        interval_seconds: 60,
        duration_seconds: 5,
      },
      warnings: ['ห้าม pre-wet ฟิล์ม — เทน้ำยาตรงๆ'],
      transition_warning: 'เท Bath A กลับขวดทันที — ห้ามล้างน้ำก่อนเท Bath B',
      temp_table: {
        20: { 'N-1': 300, 'N': 360, 'N+1': 480 },
        21: { 'N-1': 270, 'N': 330, 'N+1': 450 },
        22: { 'N-1': 240, 'N': 300, 'N+1': 420 },
        23: { 'N-1': 225, 'N': 270, 'N+1': 375 },
        24: { 'N-1': 210, 'N': 255, 'N+1': 360 },
        25: { 'N-1': 195, 'N': 240, 'N+1': 330 },
        26: { 'N-1': 180, 'N': 210, 'N+1': 300 },
        27: { 'N-1': 165, 'N': 195, 'N+1': 270 },
        28: { 'N-1': 150, 'N': 180, 'N+1': 255 },
      },
    },
    {
      id: 'bath-b-act',
      name: 'Bath B — Activator',
      type: 'activator',
      bath_ref: 'bath-b',
      duration_seconds: 300,  // 5:00 — คงที่เสมอ ไม่ขึ้นกับอุณหภูมิ
      agitation: {
        initial_seconds: 30,
        interval_seconds: 60,
        duration_seconds: 5,
      },
      warnings: ['เวลา Bath B คงที่ 5 นาที ไม่ขึ้นกับอุณหภูมิหรือ N/N+1'],
      transition_warning: 'เท Bath B กลับขวด — ล้างน้ำสั้นๆ 30 วินาทีก่อน Stop Bath',
    },
    {
      id: 'water-rinse',
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
      id: 'stop-bath-dev',
      name: 'Stop Bath',
      type: 'stop',
      bath_ref: 'stop-bath',
      duration_seconds: 60,
      agitation: {
        initial_seconds: 30,
        interval_seconds: 30,
        duration_seconds: 5,
      },
    },
    {
      id: 'fixer-dev',
      name: 'Fixer',
      type: 'fixer',
      bath_ref: 'fixer',
      duration_seconds: 480,  // 8:00 default — user override ได้
      duration_override_key: 'divided-d23.fixer.duration',
      agitation: {
        initial_seconds: 30,
        interval_seconds: 60,
        duration_seconds: 5,
      },
      warnings: ['วัด clearing time จริงแล้วคูณ 2 เพื่อความปลอดภัย'],
    },
    {
      id: 'final-wash',
      name: 'Final Wash',
      type: 'wash',
      duration_seconds: 600,  // 10:00
      agitation: {
        initial_seconds: 600,
        interval_seconds: 600,
        duration_seconds: 600,
      },
    },
    {
      id: 'dry',
      name: 'ผึ่งแห้ง',
      type: 'dry',
      duration_seconds: 'variable',
      warnings: ['ผึ่งแห้งในที่ไม่มีฝุ่น 1–2 ชั่วโมงก่อนตัดฟิล์ม'],
    },
  ],
}

