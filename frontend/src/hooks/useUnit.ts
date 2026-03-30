// hooks/useUnit.ts — unit conversion for display
import { useSettingsStore } from '../store/settingsStore'

const G_TO_OZ = 0.035274
const ML_TO_FLOZ = 0.033814

export function useUnit() {
  const unit = useSettingsStore((s) => s.unit)

  function formatWeight(grams: number): string {
    if (unit === 'imperial') {
      const oz = grams * G_TO_OZ
      return oz < 0.1 ? `${(oz * 28.3495).toFixed(1)} g` : `${oz.toFixed(2)} oz`
    }
    return grams >= 1 ? `${grams} g` : `${(grams * 1000).toFixed(0)} mg`
  }

  function formatVolume(ml: number): string {
    if (unit === 'imperial') {
      const floz = ml * ML_TO_FLOZ
      return `${floz.toFixed(1)} fl oz`
    }
    return `${ml} ml`
  }

  function formatAmount(amount: number, unitType: 'g' | 'ml'): string {
    return unitType === 'g' ? formatWeight(amount) : formatVolume(amount)
  }

  return { formatWeight, formatVolume, formatAmount, unit }
}
