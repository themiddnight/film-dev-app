import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useRecipes } from '../../hooks/useRecipes'
import { useMixingStore } from '../../store/mixingStore'

export default function MixStepByStepPage() {
  const navigate = useNavigate()
  const { selectedRecipeIds, currentRecipeIndex, setCurrentRecipeIndex, checkedMap, toggleChecked } = useMixingStore()
  const { recipes } = useRecipes({})

  const selected = useMemo(() => recipes.filter((recipe) => selectedRecipeIds.includes(recipe.id)), [recipes, selectedRecipeIds])
  const current = selected[currentRecipeIndex]

  const completeCurrent = useMemo(() => {
    if (!current) return false
    const steps = current.mixing_steps ?? []
    if (steps.length === 0) return true
    return steps.every((_, index) => checkedMap[`${current.id}-sbs-${index}`])
  }, [current, checkedMap])

  function next() {
    if (!current) return
    if (currentRecipeIndex + 1 >= selected.length) {
      navigate('/mix/done')
      return
    }
    setCurrentRecipeIndex(currentRecipeIndex + 1)
  }

  if (!current) {
    return (
      <div className="flex flex-col h-full">
        <Navbar title="Step-by-Step" onBack={() => navigate('/mix/summary')} />
        <div className="p-4 text-sm text-sub">No recipe selected.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Step-by-Step"
        subtitle={`${currentRecipeIndex + 1}/${selected.length}`}
        onBack={() => navigate('/mix/summary')}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <p className="font-semibold text-sm">{current.name}</p>
            <p className="text-xs text-sub capitalize">{current.step_type ?? '-'}</p>
          </div>
        </div>

        {(current.mixing_steps ?? []).map((step, index) => {
          const key = `${current.id}-sbs-${index}`
          return (
            <label key={key} className="flex items-start gap-2 p-3 rounded-lg bg-base-200">
              <input
                type="checkbox"
                className="checkbox checkbox-xs mt-1"
                checked={!!checkedMap[key]}
                onChange={() => toggleChecked(key)}
              />
              <span className="text-sm">{step.instruction}</span>
            </label>
          )
        })}
      </div>

      <div className="p-4 border-t border-base-300">
        <button className="btn btn-primary w-full" disabled={!completeCurrent} onClick={next}>
          {currentRecipeIndex + 1 >= selected.length ? 'Complete mixing' : 'Next recipe'}
        </button>
      </div>
    </div>
  )
}
