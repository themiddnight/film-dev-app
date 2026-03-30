// types/settings.ts

export type Theme = 'dark' | 'light'
export type Unit = 'metric' | 'imperial'
export type MixingMode = 'prep' | 'step-by-step'
export type DevType = 'N-1' | 'N' | 'N+1'

export type Settings = {
  // Agitation reminders
  sound: boolean
  vibrate: boolean
  screenFlash: boolean
  // Appearance
  theme: Theme
  // Units
  unit: Unit
  // Mixing default
  mixingMode: MixingMode
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  vibrate: true,
  screenFlash: false,
  theme: 'dark',
  unit: 'metric',
  mixingMode: 'prep',
}
