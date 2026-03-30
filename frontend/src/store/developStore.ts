// store/developStore.ts
// State สำหรับ Develop Session (Flow 2)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Recipe, DevelopStep } from '../types/recipe'
import type { DevType } from '../types/settings'

type TimerState = 'idle' | 'running' | 'paused' | 'complete'

type DevelopStore = {
  // Session config
  recipe: Recipe | null
  devType: DevType
  tempCelsius: number
  stepOverrides: Record<string, number>  // stepId → seconds (persisted per recipeId)

  // Runtime state (not persisted)
  currentStepIndex: number
  timerState: TimerState
  remainingSeconds: number
  agitationCount: number

  // Actions
  setRecipe: (r: Recipe) => void
  setDevType: (t: DevType) => void
  setTemp: (t: number) => void
  setStepOverride: (stepId: string, seconds: number) => void
  removeStepOverride: (stepId: string) => void
  clearStepOverrides: () => void
  hasStepOverrides: () => boolean

  startSession: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  tickTimer: () => void       // called by interval every second
  completeStep: () => void
  exitSession: () => void

  // Helper: effective duration for a step (override → temp_table → default)
  effectiveDuration: (step: DevelopStep) => number
}

// Pure helper — all dependencies explicit so React Compiler can track them correctly.
export function computeEffectiveDuration(
  step: DevelopStep,
  devType: DevType,
  tempCelsius: number,
  stepOverrides: Record<string, number>,
): number {
  if (stepOverrides[step.id] !== undefined) return stepOverrides[step.id]
  if (step.temp_table) {
    const temps = Object.keys(step.temp_table).map(Number).sort((a, b) => a - b)
    let closest = temps[0]
    for (const t of temps) {
      if (Math.abs(t - tempCelsius) < Math.abs(closest - tempCelsius)) closest = t
    }
    return step.temp_table[closest][devType]
  }
  if (step.duration_seconds === 'variable') return 0
  return step.duration_seconds as number
}

export const useDevelopStore = create<DevelopStore>()(
  persist(
    (set, get) => ({
      recipe: null,
      devType: 'N',
      tempCelsius: 26,
      stepOverrides: {},
      currentStepIndex: 0,
      timerState: 'idle',
      remainingSeconds: 0,
      agitationCount: 0,

      setRecipe: (recipe) => {
        // Clamp stored temp to the nearest valid temp_table key for the new recipe
        const { tempCelsius } = get()
        const temps: number[] = []
        for (const step of recipe.develop_steps) {
          if (step.temp_table) {
            temps.push(...Object.keys(step.temp_table).map(Number))
            break
          }
        }
        if (temps.length > 0 && !temps.includes(tempCelsius)) {
          const clamped = temps.reduce((a, b) =>
            Math.abs(b - tempCelsius) < Math.abs(a - tempCelsius) ? b : a
          )
          set({ recipe, tempCelsius: clamped })
        } else {
          set({ recipe })
        }
      },
      setDevType: (devType) => set({ devType }),
      setTemp: (tempCelsius) => set({ tempCelsius }),

      setStepOverride: (stepId, seconds) =>
        set((s) => ({ stepOverrides: { ...s.stepOverrides, [stepId]: seconds } })),

      removeStepOverride: (stepId) =>
        set((s) => {
          const next = { ...s.stepOverrides }
          delete next[stepId]
          return { stepOverrides: next }
        }),

      clearStepOverrides: () => set({ stepOverrides: {} }),

      hasStepOverrides: () => Object.keys(get().stepOverrides).length > 0,

      effectiveDuration: (step) => {
        const { stepOverrides, tempCelsius, devType } = get()
        return computeEffectiveDuration(step, devType, tempCelsius, stepOverrides)
      },

      startSession: () => {
        const { recipe, effectiveDuration } = get()
        if (!recipe) return
        const firstStep = recipe.develop_steps[0]
        set({
          currentStepIndex: 0,
          timerState: 'running',
          remainingSeconds: effectiveDuration(firstStep),
          agitationCount: 0,
        })
      },

      pauseTimer: () => set({ timerState: 'paused' }),
      resumeTimer: () => set({ timerState: 'running' }),

      tickTimer: () => {
        const { remainingSeconds, timerState } = get()
        if (timerState !== 'running') return
        if (remainingSeconds <= 0) {
          set({ timerState: 'complete' })
          return
        }
        set({ remainingSeconds: remainingSeconds - 1 })
      },

      completeStep: () => {
        const { recipe, currentStepIndex, effectiveDuration } = get()
        if (!recipe) return
        const nextIndex = currentStepIndex + 1
        if (nextIndex >= recipe.develop_steps.length) {
          set({ timerState: 'idle', currentStepIndex: 0 })
          return
        }
        const nextStep = recipe.develop_steps[nextIndex]
        set({
          currentStepIndex: nextIndex,
          timerState: 'running',
          remainingSeconds: effectiveDuration(nextStep),
          agitationCount: 0,
        })
      },

      exitSession: () =>
        set({
          timerState: 'idle',
          currentStepIndex: 0,
          remainingSeconds: 0,
          agitationCount: 0,
        }),
    }),
    {
      name: 'develop-session',
      partialize: (s) => ({
        stepOverrides: s.stepOverrides,
        devType: s.devType,
        tempCelsius: s.tempCelsius,
      }),
    }
  )
)
