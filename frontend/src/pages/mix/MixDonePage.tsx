import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useRecipes } from '../../hooks/useRecipes'
import { useMixingStore } from '../../store/mixingStore'
import { useInventory } from '../../hooks/useInventory'

export default function MixDonePage() {
  const navigate = useNavigate()
  const { selectedRecipeIds, resetAll } = useMixingStore()
  const { recipes } = useRecipes({})
  const { save } = useInventory()
  const [saving, setSaving] = useState(false)
  const [saveMap, setSaveMap] = useState<Record<string, boolean>>({})

  const selected = useMemo(() => recipes.filter((recipe) => selectedRecipeIds.includes(recipe.id)), [recipes, selectedRecipeIds])

  function shouldSave(recipeId: string): boolean {
    if (saveMap[recipeId] === undefined) return true
    return saveMap[recipeId]
  }

  async function persistSelected() {
    setSaving(true)
    try {
      const now = new Date().toISOString()

      for (const recipe of selected) {
        if (!shouldSave(recipe.id)) continue

        await save({
          id: crypto.randomUUID(),
          name: recipe.name,
          recipe_id: recipe.id,
          recipe_snapshot: {
            name: recipe.name,
            step_type: recipe.step_type ?? 'developer',
          },
          step_type: recipe.step_type ?? 'developer',
          bottle_type: 'reusable',
          mixed_date: now.slice(0, 10),
          shelf_life_days: undefined,
          use_count: 0,
          max_rolls: recipe.constraints?.reuse_compensation?.max_rolls,
          status: 'active',
          created_at: now,
          updated_at: now,
        })
      }
    } finally {
      setSaving(false)
      resetAll()
      navigate('/kits')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Mixing Done" showBack={false} />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        <div>
          <h1 className="text-xl font-bold">All recipes mixed</h1>
          <p className="text-sm text-sub">Save to inventory now?</p>
        </div>

        {selected.map((recipe) => (
          <label key={recipe.id} className="flex items-start gap-2 p-3 rounded-lg bg-base-200">
            <input
              type="checkbox"
              className="checkbox checkbox-sm mt-0.5"
              checked={shouldSave(recipe.id)}
              onChange={() =>
                setSaveMap((prev) => ({
                  ...prev,
                  [recipe.id]: !shouldSave(recipe.id),
                }))
              }
            />
            <span>
              <span className="block font-semibold text-sm">{recipe.name}</span>
              <span className="text-xs text-sub">Save as inventory item</span>
            </span>
          </label>
        ))}
      </div>

      <div className="p-4 border-t border-base-300 space-y-2">
        <button className="btn btn-primary w-full" disabled={saving} onClick={() => void persistSelected()}>
          Save selected to inventory
        </button>
        <button
          className="btn btn-ghost w-full"
          onClick={() => {
            resetAll()
            navigate('/dev')
          }}
        >
          Skip and go to Dev
        </button>
      </div>
    </div>
  )
}
