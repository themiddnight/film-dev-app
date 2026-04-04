// pages/mixing/MixingRecipeSelectPage.tsx — 12 · Mixing: Recipe Select
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { useRecipes } from '../../hooks/useRecipes'
import { useMixingStore } from '../../store/mixingStore'
import { useSettingsStore } from '../../store/settingsStore'
import type { Recipe } from '../../types/recipe'

export default function MixingRecipeSelectPage() {
  const navigate = useNavigate()
  const { setRecipe, setMode } = useMixingStore()
  const mixingMode = useSettingsStore((s) => s.mixingMode)
  const [query, setQuery] = useState('')
  const { recipes, loading } = useRecipes()

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  )

  function select(recipe: Recipe) {
    setRecipe(recipe)
    setMode(mixingMode)
    navigate('/mixing/selection')
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Select Recipe — Mixing Guide" onBack={() => navigate('/')} />

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="grow"
            />
          </label>
        </div>

        <div className="divider my-0" />

        {loading ? (
          <div className="text-center text-sub text-sm py-12">Loading...</div>
        ) : (
          <>
            <p className="text-xs text-sub px-4 pt-2 pb-1">Last used</p>
            {filtered.slice(0, 1).map((r) => (
              <RecipeRow key={r.id} recipe={r} onSelect={select} isRecent />
            ))}

            <div className="divider my-0" />
            <p className="text-xs text-sub px-4 pt-2 pb-1">All recipes ({filtered.length})</p>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {filtered.map((r) => (
                <RecipeRow key={r.id} recipe={r} onSelect={select} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RecipeRow({
  recipe, onSelect, isRecent,
}: {
  recipe: Recipe
  onSelect: (r: Recipe) => void
  isRecent?: boolean
}) {
  return (
    <button
      className={`w-full text-left px-4 py-4 border-b border-base-300 hover:bg-base-200 transition-colors flex items-center justify-between gap-3 ${isRecent ? 'bg-base-200/50' : ''}`}
      onClick={() => onSelect(recipe)}
    >
      <div>
        <div className="font-semibold text-sm">{recipe.name}</div>
        <div className="text-xs text-sub mt-0.5">
          {recipe.develop_steps.filter(s => s.type === 'developer' || s.type === 'activator').length >= 2 ? 'Two-Bath' : 'One-Bath'} ·{' '}
          {recipe.optimal_temp_range.min}–{recipe.optimal_temp_range.max}°C
        </div>
      </div>
      <ChevronRight size={16} className="text-muted shrink-0" />
    </button>
  )
}
