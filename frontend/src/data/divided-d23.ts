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
          note: 'Always add before Metol — helps dissolve Metol and prevents oxidation',
        },
        {
          name: 'Metol',
          amount_per_liter: 7.5,
          unit: 'g',
          order: 2,
          note: 'Always add after Sodium Sulphite — do not reverse the order',
        },
      ],
      mixing_steps: [
        {
          instruction: 'Pour {volume_75pct} ml of distilled water into container (room temperature ~25°C)',
        },
        {
          instruction: 'Add Sodium Sulphite {sodium_sulphite} g, stir until fully dissolved',
          warning: 'Always add Sodium Sulphite before Metol',
          chemicals: [{ name: 'Sodium Sulphite', amount_per_liter: 100, unit: 'g', order: 1 }],
        },
        {
          instruction: 'Add Metol {metol} g, stir until fully dissolved',
          chemicals: [{ name: 'Metol', amount_per_liter: 7.5, unit: 'g', order: 2 }],
        },
        {
          instruction: 'Top up with distilled water to {target_volume} ml',
        },
      ],
      storage: {
        shelf_life: '6–12 months',
        container: 'amber bottle, sealed, keep cool',
        notes: 'Store in amber bottle, tightly sealed, away from light and heat',
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
          instruction: 'Pour {volume_50pct} ml of warm water ~50°C into container (helps dissolve Borax)',
        },
        {
          instruction: 'Add Borax {borax} g, stir until fully dissolved',
          chemicals: [{ name: 'Borax', amount_per_liter: 10, unit: 'g', order: 1 }],
        },
        {
          instruction: 'Top up with distilled water (room temperature) to {target_volume} ml',
        },
      ],
      storage: {
        shelf_life: '12+ months',
        container: 'any bottle, sealed',
        notes: 'Very stable, long shelf life',
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
          note: 'Use 20–25 g/L depending on availability',
        },
      ],
      mixing_steps: [
        {
          instruction: 'Pour {target_volume} ml of water into container',
        },
        {
          instruction: 'Add Potassium Metabisulphite {potassium_metabisulphite} g, stir until dissolved',
          chemicals: [{ name: 'Potassium Metabisulphite', amount_per_liter: 22.5, unit: 'g', order: 1 }],
        },
      ],
      storage: {
        shelf_life: '6 months',
        container: 'sealed bottle',
      },
    },
    {
      id: 'water-stop',
      name: 'Water Stop',
      role: 'stop',
      chemical_format: 'ready_to_use',
      mixing_required: false,
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
          note: 'Add after Sodium Thiosulphate',
        },
      ],
      mixing_steps: [
        {
          instruction: 'Pour {volume_75pct} ml of warm water ~40°C into container',
        },
        {
          instruction: 'Add Sodium Thiosulphate {sodium_thiosulphate} g, stir until fully dissolved',
          chemicals: [{ name: 'Sodium Thiosulphate (Hypo)', amount_per_liter: 250, unit: 'g', order: 1 }],
        },
        {
          instruction: 'Add Sodium Sulphite {sodium_sulphite_fixer} g, stir until dissolved',
          chemicals: [{ name: 'Sodium Sulphite', amount_per_liter: 15, unit: 'g', order: 2 }],
        },
        {
          instruction: 'Top up with water to {target_volume} ml, let cool before use',
        },
      ],
      storage: {
        shelf_life: '3–6 months',
        container: 'sealed bottle',
        notes: 'Discard when solution turns dark yellow or fixing slows noticeably',
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
      warnings: ['Do not pre-wet film — pour developer directly'],
      transition_warning: 'Pour Bath A back into bottle immediately — do not rinse before pouring Bath B',
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
      duration_seconds: 300,  // 5:00 — always fixed, independent of temperature
      agitation: {
        initial_seconds: 30,
        interval_seconds: 60,
        duration_seconds: 5,
      },
      warnings: ['Bath B time is fixed at 5 min — independent of temperature or N/N+1'],
      transition_warning: 'Pour Bath B back into bottle — rinse briefly for 30 seconds before Stop Bath',
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
      duration_seconds: 480,  // 8:00 default — user can override
      duration_override_key: 'divided-d23.fixer.duration',
      agitation: {
        initial_seconds: 30,
        interval_seconds: 60,
        duration_seconds: 5,
      },
      warnings: ['Measure actual clearing time and multiply by 2 for safety'],
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
      name: 'Hang to Dry',
      type: 'dry',
      duration_seconds: 'variable',
      warnings: ['Hang to dry in a dust-free area for 1–2 hours before cutting film'],
    },
  ],
}

