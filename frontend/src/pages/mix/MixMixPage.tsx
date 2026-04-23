import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import ConfirmLeaveModal from '@/components/ConfirmLeaveModal'
import { useRecipes } from '@/hooks/useRecipes'
import { useMixingStore } from '@/store/mixingStore'
import { formatMixInstruction } from '@/utils/mixInstruction'
import { getMixingStepsForSelection, isTwoBathRecipe } from '@/utils/twoBath'
import { useShallow } from 'zustand/react/shallow'

export default function MixMixPage() {
  const navigate = useNavigate()
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const {
    selectedRecipeIds,
    checkedMap,
    toggleChecked,
    twoBathSelections,
    twoBathNLevels,
    targetVolumeMl,
    selectedDilutions,
  } = useMixingStore(useShallow((s) => ({
    selectedRecipeIds: s.selectedRecipeIds,
    checkedMap: s.checkedMap,
    toggleChecked: s.toggleChecked,
    twoBathSelections: s.twoBathSelections,
    twoBathNLevels: s.twoBathNLevels,
    targetVolumeMl: s.targetVolumeMl,
    selectedDilutions: s.selectedDilutions,
  })))
  const { recipes } = useRecipes({})

  const selected = useMemo(() => recipes.filter((recipe) => selectedRecipeIds.includes(recipe.id)), [recipes, selectedRecipeIds])

  // Count total mixing steps
  const totalSteps = useMemo(() => {
    return selected.reduce((sum, recipe) => {
      const selection = twoBathSelections[recipe.id] ?? 'both'
      return sum + getMixingStepsForSelection(recipe, selection).length
    }, 0)
  }, [selected, twoBathSelections])

  const checkedCount = useMemo(() => Object.values(checkedMap).filter(Boolean).length, [checkedMap])
  const allMixed = totalSteps === 0 || checkedCount >= totalSteps

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Mix Chemicals"
        subtitle="Phase 2"
        onBack={() => {
          if (checkedCount >= 1) setShowLeaveModal(true)
          else navigate('/mix/prep')
        }}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <p className="text-sm">
              <span className="font-semibold">Mix all chemicals</span> in order
            </p>
            <p className="text-xs text-sub mt-1">Follow the steps for each recipe and check off as you go</p>
            <p className="text-sm mt-2">
              <span className="font-semibold">{checkedCount}/{totalSteps}</span> mixing steps completed
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
                const selection = twoBathSelections[recipe.id] ?? 'both'
                return getMixingStepsForSelection(recipe, selection).length > 0
              })() ? (
                <div className="mt-3 pt-3 border-t border-base-300 space-y-2">
                  {(() => {
                    const selection = twoBathSelections[recipe.id] ?? 'both'
                    const steps = getMixingStepsForSelection(recipe, selection)
                    return steps.map((step, index) => {
                    const key = `${recipe.id}-mix-${index}`
                    return (
                      <label key={key} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs mt-1"
                          checked={!!checkedMap[key]}
                          onChange={() => toggleChecked(key)}
                        />
                        <span className="text-sm">
                          {formatMixInstruction(
                            step.instruction,
                            recipe,
                            selection,
                            targetVolumeMl,
                            selectedDilutions[recipe.id],
                            twoBathNLevels[recipe.id],
                          )}
                        </span>
                      </label>
                    )
                    })
                  })()}
                </div>
              ) : (
                <p className="text-xs text-sub mt-2">No mixing steps</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-base-300">
        <button 
          className="btn btn-primary w-full" 
          disabled={!allMixed}
          onClick={() => navigate('/mix/done')}
        >
          {totalSteps === 0 ? "Skip to Inventory" : "Continue to Inventory"}
        </button>
      </div>

      <ConfirmLeaveModal
        open={showLeaveModal}
        title="Leave mixing?"
        message="You've checked off some steps. Going back will not clear your progress."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => { setShowLeaveModal(false); navigate('/mix/prep') }}
        onCancel={() => setShowLeaveModal(false)}
      />
    </div>
  )
}
