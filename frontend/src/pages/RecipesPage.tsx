import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useRecipes } from '../hooks/useRecipes'
import { useRecipeCollections } from '../hooks/useRecipeCollections'
import type { Recipe, RecipeStepType } from '../types/recipe'

const STEP_TYPES: Array<{ value: 'all' | RecipeStepType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'developer', label: 'Developer' },
  { value: 'stop', label: 'Stop' },
  { value: 'fixer', label: 'Fixer' },
  { value: 'wash_aid', label: 'Wash Aid' },
  { value: 'wetting_agent', label: 'Wetting' },
]

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

export default function RecipesPage() {
  const navigate = useNavigate()
  const [source, setSource] = useState<'system' | 'personal'>('system')
  const [stepType, setStepType] = useState<'all' | RecipeStepType>('all')
  const [query, setQuery] = useState('')

  const filter = useMemo(() => {
    return {
      author_type: source,
      step_type: stepType === 'all' ? undefined : stepType,
    }
  }, [source, stepType])

  const { recipes: allRecipes, loading, error } = useRecipes(filter)
  const { isFavorite, isOfflineSaved } = useRecipeCollections()

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

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Recipes"
        subtitle="1 recipe = 1 chemical step"
        showBack={false}
        left={<BookOpen size={18} className="text-sub" />}
        right={
          <button
            className="btn btn-ghost btn-xs btn-circle"
            onClick={() => navigate('/recipes/new-full')}
            aria-label="Create recipe"
          >
            <Plus size={14} />
          </button>
        }
      />

      <div className="p-4 border-b border-base-300 space-y-3">
        <div className="join w-full">
          <button
            className={`join-item btn btn-sm flex-1 ${source === 'system' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSource('system')}
          >
            System
          </button>
          <button
            className={`join-item btn btn-sm flex-1 ${source === 'personal' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSource('personal')}
          >
            Personal
          </button>
        </div>

        <label className="input input-bordered flex items-center gap-2 w-full">
          <Search size={14} className="opacity-60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="grow"
            placeholder="Search recipes (name, film, tags, attributes...)"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto">
          {STEP_TYPES.map((item) => (
            <button
              key={item.value}
              className={`btn btn-xs ${stepType === item.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStepType(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {loading && <div className="text-sm text-sub">Loading recipes...</div>}
        {error && <div className="text-sm text-error">{error}</div>}
        {!loading && recipes.length === 0 && (
          <div className="text-center py-12 text-sub">
            <BookOpen size={24} className="mx-auto mb-2 opacity-60" />
            No recipes found
          </div>
        )}

        <div className="space-y-2">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              className="w-full text-left p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              <div className="font-semibold text-sm">{recipe.name}</div>
              <div className="text-xs text-sub mt-0.5 capitalize">
                {recipe.step_type ?? 'unknown'}
                {recipe.chemical_format ? ` · ${recipe.chemical_format}` : ''}
              </div>
              <div className="mt-1 flex gap-1.5">
                {isFavorite(recipe.id) && <span className="badge badge-outline badge-xs">favourite</span>}
                {isOfflineSaved(recipe.id) && <span className="badge badge-outline badge-xs">offline</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
