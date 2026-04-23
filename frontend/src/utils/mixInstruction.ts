import type { DilutionOption, PushPull, Recipe } from '@/types/recipe'
import type { TwoBathMixSelection } from '@/store/mixingStore'
import { getChemicalsForSelection } from './twoBath'

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function scaleToTarget(amountPerLiter: number, targetVolumeMl: number): number {
  return round2((amountPerLiter * targetVolumeMl) / 1000)
}

function findChemicalAmountTokenValue(
  token: string,
  recipe: Recipe,
  selection: TwoBathMixSelection,
  targetVolumeMl: number,
  bathBNLevel?: PushPull,
): string | null {
  const separator = token.includes(':') ? ':' : token.includes('.') ? '.' : null
  if (!separator) return null

  const [prefix, rawChemicalName] = token.split(separator)
  if (prefix !== 'chemical_amount') return null

  const query = rawChemicalName.trim().toLowerCase()
  if (!query) return null

  const chemical = getChemicalsForSelection(recipe, selection, bathBNLevel).find(
    (chem) => chem.name.toLowerCase() === query || chem.name.toLowerCase().includes(query),
  )
  if (!chemical) return null

  return `${scaleToTarget(chemical.amount_per_liter, targetVolumeMl)} ${chemical.unit}`
}

export function getDilutionVolumes(targetVolumeMl: number, dilution?: DilutionOption): { concentrateMl: number; waterMl: number } | null {
  if (!dilution) return null
  const totalParts = dilution.concentrate_parts + dilution.water_parts
  if (totalParts <= 0) return null

  const concentrateMl = Math.round((targetVolumeMl * dilution.concentrate_parts) / totalParts)
  const waterMl = targetVolumeMl - concentrateMl
  return { concentrateMl, waterMl }
}

export function formatMixInstruction(
  instruction: string,
  recipe: Recipe,
  selection: TwoBathMixSelection,
  targetVolumeMl: number,
  dilution?: DilutionOption,
  bathBNLevel?: PushPull,
): string {
  const dilutionVolumes = getDilutionVolumes(targetVolumeMl, dilution)

  return instruction.replace(/\{([^}]+)\}/g, (_, rawToken: string) => {
    const token = rawToken.trim()

    if (token === 'target_volume') {
      return `${targetVolumeMl} ml`
    }

    const volumePctMatch = token.match(/^volume_(\d+(?:\.\d+)?)pct$/)
    if (volumePctMatch) {
      const pct = Number(volumePctMatch[1])
      const value = Math.round((targetVolumeMl * pct) / 100)
      return `${value} ml`
    }

    if (token === 'dilution_concentrate' && dilutionVolumes) {
      return `${dilutionVolumes.concentrateMl} ml`
    }

    if (token === 'dilution_water' && dilutionVolumes) {
      return `${dilutionVolumes.waterMl} ml`
    }

    const chemicalAmount = findChemicalAmountTokenValue(token, recipe, selection, targetVolumeMl, bathBNLevel)
    if (chemicalAmount) return chemicalAmount

    return `{${rawToken}}`
  })
}

export function formatScaledChemicalText(amountPerLiter: number, unit: 'g' | 'ml', targetVolumeMl: number): string {
  const scaled = scaleToTarget(amountPerLiter, targetVolumeMl)
  return `${scaled} ${unit} (from ${amountPerLiter} ${unit}/L @ ${targetVolumeMl} ml)`
}
