import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import ConfirmLeaveModal from '@/components/ConfirmLeaveModal'
import { useRecipes } from '@/hooks/useRecipes'
import { useMixingStore } from '@/store/mixingStore'
import { getDilutionVolumes, scaleToTarget } from '@/utils/mixInstruction'
import { getChemicalsForSelection, isTwoBathRecipe } from '@/utils/twoBath'
import type { Recipe, DilutionOption } from '@/types/recipe'
import { useShallow } from 'zustand/react/shallow'

export default function MixPrepPage() {
  const navigate = useNavigate()
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const { selectedRecipeIds, checkedMap, toggleChecked, twoBathSelections, twoBathNLevels, targetVolumeMl, selectedDilutions } = useMixingStore(
    useShallow((s) => ({
      selectedRecipeIds: s.selectedRecipeIds,
      checkedMap: s.checkedMap,
      toggleChecked: s.toggleChecked,
      twoBathSelections: s.twoBathSelections,
      twoBathNLevels: s.twoBathNLevels,
      targetVolumeMl: s.targetVolumeMl,
      selectedDilutions: s.selectedDilutions,
    }))
  )
  const { recipes } = useRecipes({})

  const selected = useMemo(() => recipes.filter((recipe) => selectedRecipeIds.includes(recipe.id)), [recipes, selectedRecipeIds])

  const getPrepChemicals = useMemo(() => {
    return (recipe: Recipe) => {
      const selection = twoBathSelections[recipe.id] ?? 'both'
      const baseChemicals = getChemicalsForSelection(recipe, selection, twoBathNLevels[recipe.id])
      
      if (baseChemicals.length === 0 && recipe.chemical_format === 'liquid_concentrate' && recipe.dilution) {
        let dilutionOption: DilutionOption | undefined = selectedDilutions[recipe.id]
        if (!dilutionOption) {
          if (recipe.dilution.type === 'fixed') {
            dilutionOption = { concentrate_parts: recipe.dilution.concentrate_parts, water_parts: recipe.dilution.water_parts }
          } else if (recipe.dilution.type === 'preset') {
            dilutionOption = recipe.dilution.options[0]
          } else if (recipe.dilution.type === 'open') {
            dilutionOption = recipe.dilution.suggested_ratios[0]
          }
        }
        
        const volumes = getDilutionVolumes(targetVolumeMl, dilutionOption)
        if (volumes && volumes.concentrateMl > 0) {
          return [{ name: `${recipe.name} Concentrate`, amountText: `${volumes.concentrateMl} ml` }]
        }
      }

      return baseChemicals.map(c => {
        const scaled = scaleToTarget(c.amount_per_liter, targetVolumeMl)
        return { 
          name: c.name, 
          amountText: `${scaled} ${c.unit} (from ${c.amount_per_liter} ${c.unit}/L @ ${targetVolumeMl} ml)` 
        }
      })
    }
  }, [twoBathSelections, twoBathNLevels, selectedDilutions, targetVolumeMl])

  // Count total chemicals to prepare
  const totalChemicals = useMemo(() => {
    return selected.reduce((sum, recipe) => {
      return sum + getPrepChemicals(recipe).length
    }, 0)
  }, [selected, getPrepChemicals])

  const checkedCount = useMemo(() => Object.values(checkedMap).filter(Boolean).length, [checkedMap])
  const chemicalsPrepared = totalChemicals === 0 || checkedCount >= totalChemicals

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Prepare Ingredients"
        subtitle="Phase 1"
        onBack={() => {
          if (checkedCount >= 1) setShowLeaveModal(true)
          else navigate('/mix/summary')
        }}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <p className="text-sm">
              <span className="font-semibold">Prepare all chemicals</span> from every recipe
            </p>
            <p className="text-xs text-sub mt-1">Check off each ingredient as you measure and prepare it</p>
            <p className="text-xs text-sub mt-1">Target volume: {targetVolumeMl} ml</p>
            <p className="text-sm mt-2">
              <span className="font-semibold">{checkedCount}/{totalChemicals}</span> ingredients prepared
            </p>
          </div>
        </div>

        {selected.map((recipe) => (
          <div key={recipe.id} className="card bg-base-200">
            <div className="card-body p-4">
              <p className="font-semibold text-sm">{recipe.name}</p>
              <p className="text-xs text-sub capitalize">{recipe.step_type ?? '-'}</p>
              {isTwoBathRecipe(recipe) && (
                <p className="text-xs text-sub">Mix target: {(twoBathSelections[recipe.id] ?? 'both').replace('_', ' ').toUpperCase()}</p>
              )}

              {(() => {
                const chemicals = getPrepChemicals(recipe)
                return chemicals.length > 0
              })() ? (
                <div className="mt-3 pt-3 border-t border-base-300 space-y-2">
                  {(() => {
                    const chemicals = getPrepChemicals(recipe)
                    return chemicals.map((chem, index) => {
                    const key = `${recipe.id}-chem-${chem.name.replace(/\s+/g, '-')}-${index}`
                    return (
                      <label key={key} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs mt-1"
                          checked={!!checkedMap[key]}
                          onChange={() => toggleChecked(key)}
                        />
                        <span className="text-sm">
                          {chem.name}: {chem.amountText}
                        </span>
                      </label>
                    )
                    })
                  })()}
                </div>
              ) : (
                <p className="text-xs text-sub mt-2">No chemicals to prepare</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-base-300">
        <button 
          className="btn btn-primary w-full" 
          disabled={!chemicalsPrepared}
          onClick={() => navigate('/mix/mix')}
        >
          {totalChemicals === 0 ? "Skip to Mix" : "Continue to Mix"}
        </button>
      </div>

      <ConfirmLeaveModal
        open={showLeaveModal}
        title="Leave preparation?"
        message="You've checked off some ingredients. Going back will not clear your progress."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => { setShowLeaveModal(false); navigate('/mix/summary') }}
        onCancel={() => setShowLeaveModal(false)}
      />
    </div>
  )
}
