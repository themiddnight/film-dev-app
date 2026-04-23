import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, PlayCircle, Timer } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useKits } from '@/hooks/useKits'
import { useRecipes } from '@/hooks/useRecipes'
import { useInventory } from '@/hooks/useInventory'
import { useDevSessionStore } from '@/store/devSessionStore'
import { useRecentSessions } from '@/hooks/useSessions'

export default function DevEntryPage() {
  const navigate = useNavigate()
  const { kits } = useKits()
  const setSource = useDevSessionStore((s) => s.setSource)
  const { recipes } = useRecipes({ step_type: 'developer' })
  const { items } = useInventory()
  const { sessions } = useRecentSessions(5)

  const kitCards = useMemo(() => {
    return kits.map((kit) => {
      const assigned = kit.slots
        .map((slot) => slot.inventory_item_id)
        .filter((id): id is string => !!id)
      const hasProblem = assigned.some((id) => {
        const item = items.find((it) => it.id === id)
        return item?.status === 'expired' || item?.status === 'exhausted'
      })
      return {
        ...kit,
        hasProblem,
      }
    })
  }, [kits, items])

  function chooseKit(kitId: string) {
    setSource({ type: 'kit', kit_id: kitId })
    navigate('/dev/setup')
  }

  function chooseRecipe(recipeId: string) {
    setSource({ type: 'recipe', recipe_id: recipeId })
    navigate('/dev/setup')
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Dev" subtitle="Choose entry point" showBack={true} onBack={() => navigate('/home')} left={<Timer size={18} className="text-sub" />} />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        <section>
          <h2 className="text-xs uppercase tracking-wide text-sub mb-2">Get started from your kit</h2>
          <div className="space-y-2">
            {kitCards.length === 0 && (
              <p className="text-sm text-sub">No kit yet. Create one in Kits .</p>
            )}

            {kitCards.map((kit) => (
              <button
                key={kit.id}
                className="w-full text-left p-3 rounded-lg bg-base-300 hover:bg-base-300 transition-colors"
                onClick={() => chooseKit(kit.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{kit.name}</p>
                    <p className="text-xs text-sub">{kit.description || 'No description'}</p>
                  </div>
                  <Layers size={14} className="opacity-70" />
                </div>
                {kit.hasProblem && (
                  <p className="text-xs text-warning mt-1">Contains expired/exhausted item</p>
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wide text-sub mb-2">Get started from recipe direct (anonymous)</h2>
          <div className="space-y-2">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                className="w-full text-left p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
                onClick={() => chooseRecipe(recipe.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{recipe.name}</p>
                    <p className="text-xs text-sub">{recipe.author_type ?? 'system'} · {recipe.chemical_format ?? '-'} · inventory not tracked</p>
                  </div>
                  <PlayCircle size={14} className="opacity-70" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wide text-sub mb-2">Recent sessions</h2>
          <div className="space-y-2">
            {sessions.length === 0 && <p className="text-sm text-sub">No sessions yet</p>}
            {sessions.map((session) => (
              <div key={session.id} className="p-3 rounded-lg bg-base-200">
                <p className="font-semibold text-sm">{session.source.type === 'kit' ? session.source.kit_name_snapshot : 'Recipe direct'}</p>
                <p className="text-xs text-sub">{session.film_format} · {session.rolls_count} rolls · {session.dev_type}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
