import type { Chemical, MixingStep, PushPull, Recipe } from '../types/recipe'
import type { TwoBathMixSelection } from '../store/mixingStore'

export function isTwoBathRecipe(recipe: Recipe): boolean {
  return !!recipe.constraints?.is_two_bath
}

function normalize(str: string | undefined): string {
  return (str ?? '').toLowerCase()
}

function includesBathA(text: string): boolean {
  return /bath\s*a/.test(text)
}

function includesBathB(text: string): boolean {
  return /bath\s*b/.test(text)
}

function getBathChemicals(recipe: Recipe, role: 'bath_a' | 'bath_b', nLevel?: PushPull): Chemical[] {
  const baths = recipe.baths ?? []
  if (baths.length === 0) return []

  const target = baths.find((bath) => {
    const id = normalize(bath.id)
    const name = normalize(bath.name)
    if (role === 'bath_a') return includesBathA(id) || includesBathA(name)
    return includesBathB(id) || includesBathB(name)
  })

  if (!target) return []

  if (role === 'bath_b' && nLevel && target.n_variations?.[nLevel]?.chemicals) {
    return target.n_variations[nLevel].chemicals!
  }

  return target?.chemicals ?? []
}

export function getChemicalsForSelection(recipe: Recipe, selection: TwoBathMixSelection, bathBNLevel?: PushPull): Chemical[] {
  if (!isTwoBathRecipe(recipe)) return recipe.chemicals ?? []

  if (selection === 'bath_a') return getBathChemicals(recipe, 'bath_a')
  if (selection === 'bath_b') return getBathChemicals(recipe, 'bath_b', bathBNLevel)

  const bathA = getBathChemicals(recipe, 'bath_a')
  const bathB = getBathChemicals(recipe, 'bath_b', bathBNLevel)

  if (bathA.length > 0 || bathB.length > 0) {
    return [...bathA, ...bathB]
  }

  return recipe.chemicals ?? []
}

export function getMixingStepsForSelection(recipe: Recipe, selection: TwoBathMixSelection): MixingStep[] {
  const steps = recipe.mixing_steps ?? []
  if (!isTwoBathRecipe(recipe) || selection === 'both') return steps

  const filtered = steps.filter((step) => {
    const text = normalize(step.instruction)
    return selection === 'bath_a' ? includesBathA(text) : includesBathB(text)
  })

  // Fallback to full steps if recipe does not label steps by bath clearly.
  return filtered.length > 0 ? filtered : steps
}

/** Returns available N level keys from Bath B's n_variations, or [] if none defined. */
export function getBathBNOptions(recipe: Recipe): PushPull[] {
  const baths = recipe.baths ?? []
  const bathB = baths.find((bath) => {
    const id = normalize(bath.id)
    const name = normalize(bath.name)
    return includesBathB(id) || includesBathB(name)
  })
  if (!bathB?.n_variations) return []
  return Object.keys(bathB.n_variations) as PushPull[]
}
