// store/settingsStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SETTINGS } from '../types/settings'
import type { Settings } from '../types/settings'

type SettingsStore = Settings & {
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set((s) => ({ ...s, ...patch })),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    { name: 'settings' }
  )
)
