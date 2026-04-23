// store/uiStateStore.ts
// Persists page-level UI state (tabs, filters, search queries) across navigation.
// Uses in-memory Zustand (no persistence) — state survives route changes but resets on app reload.
import { create } from 'zustand'
import type { RecipeStepType } from '@/types/recipe'

type RecipesPageState = {
  tab: 'system' | 'personal'
  stepType: 'all' | RecipeStepType
  query: string
}

type MixSelectPageState = {
  stepType: 'all' | RecipeStepType
  query: string
}

type UiStateStore = {
  recipesPage: RecipesPageState
  mixSelectPage: MixSelectPageState

  setRecipesPage: (patch: Partial<RecipesPageState>) => void
  setMixSelectPage: (patch: Partial<MixSelectPageState>) => void
}

export const useUiStateStore = create<UiStateStore>()((set) => ({
  recipesPage: {
    tab: 'system',
    stepType: 'all',
    query: '',
  },
  mixSelectPage: {
    stepType: 'all',
    query: '',
  },

  setRecipesPage: (patch) =>
    set((s) => ({ recipesPage: { ...s.recipesPage, ...patch } })),

  setMixSelectPage: (patch) =>
    set((s) => ({ mixSelectPage: { ...s.mixSelectPage, ...patch } })),
}))
