import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { useRecipes } from '@/hooks/useRecipes'
import { useMixingStore } from '@/store/mixingStore'
import { getChemicalsForSelection, isTwoBathRecipe } from '@/utils/twoBath'
import { useShallow } from 'zustand/react/shallow'

function scaled(amountPerLiter: number, targetMl: number): number {
  return Math.round((amountPerLiter * targetMl) / 1000 * 100) / 100
}

export default function MixShoppingPage() {
  const navigate = useNavigate()
  const { selectedRecipeIds, targetVolumeMl, selectedDilutions, twoBathSelections, twoBathNLevels } = useMixingStore(
    useShallow((s) => ({
      selectedRecipeIds: s.selectedRecipeIds,
      targetVolumeMl: s.targetVolumeMl,
      selectedDilutions: s.selectedDilutions,
      twoBathSelections: s.twoBathSelections,
      twoBathNLevels: s.twoBathNLevels,
    }))
  )
  const { recipes } = useRecipes({})

  const selected = useMemo(() => recipes.filter((recipe) => selectedRecipeIds.includes(recipe.id)), [recipes, selectedRecipeIds])

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Shopping List" onBack={() => navigate('/mix/summary')} />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {selected.map((recipe) => {
          const dilution = selectedDilutions[recipe.id]
          const concentrateMl = dilution
            ? Math.round((targetVolumeMl * dilution.concentrate_parts) / (dilution.concentrate_parts + dilution.water_parts))
            : null
          const waterMl = dilution ? targetVolumeMl - (concentrateMl ?? 0) : null

          return (
            <div key={recipe.id} className="card bg-base-200">
              <div className="card-body p-4">
                <p className="font-semibold text-sm">{recipe.name}</p>
                <p className="text-xs text-sub capitalize">{recipe.step_type ?? '-'}</p>
                {isTwoBathRecipe(recipe) && (
                  <p className="text-xs text-sub mt-1">Mix target: {(twoBathSelections[recipe.id] ?? 'both').replace('_', ' ').toUpperCase()}</p>
                )}

                {dilution && (
                  <p className="text-xs mt-1">
                    Dilution: {dilution.label ?? `${dilution.concentrate_parts}+${dilution.water_parts}`} ·
                    {' '}Concentrate {concentrateMl} ml + Water {waterMl} ml
                  </p>
                )}

                {(() => {
                  const selection = twoBathSelections[recipe.id] ?? 'both'
                  return getChemicalsForSelection(recipe, selection, twoBathNLevels[recipe.id]).length > 0
                })() && (
                  <div className="mt-2 space-y-1">
                    {(() => {
                      const selection = twoBathSelections[recipe.id] ?? 'both'
                      return getChemicalsForSelection(recipe, selection, twoBathNLevels[recipe.id]).map((chem, index) => (
                        <p key={`${recipe.id}-${chem.name}-${index}`} className="text-xs">
                          {chem.name}: {scaled(chem.amount_per_liter, targetVolumeMl)} {chem.unit}
                        </p>
                      ))
                    })()}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-base-300">
        <button className="btn btn-primary w-full" onClick={() => navigate('/mix/steps')}>
          Continue to checklist
        </button>
      </div>
    </div>
  )
}
