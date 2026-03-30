// store/mixingStore.ts
// State สำหรับ Mixing Guide (Flow 1)

import { create } from 'zustand'
import type { Recipe, Bath } from '../types/recipe'
import type { MixingMode } from '../types/settings'

type MixingStore = {
  // Config (จาก Selection Screen)
  recipe: Recipe | null
  selectedBathIds: string[]
  targetVolumeMl: number
  mode: MixingMode

  // Progress
  currentBathIndex: number       // index ใน selectedBathIds
  prepChecked: Record<string, boolean>   // bathId-chemicalIndex → checked
  mixChecked: Record<string, boolean>    // bathId-stepIndex → checked
  phase: 'prep' | 'mix'                  // SBS mode phase for current bath

  // Actions
  setRecipe: (r: Recipe) => void
  setSelectedBaths: (ids: string[]) => void
  setTargetVolume: (ml: number) => void
  setMode: (m: MixingMode) => void

  togglePrepItem: (key: string) => void
  toggleMixItem: (key: string) => void
  advanceToMix: () => void           // SBS: PREP done → MIX
  advanceToBath: () => void          // move to next bath
  reset: () => void

  // Computed helpers
  selectedBaths: () => Bath[]
  currentBath: () => Bath | null
  scaledAmount: (amountPerLiter: number) => number  // scale to targetVolumeMl
  prepComplete: () => boolean
  mixComplete: () => boolean
}

export const useMixingStore = create<MixingStore>()((set, get) => ({
  recipe: null,
  selectedBathIds: [],
  targetVolumeMl: 1000,
  mode: 'prep',

  currentBathIndex: 0,
  prepChecked: {},
  mixChecked: {},
  phase: 'prep',

  setRecipe: (recipe) =>
    set({
      recipe,
      selectedBathIds: recipe.baths.map((b) => b.id),
      currentBathIndex: 0,
      prepChecked: {},
      mixChecked: {},
      phase: 'prep',
    }),

  setSelectedBaths: (ids) => set({ selectedBathIds: ids }),
  setTargetVolume: (ml) => set({ targetVolumeMl: ml }),
  setMode: (mode) => set({ mode }),

  togglePrepItem: (key) =>
    set((s) => ({ prepChecked: { ...s.prepChecked, [key]: !s.prepChecked[key] } })),

  toggleMixItem: (key) =>
    set((s) => ({ mixChecked: { ...s.mixChecked, [key]: !s.mixChecked[key] } })),

  advanceToMix: () => set({ phase: 'mix' }),

  advanceToBath: () => {
    const { currentBathIndex, selectedBathIds } = get()
    const next = currentBathIndex + 1
    if (next >= selectedBathIds.length) {
      // Done — caller handles navigation to "Done" screen
      set({ currentBathIndex: next, phase: 'prep' })
    } else {
      set({ currentBathIndex: next, phase: 'prep' })
    }
  },

  reset: () =>
    set({
      recipe: null,
      selectedBathIds: [],
      targetVolumeMl: 1000,
      currentBathIndex: 0,
      prepChecked: {},
      mixChecked: {},
      phase: 'prep',
    }),

  selectedBaths: () => {
    const { recipe, selectedBathIds } = get()
    if (!recipe) return []
    return selectedBathIds
      .map((id) => recipe.baths.find((b) => b.id === id))
      .filter(Boolean) as Bath[]
  },

  currentBath: () => {
    const { currentBathIndex, selectedBathIds, recipe } = get()
    if (!recipe) return null
    const id = selectedBathIds[currentBathIndex]
    return recipe.baths.find((b) => b.id === id) ?? null
  },

  scaledAmount: (amountPerLiter) => {
    const { targetVolumeMl } = get()
    return Math.round((amountPerLiter * targetVolumeMl) / 1000 * 100) / 100
  },

  prepComplete: () => {
    const { recipe, selectedBathIds, mode, currentBathIndex, prepChecked } = get()
    if (!recipe) return false
    const baths = mode === 'prep'
      ? selectedBathIds.map((id) => recipe.baths.find((b) => b.id === id)!).filter(Boolean)
      : [recipe.baths.find((b) => b.id === selectedBathIds[currentBathIndex])!].filter(Boolean)
    return baths.every((bath) =>
      bath.chemicals.every((_, i) => prepChecked[`${bath.id}-${i}`])
    )
  },

  mixComplete: () => {
    const { currentBath, mixChecked } = get()
    const bath = currentBath()
    if (!bath) return false
    return bath.mixing_steps.every((_, i) => mixChecked[`${bath.id}-step-${i}`])
  },
}))
