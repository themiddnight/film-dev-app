// pages/develop/RecipeSelectPage.tsx — 02 · Recipe Select (Develop)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Search, Layers, Plus } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { useRecipes } from '../../hooks/useRecipes'
import { useDevelopStore } from '../../store/developStore'
import { useKitStore } from '../../store/kitStore'
import type { Recipe } from '../../types/recipe'
import type { DevKit } from '../../types/kit'

export default function RecipeSelectPage() {
  const navigate = useNavigate()
  const { setRecipe, setSelectedKit, applyKitSlots } = useDevelopStore()
  const { devKits, loadDevKits } = useKitStore()
  const [query, setQuery] = useState('')
  const { recipes, loading } = useRecipes()

  useEffect(() => { loadDevKits() }, [loadDevKits])

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.tags.some((t) => t.includes(query.toLowerCase()))
  )

  function select(recipe: Recipe) {
    setRecipe(recipe)
    navigate('/develop/preview')
  }

  // กด Kit shortcut → set recipe + pre-load Kit slots → ไป Step Preview
  function selectKit(kit: DevKit) {
    const recipe = recipes.find((r) => r.id === kit.recipeId)
    if (!recipe) return
    setRecipe(recipe)
    setSelectedKit(kit.id)
    applyKitSlots(kit.slots)
    navigate('/develop/preview')
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Select Recipe" onBack={() => navigate('/')} />

      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">

        {/* ── Kit Shortcuts ─────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-sub uppercase tracking-widest mb-2">Your Kits</p>

          {devKits.length > 0 ? (
            <>
              <div className="flex flex-col gap-2">
                {devKits.map((kit) => {
                  const recipe = recipes.find((r) => r.id === kit.recipeId)
                  if (!recipe) return null
                  const filledSlots = kit.slots.filter((s) => s.bottleId !== null).length
                  return (
                    <button
                      key={kit.id}
                      className="flex items-center gap-3 bg-base-200 hover:bg-base-300 transition-colors rounded-xl px-4 py-3 w-full text-left"
                      onClick={() => selectKit(kit)}
                    >
                      <Layers size={16} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{kit.name}</p>
                        <p className="text-xs text-sub truncate">
                          {recipe.name.split(' + ')[0]} · {filledSlots}/{kit.slots.length} slots
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-muted shrink-0" />
                    </button>
                  )
                })}
              </div>
              <div className="divider my-3 text-xs text-sub">or choose a recipe manually</div>
            </>
          ) : (
            /* ── Empty State: no kits yet ── */
            <button
              className="flex items-center gap-3 w-full rounded-xl border-2 border-dashed border-base-300 hover:border-primary hover:bg-base-200 transition-colors px-4 py-3 text-left group"
              onClick={() => navigate('/my-kit')}
            >
              <div className="w-8 h-8 rounded-full bg-base-300 group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                <Plus size={14} className="text-sub group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sub group-hover:text-base-content transition-colors">
                  Create your first Kit
                </p>
                <p className="text-xs text-sub mt-0.5">
                  Pre-assign which bottles to use — start a session in 1 tap
                </p>
              </div>
              <ChevronRight size={14} className="text-sub shrink-0" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
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

        {/* Recipe list */}
        <div className="flex-1 min-h-0">
          {loading && (
            <div className="text-center text-sub text-sm py-12">Loading...</div>
          )}
          {!loading && filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onSelect={select} />
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center text-sub text-sm py-12">
              No recipes found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function domainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function RecipeCard({ recipe, onSelect }: { recipe: Recipe; onSelect: (r: Recipe) => void }) {
  return (
    <div className="border-b border-base-300">
      <button
        className="w-full text-left px-4 py-4 hover:bg-base-200 transition-colors flex items-center justify-between gap-3"
        onClick={() => onSelect(recipe)}
      >
        <div>
          <div className="min-w-0">
            <div className="font-semibold text-lg">{recipe.name}</div>
            <div className="text-xs text-sub mt-0.5">
              {recipe.develop_steps.filter(s => s.type === 'developer' || s.type === 'activator').length >= 2 ? 'Two-Bath' : 'One-Bath'} ·{' '}
              {recipe.optimal_temp_range.min}–{recipe.optimal_temp_range.max}°C ·{' '}
              {recipe.film_types[0] === 'any' ? 'B&W all ISO' : recipe.film_types.join(', ')}
            </div>
            <div className="flex gap-1 py-3 flex-wrap">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="badge badge-ghost badge-xs">{tag}</span>
              ))}
            </div>
          </div>

          {recipe.references && recipe.references.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {recipe.references.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  {domainLabel(url)}
                </a>
              ))}
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-muted shrink-0" />
      </button>
    </div>
  )
}
