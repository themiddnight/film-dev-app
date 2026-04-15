import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useDevSessionStore } from '../../store/devSessionStore'
import { kitRepo, inventoryRepo, recipeRepo } from '../../repositories'
import type { InventoryItem } from '../../types/inventory'
import { buildInventoryUpdates } from '../../utils/dev'
import { useSaveSession } from '../../hooks/useSessions'

export default function DevDonePage() {
  const navigate = useNavigate()
  const {
    source,
    film_format,
    rolls_count,
    temperature_celsius,
    dev_type,
    agitation_method,
    target_duration_seconds,
    started_at,
    selected_bath_b_item_id,
    compensation_pct,
    completeTimerSession,
    toSessionSource,
    resetRuntime,
  } = useDevSessionStore()
  const { save } = useSaveSession()
  const didRun = useRef(false)
  const sourceNameRef = useRef<string>('')
  const [summary, setSummary] = useState({ recipe: '-', inventoryUsed: 0 })
  const [finalizing, setFinalizing] = useState(true)

  useEffect(() => {
    if (!source || !started_at || target_duration_seconds <= 0) {
      navigate('/dev')
      return
    }

    const resolvedSource = source
    const resolvedStartedAt = started_at

    if (didRun.current) return
    didRun.current = true

    async function finalize() {
      setFinalizing(true)
      let usedInventory: InventoryItem[] = []
      let recipeName = '-'

      if (resolvedSource.type === 'kit') {
        const kit = await kitRepo.getById(resolvedSource.kit_id)
        sourceNameRef.current = kit?.name ?? 'Kit'
        const ids = [...new Set(kit?.slots.map((s) => s.inventory_item_id).filter((id): id is string => !!id) ?? [])]
        const allItems = await inventoryRepo.getAll()
        let kitItems = allItems.filter((item) => ids.includes(item.id))

        // For two-bath: replace the kit's Bath B item with the one selected at dev time
        const kitBathBItem = kitItems.find((item) => item.developer_bath_role === 'bath_b')
        if (kitBathBItem && selected_bath_b_item_id && selected_bath_b_item_id !== kitBathBItem.id) {
          kitItems = kitItems.filter((item) => item.developer_bath_role !== 'bath_b')
          const selectedBathB = allItems.find((item) => item.id === selected_bath_b_item_id)
          if (selectedBathB) kitItems = [...kitItems, selectedBathB]
        } else if (!kitBathBItem && selected_bath_b_item_id) {
          // Kit had no Bath B slot (e.g., empty slot) — add the selected one
          const selectedBathB = allItems.find((item) => item.id === selected_bath_b_item_id)
          if (selectedBathB) kitItems = [...kitItems, selectedBathB]
        }

        usedInventory = kitItems

        // Dedup and update use count for all inventory used in the kit.
        for (const item of usedInventory) {
          await inventoryRepo.updateUseCount(item.id, rolls_count)
        }

        const developer = usedInventory.find((item) => item.step_type === 'developer' && item.developer_bath_role === 'bath_a')
          ?? usedInventory.find((item) => item.step_type === 'developer')
        if (developer) {
          const recipe = await recipeRepo.getById(developer.recipe_id)
          recipeName = recipe?.name ?? recipeName
        }
      } else {
        const recipe = await recipeRepo.getById(resolvedSource.recipe_id)
        recipeName = recipe?.name ?? recipeName
      }

      const updates = resolvedSource.type === 'kit' ? buildInventoryUpdates(usedInventory, rolls_count, compensation_pct) : []
      completeTimerSession(updates)

      const sessionSource = toSessionSource(sourceNameRef.current)
      if (!sessionSource) return

      await save({
        id: crypto.randomUUID(),
        source: sessionSource,
        film_format,
        rolls_count,
        temperature_celsius,
        dev_type,
        agitation_method,
        target_duration_seconds,
        actual_duration_seconds: target_duration_seconds,
        inventory_updates: updates,
        status: 'completed',
        started_at: resolvedStartedAt,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })

      setSummary({
        recipe: recipeName,
        inventoryUsed: usedInventory.length,
      })
      setFinalizing(false)
    }

    void finalize()
  }, [
    source,
    started_at,
    target_duration_seconds,
    rolls_count,
    film_format,
    temperature_celsius,
    dev_type,
    agitation_method,
    selected_bath_b_item_id,
    completeTimerSession,
    toSessionSource,
    save,
    navigate,
  ])

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Session Complete" showBack={false} />

      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Development complete</h1>
          <p className="text-sm text-sub mt-1">Session history saved and inventory updated.</p>
        </div>

        {finalizing && <p className="text-sm text-sub">Finalizing session...</p>}

        <div className="card bg-base-200">
          <div className="card-body p-4 text-sm space-y-1">
            <p><span className="font-semibold">Recipe:</span> {summary.recipe}</p>
            <p><span className="font-semibold">Rolls:</span> {rolls_count}</p>
            <p><span className="font-semibold">Dev:</span> {dev_type} at {temperature_celsius}C</p>
            <p><span className="font-semibold">Inventory updated:</span> {summary.inventoryUsed} items</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-base-300 space-y-2">
        <button
          className="btn btn-ghost w-full"
          onClick={() => {
            resetRuntime()
            navigate('/dev')
          }}
        >
          Start another session
        </button>
        <button
          className="btn btn-primary w-full"
          onClick={() => {
            resetRuntime()
            navigate('/dev')
          }}
        >
          Back to Dev
        </button>
      </div>
    </div>
  )
}
