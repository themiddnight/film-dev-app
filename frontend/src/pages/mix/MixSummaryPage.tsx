import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useRecipes } from '../../hooks/useRecipes'
import { useMixingStore } from '../../store/mixingStore'

export default function MixSummaryPage() {
  const navigate = useNavigate()
  const {
    selectedRecipeIds,
    mode,
    setMode,
    targetVolumeMl,
    setTargetVolume,
    selectedDilutions,
    setDilution,
    resetProgress,
  } = useMixingStore()
  const { recipes } = useRecipes({})

  const selected = useMemo(() => recipes.filter((recipe) => selectedRecipeIds.includes(recipe.id)), [recipes, selectedRecipeIds])

  const ingredientCount = useMemo(() => {
    return selected.reduce((sum, recipe) => sum + (recipe.chemicals?.length ?? 0), 0)
  }, [selected])

  function start() {
    resetProgress()
    navigate(mode === 'prep' ? '/mix/prep' : '/mix/shopping')
  }

  function dilutionOptionsFor(recipeId: string) {
    const recipe = selected.find((r) => r.id === recipeId)
    if (!recipe?.dilution) return []
    if (recipe.dilution.type === 'fixed') return [recipe.dilution]
    if (recipe.dilution.type === 'preset') return recipe.dilution.options
    return recipe.dilution.suggested_ratios
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Mix Summary" onBack={() => navigate('/mix')} />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <div className="card bg-base-200">
          <div className="card-body p-4 text-sm">
            <p><span className="font-semibold">Selected recipes:</span> {selected.length}</p>
            <p><span className="font-semibold">Ingredients total:</span> {ingredientCount}</p>
          </div>
        </div>

        <div className="space-y-2">
          {selected.map((recipe) => (
            <div key={recipe.id} className="p-3 rounded-lg bg-base-200">
              <p className="font-semibold text-sm">{recipe.name}</p>
              <p className="text-xs text-sub capitalize">{recipe.step_type ?? '-'}</p>

              {recipe.dilution && (
                <div className="mt-2">
                  <p className="text-xs text-sub mb-1">Dilution</p>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={`${selectedDilutions[recipe.id]?.concentrate_parts ?? dilutionOptionsFor(recipe.id)[0]?.concentrate_parts ?? ''}:${selectedDilutions[recipe.id]?.water_parts ?? dilutionOptionsFor(recipe.id)[0]?.water_parts ?? ''}`}
                    onChange={(e) => {
                      const [concentrate, water] = e.target.value.split(':').map(Number)
                      const option = dilutionOptionsFor(recipe.id).find(
                        (d) => d.concentrate_parts === concentrate && d.water_parts === water,
                      )
                      setDilution(recipe.id, {
                        concentrate_parts: concentrate,
                        water_parts: water,
                        label: option?.label,
                      })
                    }}
                  >
                    {dilutionOptionsFor(recipe.id).map((option) => (
                      <option
                        key={`${option.concentrate_parts}-${option.water_parts}-${option.label ?? ''}`}
                        value={`${option.concentrate_parts}:${option.water_parts}`}
                      >
                        {option.label ?? `${option.concentrate_parts}+${option.water_parts}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-sub uppercase">Target Volume (ml)</label>
          <input
            className="input input-bordered w-full"
            type="number"
            min={100}
            max={5000}
            value={targetVolumeMl}
            onChange={(e) => setTargetVolume(Math.max(100, Number(e.target.value) || 1000))}
          />
        </div>

        <div className="space-y-2">
          <div className="join w-full">
            <button className={`join-item btn flex-1 ${mode === 'prep' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('prep')}>
              Prep Mode
            </button>
            <button className={`join-item btn flex-1 ${mode === 'step-by-step' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('step-by-step')}>
              Step-by-Step
            </button>
          </div>
          
          <p className="text-xs text-sub px-1">
            {mode === 'prep' 
              ? 'Prepare all chemicals first, then mix them one by one'
              : 'Prepare and mix one step at a time, repeat for each step'}
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-base-300">
        <button className="btn btn-primary w-full" disabled={selected.length === 0} onClick={start}>
          Start {mode === 'prep' ? 'Prep' : 'Step-by-Step'}
        </button>
      </div>
    </div>
  )
}
