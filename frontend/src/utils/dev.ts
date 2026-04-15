import type { InventoryItem } from '../types/inventory'
import type { Recipe } from '../types/recipe'
import type { DevSession } from '../types/session'
import type { DevType } from '../types/settings'

export function getRecipeTimingSeconds(recipe: Recipe, tempCelsius: number, devType: DevType): number {
  const timing = recipe.develop_timing
  if (!timing) {
    return 0
  }

  if (timing.type === 'fixed') {
    return timing.fixed_seconds ?? 0
  }

  if ((timing.type === 'temp_table' || timing.type === 'combined') && timing.temp_table) {
    const temps = Object.keys(timing.temp_table).map(Number).sort((a, b) => a - b)
    if (temps.length === 0) return 0
    let closest = temps[0]
    for (const t of temps) {
      if (Math.abs(t - tempCelsius) < Math.abs(closest - tempCelsius)) closest = t
    }

    const entry = timing.temp_table[closest]
    return entry[devType] ?? entry.N ?? 0
  }

  if ((timing.type === 'push_pull_table' || timing.type === 'combined') && timing.push_pull_table) {
    return timing.push_pull_table.entries[devType] ?? timing.push_pull_table.entries.N ?? 0
  }

  return 0
}

export function applyAdjustments(
  baseSeconds: number,
  recipe: Recipe,
  agitationMethod: DevSession['agitation_method'],
  reusableDeveloperUseCount?: number,
): { seconds: number; compensationPct?: number } {
  let seconds = baseSeconds
  let compensationPct: number | undefined

  const multipliers = recipe.constraints?.agitation_time_multipliers
  // Two-bath recipes use fixed durations from develop_steps — no multiplier applies
  if (multipliers && !recipe.constraints?.is_two_bath) {
    if (agitationMethod === 'inversion' && multipliers.inversion) seconds = Math.round(seconds * multipliers.inversion)
    if ((agitationMethod === 'rotary' || agitationMethod === 'rotation') && multipliers.rotary) {
      seconds = Math.round(seconds * multipliers.rotary)
    }
    if (agitationMethod === 'stand' && multipliers.stand) seconds = Math.round(seconds * multipliers.stand)
  }

  const reuse = recipe.constraints?.reuse_compensation
  if (reuse?.time_increase_per_roll && reusableDeveloperUseCount !== undefined && reusableDeveloperUseCount > 0) {
    const pct = Math.round(reuse.time_increase_per_roll * reusableDeveloperUseCount * 100)
    compensationPct = pct
    seconds = Math.round(seconds * (1 + pct / 100))
  }

  return { seconds, compensationPct }
}

export function buildInventoryUpdates(
  inventoryItems: InventoryItem[],
  rolls: number,
  compensationPct?: number,
): DevSession['inventory_updates'] {
  return inventoryItems.map((item) => ({
    inventory_item_id: item.id,
    rolls_added: rolls,
    time_compensation_pct: compensationPct,
  }))
}
