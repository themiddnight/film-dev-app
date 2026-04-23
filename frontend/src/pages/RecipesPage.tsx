import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Search, Star } from 'lucide-react'
import Navbar from '@/components/Navbar'
import StepTypeBadge from '@/components/StepTypeBadge'
import { useRecipes } from '@/hooks/useRecipes'
import { useRecipeCollections } from '@/hooks/useRecipeCollections'
import { useUiStateStore } from '@/store/uiStateStore'
import { useShallow } from 'zustand/react/shallow'
import { toTitleCase } from '@/utils/string'
import type { Recipe, RecipeStepType } from '@/types/recipe'

const STEP_TYPES: Array<{ value: 'all' | RecipeStepType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'developer', label: 'Developer' },
  { value: 'stop', label: 'Stop' },
  { value: 'fixer', label: 'Fixer' },
  { value: 'wash_aid', label: 'Wash Aid' },
  { value: 'wetting_agent', label: 'Wetting' },
]

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

  const { tab, stepType, query, setRecipesPage } = useUiStateStore(
    useShallow((s) => ({
      tab: s.recipesPage.tab,
      stepType: s.recipesPage.stepType,
      query: s.recipesPage.query,
      setRecipesPage: s.setRecipesPage,
    }))
  )

  const { favoriteIds, isFavorite } = useRecipeCollections()

  const systemFilter = useMemo(() => ({
    author_type: 'system' as const,
    step_type: stepType === 'all' ? undefined : stepType,
  }), [stepType])

  const allFilter = useMemo(() => ({
    step_type: stepType === 'all' ? undefined : stepType,
  }), [stepType])

  const { recipes: systemRecipes, loading: systemLoading, error: systemError } = useRecipes(
    tab === 'system' ? systemFilter : { author_type: 'system' as const }
  )
  const { recipes: allRecipes, loading: personalLoading, error: personalError } = useRecipes(
    tab === 'personal' ? allFilter : { author_type: 'personal' as const }
  )

  const loading = tab === 'system' ? systemLoading : personalLoading
  const error = tab === 'system' ? systemError : personalError

  const searchTerms = useMemo(() => query.trim().split(/\s+/).filter(Boolean), [query])

  const tabRecipes = useMemo(() => {
    if (tab === 'system') return systemRecipes

    const personal = allRecipes.filter((r) => r.author_type === 'personal')
    const favSystem = allRecipes.filter(
      (r) => r.author_type === 'system' && favoriteIds.has(r.id)
    )
    return [...personal, ...favSystem]
  }, [tab, systemRecipes, allRecipes, favoriteIds])

  const recipes = useMemo(() => {
    if (searchTerms.length === 0) return tabRecipes
    return tabRecipes
      .map((recipe) => ({ recipe, score: scoreRecipe(recipe, searchTerms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ recipe }) => recipe)
  }, [tabRecipes, searchTerms])

  const personalCount = useMemo(() => {
    const personal = allRecipes.filter((r) => r.author_type === 'personal').length
    return personal + favoriteIds.size
  }, [allRecipes, favoriteIds])

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
            className={`join-item btn btn-sm flex-1 ${tab === 'system' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setRecipesPage({ tab: 'system' })}
          >
            System
          </button>
          <button
            className={`join-item btn btn-sm flex-1 ${tab === 'personal' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setRecipesPage({ tab: 'personal' })}
          >
            Personal
            {personalCount > 0 && (
              <span className="badge badge-xs badge-neutral ml-1">{personalCount}</span>
            )}
          </button>
        </div>

        <label className="input input-bordered flex items-center gap-2 w-full">
          <Search size={14} className="opacity-60" />
          <input
            value={query}
            onChange={(e) => setRecipesPage({ query: e.target.value })}
            className="grow"
            placeholder="Search recipes (name, film, tags, attributes...)"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto">
          {STEP_TYPES.map((item) => (
            <button
              key={item.value}
              className={`btn btn-xs ${stepType === item.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setRecipesPage({ stepType: item.value })}
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
            {tab === 'personal'
              ? 'No personal recipes yet. Create one or favourite a system recipe.'
              : 'No recipes found'}
          </div>
        )}

        <div className="space-y-2">
          {recipes.map((recipe) => {
            const isSystemFav = recipe.author_type === 'system' && tab === 'personal'
            return (
              <button
                key={recipe.id}
                className="w-full text-left p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm">{recipe.name}</div>
                  {isFavorite(recipe.id) && tab === 'system' && (
                    <Star size={12} className="text-warning shrink-0 mt-0.5 fill-warning" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StepTypeBadge stepType={recipe.step_type} />
                  {recipe.chemical_format && (
                    <span className="text-xs text-sub">{toTitleCase(recipe.chemical_format)}</span>
                  )}
                </div>
                {recipe.description && (
                  <p className="text-xs text-sub/70 mt-1 line-clamp-2 leading-relaxed">{recipe.description}</p>
                )}
                {isSystemFav && (
                  <div className="mt-1.5 flex gap-1.5">
                    <span className="badge badge-outline badge-xs text-warning border-warning">system</span>
                    <span className="badge badge-outline badge-xs text-warning border-warning">★ favourite</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
