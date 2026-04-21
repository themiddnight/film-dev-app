import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, Search } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { useRecipes } from '../../hooks/useRecipes'
import { useMixingStore } from '../../store/mixingStore'
import type { Recipe, RecipeStepType } from '../../types/recipe'

const TYPES: Array<'all' | RecipeStepType> = ['all', 'developer', 'stop', 'fixer', 'wash_aid', 'wetting_agent']

/**
 * Score a recipe against multiple search terms.
 * Returns the count of terms that appear in the recipe's searchable fields.
 */
function scoreRecipe(recipe: Recipe, searchTerms: string[]): number {
  if (searchTerms.length === 0) return 0

  const searchText = [
    recipe.name,
    recipe.description,
    recipe.chemical_format,
    ...(recipe.tags ?? []),
    ...(recipe.film_types ?? []),
    ...(recipe.film_compatibility?.films ?? []),
  ]
    .map((v) => (v ?? '').toLowerCase())
    .join(' ')

  return searchTerms.filter((term) => searchText.includes(term.toLowerCase())).length
}

export default function MixSelectPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [stepType, setStepType] = useState<'all' | RecipeStepType>('all')
  const { selectedRecipeIds, setSelectedRecipeIds, resetProgress } = useMixingStore()

  const filter = useMemo(
    () => ({
      step_type: stepType === 'all' ? undefined : stepType,
    }),
    [stepType],
  )

  const { recipes: allRecipes, loading } = useRecipes(filter)

  // Parse search query into terms and score/sort recipes
  const searchTerms = useMemo(() => query.trim().split(/\s+/).filter(Boolean), [query])

  const recipes = useMemo(() => {
    if (searchTerms.length === 0) return allRecipes

    return allRecipes
      .map((recipe) => ({ recipe, score: scoreRecipe(recipe, searchTerms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ recipe }) => recipe)
  }, [allRecipes, searchTerms])

  function toggleRecipe(id: string) {
    if (selectedRecipeIds.includes(id)) {
      setSelectedRecipeIds(selectedRecipeIds.filter((rid) => rid !== id))
      return
    }
    setSelectedRecipeIds([...selectedRecipeIds, id])
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Mix" subtitle="Multi-select recipes" onBack={() => navigate('/home')} left={<FlaskConical size={18} className="text-sub" />} />

      <div className="p-4 border-b border-base-300 space-y-3">
        <label className="input input-bordered flex items-center gap-2 w-full">
          <Search size={14} className="opacity-60" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="grow" placeholder="Search recipes (name, film, tags, attributes...)" />
        </label>

        <div className="flex gap-2 overflow-x-auto">
          {TYPES.map((type) => (
            <button
              key={type}
              className={`btn btn-xs ${stepType === type ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStepType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
        {loading && <p className="text-sm text-sub">Loading...</p>}
        {recipes.map((recipe) => {
          const checked = selectedRecipeIds.includes(recipe.id)
          return (
            <label key={recipe.id} className="flex items-start gap-3 p-3 rounded-lg bg-base-200">
              <input type="checkbox" className="checkbox checkbox-sm mt-0.5" checked={checked} onChange={() => toggleRecipe(recipe.id)} />
              <span>
                <span className="block font-semibold text-sm">{recipe.name}</span>
                <span className="text-xs text-sub capitalize">{recipe.step_type ?? '-'} · {recipe.chemical_format ?? '-'}</span>
              </span>
            </label>
          )
        })}
      </div>

      <div className="p-3 border-t border-base-300">
        <button
          className="btn btn-primary w-full"
          disabled={selectedRecipeIds.length === 0}
          onClick={() => {
            resetProgress()
            navigate('/mix/summary')
          }}
        >
          Continue ({selectedRecipeIds.length})
        </button>
      </div>
    </div>
  )
}
