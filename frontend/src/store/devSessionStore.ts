import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DevSession, SessionSource } from '../types/session'
import type { DevType } from '../types/settings'

type DevSource =
  | { type: 'kit'; kitId: string }
  | { type: 'recipe'; recipeId: string }

type DevSessionStore = {
  source: DevSource | null
  film_format: DevSession['film_format']
  rolls_count: number
  temperature_celsius: number
  dev_type: DevType
  agitation_method: DevSession['agitation_method']

  target_duration_seconds: number
  started_at: string | null
  completed_at: string | null
  inventory_updates: DevSession['inventory_updates']

  setSource: (source: DevSource) => void
  clearSource: () => void
  setConfig: (config: Partial<Pick<DevSessionStore, 'film_format' | 'rolls_count' | 'temperature_celsius' | 'dev_type' | 'agitation_method'>>) => void
  startTimerSession: (targetSeconds: number) => void
  completeTimerSession: (updates: DevSession['inventory_updates']) => void
  resetRuntime: () => void
  toSessionSource: (kitName?: string) => SessionSource | null
}

export const useDevSessionStore = create<DevSessionStore>()(
  persist(
    (set, get) => ({
      source: null,
      film_format: '35mm',
      rolls_count: 1,
      temperature_celsius: 20,
      dev_type: 'N',
      agitation_method: 'inversion',
      target_duration_seconds: 0,
      started_at: null,
      completed_at: null,
      inventory_updates: [],

      setSource: (source) => set({ source }),
      clearSource: () => set({ source: null }),

      setConfig: (config) => set((prev) => ({ ...prev, ...config })),

      startTimerSession: (targetSeconds) =>
        set({
          target_duration_seconds: targetSeconds,
          started_at: new Date().toISOString(),
          completed_at: null,
          inventory_updates: [],
        }),

      completeTimerSession: (updates) =>
        set({
          completed_at: new Date().toISOString(),
          inventory_updates: updates,
        }),

      resetRuntime: () =>
        set({
          target_duration_seconds: 0,
          started_at: null,
          completed_at: null,
          inventory_updates: [],
        }),

      toSessionSource: (kitName) => {
        const source = get().source
        if (!source) return null
        if (source.type === 'kit') {
          return {
            type: 'kit',
            kit_id: source.kitId,
            kit_name_snapshot: kitName ?? 'Kit',
          }
        }
        return {
          type: 'recipes',
          recipe_ids: [source.recipeId],
        }
      },
    }),
    {
      name: 'dev-session',
      partialize: (s) => ({
        source: s.source,
        film_format: s.film_format,
        rolls_count: s.rolls_count,
        temperature_celsius: s.temperature_celsius,
        dev_type: s.dev_type,
        agitation_method: s.agitation_method,
      }),
    },
  ),
)
