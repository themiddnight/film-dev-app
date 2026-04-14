import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type MixingMode = 'prep' | 'step-by-step'

type MixingStore = {
  selectedRecipeIds: string[]
  targetVolumeMl: number
  selectedDilutions: Record<string, { concentrate_parts: number; water_parts: number; label?: string }>
  mode: MixingMode
  currentRecipeIndex: number
  checkedMap: Record<string, boolean>

  setSelectedRecipeIds: (ids: string[]) => void
  setMode: (mode: MixingMode) => void
  setTargetVolume: (ml: number) => void
  setDilution: (recipeId: string, dilution: { concentrate_parts: number; water_parts: number; label?: string }) => void
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
      mode: 'prep',
      currentRecipeIndex: 0,
      checkedMap: {},

      setSelectedRecipeIds: (ids) => set({ selectedRecipeIds: ids }),
      setMode: (mode) => set({ mode }),
      setTargetVolume: (ml) => set({ targetVolumeMl: ml }),
      setDilution: (recipeId, dilution) =>
        set((prev) => ({
          selectedDilutions: {
            ...prev.selectedDilutions,
            [recipeId]: dilution,
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
