// pages/HomePage.tsx — 01 · Home
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Layers, ChevronRight, FlaskConical } from 'lucide-react'
import { useRecipes } from '../hooks/useRecipes'
import { useDevelopStore } from '../store/developStore'
import { useKitStore } from '../store/kitStore'

export default function HomePage() {
  const navigate = useNavigate()
  const { setRecipe, setSelectedKit, applyKitSlots, lastUsedRecipeId, lastUsedKitId } = useDevelopStore()
  const { recipes } = useRecipes()
  const { devKits, loadDevKits } = useKitStore()

  useEffect(() => { loadDevKits() }, [loadDevKits])

  // ── Resolve last-used entities ──────────────────────────────────────────────
  const lastUsedKit = lastUsedKitId ? devKits.find((k) => k.id === lastUsedKitId) ?? null : null
  const lastUsedRecipe = lastUsedRecipeId ? recipes.find((r) => r.id === lastUsedRecipeId) ?? null : null

  function startDevelop() {
    navigate('/develop/recipe')
  }

  function startMixing() {
    navigate('/mixing/recipe')
  }

  function openRecentKit() {
    if (!lastUsedKit) return
    const recipe = recipes.find((r) => r.id === lastUsedKit.recipeId)
    if (!recipe) return
    setRecipe(recipe)
    setSelectedKit(lastUsedKit.id)
    applyKitSlots(lastUsedKit.slots)
    navigate('/develop/preview')
  }

  function openRecentRecipe() {
    if (!lastUsedRecipe) return
    setRecipe(lastUsedRecipe)
    navigate('/develop/preview')
  }

  // แสดง Kit card ก่อนถ้ายังมีอยู่, fallback เป็น Recipe card
  const showKitCard = lastUsedKit !== null
  const showRecipeCard = !showKitCard && lastUsedRecipe !== null

  // Recipe ที่ผูกกับ Kit (ใช้แสดง subtitle ใน Kit card)
  const lastUsedKitRecipe = lastUsedKit ? recipes.find((r) => r.id === lastUsedKit.recipeId) : null

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="navbar bg-base-100 border-b border-base-300 px-4 sticky top-0 z-10">
        <div className="flex-1">
          <span className="text-base font-semibold flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            🎞 Film Dev Guidance
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => navigate('/my-kit')}
            aria-label="Inventory"
          >
            <FlaskConical size={18} />
          </button>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-6">
        {/* Hero */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold leading-tight text-base-content">
            B&W Film Development<br />Guide & Timer
          </h1>
          <p className="text-sm text-sub mt-1">
            step-by-step · real-time timer · offline
          </p>
        </div>

        {/* Main actions */}
        <div className="flex flex-col gap-3">
          <button
            className="btn bg-base-200 hover:bg-base-300 border-none btn-lg justify-start gap-4 h-auto py-4 px-5"
            onClick={startDevelop}
          >
            <span className="text-xl">🎞</span>
            <div className="text-left">
              <div className="font-semibold text-base">Develop Film</div>
              <div className="text-xs text-sub font-normal">With timer and agitation reminder</div>
            </div>
          </button>

          <button
            className="btn bg-base-200 hover:bg-base-300 border-none btn-lg justify-start gap-4 h-auto py-4 px-5"
            onClick={startMixing}
          >
            <span className="text-xl">🧪</span>
            <div className="text-left">
              <div className="font-semibold text-base">Mix Chemicals</div>
              <div className="text-xs text-sub font-normal">Step-by-step checklist · no timer pressure</div>
            </div>
          </button>
        </div>

        {/* Last used — Kit card */}
        {showKitCard && (
          <div>
            <p className="text-xs text-sub mb-2 uppercase tracking-wide">Last used</p>
            <button
              className="card bg-base-200 w-full text-left hover:bg-base-300 transition-colors"
              onClick={openRecentKit}
            >
              <div className="card-body py-4 px-5 flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Layers size={16} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{lastUsedKit!.name}</div>
                    <div className="text-xs text-sub mt-0.5">
                      Kit · {lastUsedKitRecipe?.name ?? lastUsedKit!.recipeId}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-sub shrink-0" />
              </div>
            </button>
          </div>
        )}

        {/* Last used — Recipe card (fallback เมื่อไม่มี Kit) */}
        {showRecipeCard && (
          <div>
            <p className="text-xs text-sub mb-2 uppercase tracking-wide">Last used recipe</p>
            <button
              className="card bg-base-200 w-full text-left hover:bg-base-300 transition-colors"
              onClick={openRecentRecipe}
            >
              <div className="card-body py-4 px-5 flex-row items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{lastUsedRecipe!.name}</div>
                  <div className="text-xs text-sub mt-0.5">
                    {lastUsedRecipe!.develop_steps.filter(s => s.type === 'developer' || s.type === 'activator').length >= 2 ? 'Two-Bath' : 'One-Bath'} ·{' '}
                    {lastUsedRecipe!.optimal_temp_range.min}–{lastUsedRecipe!.optimal_temp_range.max}°C ·{' '}
                    {lastUsedRecipe!.film_types[0] === 'any' ? 'B&W all ISO' : lastUsedRecipe!.film_types.join(', ')}
                  </div>
                </div>
                <ChevronRight size={16} className="text-sub shrink-0" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
