import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PushPull } from '../types/recipe'

type MixingMode = 'prep' | 'step-by-step'
export type TwoBathMixSelection = 'both' | 'bath_a' | 'bath_b'

type MixingStore = {
  selectedRecipeIds: string[]
  targetVolumeMl: number
  selectedDilutions: Record<string, { concentrate_parts: number; water_parts: number; label?: string }>
  twoBathSelections: Record<string, TwoBathMixSelection>
  twoBathNLevels: Record<string, PushPull>
  mode: MixingMode
  currentRecipeIndex: number
  checkedMap: Record<string, boolean>

  setSelectedRecipeIds: (ids: string[]) => void
  setMode: (mode: MixingMode) => void
  setTargetVolume: (ml: number) => void
  setDilution: (recipeId: string, dilution: { concentrate_parts: number; water_parts: number; label?: string }) => void
  setTwoBathSelection: (recipeId: string, selection: TwoBathMixSelection) => void
  setTwoBathNLevel: (recipeId: string, level: PushPull) => void
  setCurrentRecipeIndex: (index: number) => void
  toggleChecked: (key: string) => void
  resetProgress: () => void
  resetAll: () => void
}

export const useMixingStore = create<MixingStore>()(
  persist(
    (set) => ({
      selectedRecipeIds: [],
      targetVolumeMl: 1000,
      selectedDilutions: {},
      twoBathSelections: {},
      twoBathNLevels: {},
      mode: 'prep',
      currentRecipeIndex: 0,
      checkedMap: {},

      setSelectedRecipeIds: (ids) =>
        set((prev) => {
          const selected = new Set(ids)
          const keepKeys = <T>(map: Record<string, T>): Record<string, T> => {
            const next: Record<string, T> = {}
            Object.keys(map).forEach((key) => {
              if (selected.has(key)) next[key] = map[key]
            })
            return next
          }

          return {
            selectedRecipeIds: ids,
            selectedDilutions: keepKeys(prev.selectedDilutions),
            twoBathSelections: keepKeys(prev.twoBathSelections),
            twoBathNLevels: keepKeys(prev.twoBathNLevels),
            currentRecipeIndex: 0,
            checkedMap: {},
          }
        }),
      setMode: (mode) => set({ mode }),
      setTargetVolume: (ml) => set({ targetVolumeMl: ml }),
      setDilution: (recipeId, dilution) =>
        set((prev) => ({
          selectedDilutions: {
            ...prev.selectedDilutions,
            [recipeId]: dilution,
          },
        })),
      setTwoBathSelection: (recipeId, selection) =>
        set((prev) => ({
          twoBathSelections: {
            ...prev.twoBathSelections,
            [recipeId]: selection,
          },
        })),
      setTwoBathNLevel: (recipeId, level) =>
        set((prev) => ({
          twoBathNLevels: {
            ...prev.twoBathNLevels,
            [recipeId]: level,
          },
        })),
      setCurrentRecipeIndex: (index) => set({ currentRecipeIndex: index }),
      toggleChecked: (key) => set((prev) => ({ checkedMap: { ...prev.checkedMap, [key]: !prev.checkedMap[key] } })),

      resetProgress: () => set({ currentRecipeIndex: 0, checkedMap: {} }),

      resetAll: () =>
        set({
          selectedRecipeIds: [],
          targetVolumeMl: 1000,
          selectedDilutions: {},
          twoBathSelections: {},
          twoBathNLevels: {},
          mode: 'prep',
          currentRecipeIndex: 0,
          checkedMap: {},
        }),
    }),
    {
      name: 'mixing',
    },
  ),
)
