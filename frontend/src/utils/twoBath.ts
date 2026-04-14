import type { Chemical, MixingStep, PushPull, Recipe } from '../types/recipe'
import type { TwoBathMixSelection } from '../store/mixingStore'

type TwoBathRole = 'bath_a' | 'bath_b'

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

function getBathRefOrder(recipe: Recipe): string[] {
  const steps = (recipe.develop_steps ?? []).filter(
    (step) =>
      (step.type === 'developer' || step.type === 'activator') &&
      typeof step.bath_ref === 'string' &&
      step.bath_ref.length > 0,
  )

  const refs: string[] = []
  for (const step of steps) {
    const ref = step.bath_ref!
    if (!refs.includes(ref)) refs.push(ref)
  }
  return refs
}

function findBath(recipe: Recipe, role: TwoBathRole) {
  const baths = recipe.baths ?? []
  if (baths.length === 0) return null

  const explicit = baths.find((bath) => bath.developer_bath_role === role)
  if (explicit) return explicit

  const refOrder = getBathRefOrder(recipe)
  const ref = role === 'bath_a' ? refOrder[0] : refOrder[1]
  if (ref) {
    const byRef = baths.find((bath) => bath.id === ref)
    if (byRef) return byRef
  }

  return baths.find((bath) => {
    const id = normalize(bath.id)
    const name = normalize(bath.name)
    if (role === 'bath_a') return includesBathA(id) || includesBathA(name)
    return includesBathB(id) || includesBathB(name)
  }) ?? null
}

function getBathChemicals(recipe: Recipe, role: TwoBathRole, nLevel?: PushPull): Chemical[] {
  const target = findBath(recipe, role)

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
  const bathB = findBath(recipe, 'bath_b')
  if (!bathB?.n_variations) return []
  return Object.keys(bathB.n_variations) as PushPull[]
}
