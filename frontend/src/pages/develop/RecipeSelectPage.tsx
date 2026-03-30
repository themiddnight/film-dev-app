// pages/develop/RecipeSelectPage.tsx — 02 · Recipe Select (Develop)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { recipes } from '../../data'
import { useDevelopStore } from '../../store/developStore'
import type { Recipe } from '../../types/recipe'

export default function RecipeSelectPage() {
  const navigate = useNavigate()
  const setRecipe = useDevelopStore((s) => s.setRecipe)
  const [query, setQuery] = useState('')

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.tags.some((t) => t.includes(query.toLowerCase()))
  )

  function select(recipe: Recipe) {
    setRecipe(recipe)
    navigate('/develop/preview')
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="เลือกสูตร" onBack={() => navigate('/')} />

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="ค้นหาสูตร..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="grow"
            />
          </label>
        </div>

        <div className="divider my-0" />

        {/* Recipe list */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onSelect={select} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-sub text-sm py-12">
              ไม่พบสูตรที่ค้นหา
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
