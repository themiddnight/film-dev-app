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
  // HC-110 is a liquid concentrate — no raw chemicals
  // mixing_steps shows how to dilute from concentrate only
  baths: [
    {
      id: 'hc110-water-stop',
      name: 'Water Stop',
      role: 'stop',
      chemical_format: 'ready_to_use',
      mixing_required: false,
    },
    {
      id: 'hc110-working',
      name: 'HC-110 Working Solution (Dil. B)',
      role: 'developer',
      chemical_format: 'liquid_concentrate',
      mixing_required: true,
      dilution_ratio: '1:31',
      chemicals: [
        {
          name: 'HC-110 Concentrate',
          amount_per_liter: 32, // 32 ml per 1000 ml = 1:31 (1 part concentrate + 31 parts water)
          unit: 'ml',
          order: 1,
          note: 'Measure accurately — HC-110 is highly concentrated, 1–2 ml difference affects development time',
        },
      ],
      mixing_steps: [
        {
          instruction: 'Measure HC-110 Concentrate {hc110_concentrate} ml using a syringe or graduated cylinder',
          warning: 'HC-110 is very viscous like syrup — wait for it to fully flow out, do not rush (post-2019 formula is less viscous)',
        },
        {
          instruction: 'Pour water (at target temperature) {hc110_water} ml into tank first',
        },
        {
          instruction: 'Add HC-110 Concentrate into the water, stir gently until combined — ready to use immediately',
          warning: 'Use immediately — HC-110 working solution does not keep overnight',
        },
      ],
      storage: {
        shelf_life: 'Concentrate: unopened indefinite · opened 6 months (full bottle) or 2 months (half bottle)',
        container: 'Original Kodak bottle (brown plastic), tightly capped',
        notes: 'Concentrate keeps for a very long time as it is oil-based, not water-based — discard working solution immediately after use',
      },
    },
  ],

  // ── Develop Session ────────────────────────────────────────────────────────
  // Times for HC-110 Dilution B (1+31), Kodak Tri-X 400 / Ilford HP5 Plus 400
  // Source: Massive Dev Chart, Kodak J-24
  // ⚠️ Do not dev below 5 min — risk of uneven development
  develop_steps: [
    {
      id: 'hc110-dev',
      name: 'HC-110 Dil.B',
      type: 'developer',
      bath_ref: 'hc110-working',
      duration_seconds: 390, // 6:30 @ 20°C N — safe minimum ≥ 5:00
      duration_override_key: 'hc110.dev.duration',
      agitation: {
        initial_seconds: 30,
        interval_seconds: 30, // HC-110 needs more frequent agitation than D-76
        duration_seconds: 5,
      },
      warnings: [
        'Do not develop for less than 5:00 min — risk of uneven development',
        'HC-110 is very active at high temperatures — time precisely',
      ],
      transition_warning: 'Discard HC-110 — one-shot, do not reuse. Pour Stop Bath immediately',
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
      bath_ref: 'hc110-water-stop',
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
      warnings: ['Measure clearing time then multiply by 2'],
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
      name: 'Hang to Dry',
      type: 'dry',
      duration_seconds: 'variable',
      warnings: ['Hang to dry in a dust-free area for 1–2 hours'],
    },
  ],
}
