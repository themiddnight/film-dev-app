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
      id: 'd76-water-stop',
      name: 'Water Stop',
      role: 'stop',
      chemical_format: 'ready_to_use',
      mixing_required: false,
    },
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
          note: 'Always add first — must be fully dissolved before adding Hydroquinone, otherwise Hydroquinone will not dissolve',
        },
        {
          name: 'Sodium Sulphite (anhydrous)',
          amount_per_liter: 100,
          unit: 'g',
          order: 2,
          note: 'Add after Metol — helps prevent oxidation',
        },
        {
          name: 'Hydroquinone',
          amount_per_liter: 5,
          unit: 'g',
          order: 3,
          note: 'Always add after Sodium Sulphite — do not add before Metol',
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
          instruction: 'Pour warm water ~52°C ({volume_75pct} ml) into container — warm water helps dissolve chemicals',
        },
        {
          instruction: 'Add Metol {metol_d76} g, stir until fully dissolved — may take a moment',
          warning: 'Metol must be fully dissolved before adding Hydroquinone',
          chemicals: [{ name: 'Metol (Elon)', amount_per_liter: 2, unit: 'g', order: 1 }],
        },
        {
          instruction: 'Add Sodium Sulphite {sodium_sulphite} g, stir until fully dissolved',
          chemicals: [{ name: 'Sodium Sulphite (anhydrous)', amount_per_liter: 100, unit: 'g', order: 2 }],
        },
        {
          instruction: 'Add Hydroquinone {hydroquinone} g, stir until fully dissolved',
          chemicals: [{ name: 'Hydroquinone', amount_per_liter: 5, unit: 'g', order: 3 }],
        },
        {
          instruction: 'Add Borax {borax_d76} g, stir until fully dissolved',
          chemicals: [{ name: 'Borax (Sodium Tetraborate)', amount_per_liter: 2, unit: 'g', order: 4 }],
        },
        {
          instruction: 'Top up with cool water (room temperature) to {target_volume} ml, let cool before use',
        },
      ],
      storage: {
        shelf_life: '6 months (stock) · 24 hours (diluted 1:1)',
        container: 'dark glass bottle, filled to top, sealed',
        notes: 'Fill bottle as full as possible to minimize headspace — air causes deterioration. Do not use diluted solution after the same day',
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
      warnings: ['Use dilution 1:1 (1 part stock : 1 part water) — one-shot, discard after use'],
      transition_warning: 'Discard D-76 (one-shot) — do not reuse. Rinse briefly before Stop Bath',
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
      transition_warning: '3 rinse cycles is enough — then pour Stop Bath immediately',
    },
    {
      id: 'd76-stop',
      name: 'Stop Bath',
      type: 'stop',
      bath_ref: 'd76-water-stop',
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
      duration_seconds: 480, // 8:00 default — user should measure clearing time × 2
      duration_override_key: 'd76.fixer.duration',
      agitation: {
        initial_seconds: 30,
        interval_seconds: 60,
        duration_seconds: 5,
      },
      warnings: ['Measure clearing time then multiply by 2 — do not use default without testing'],
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
      name: 'Hang to Dry',
      type: 'dry',
      duration_seconds: 'variable',
      warnings: ['Hang to dry in a dust-free area for 1–2 hours, do not wipe film before it is dry'],
    },
  ],
}
