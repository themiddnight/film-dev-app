import { useMemo, useState } from 'react'
import { AlertTriangle, Edit2, Layers, Package, Plus, Search, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import BottomSheet from '../components/BottomSheet'
import { useInventory } from '../hooks/useInventory'
import { useKits } from '../hooks/useKits'
import { useRecipes } from '../hooks/useRecipes'
import type { InventoryItem } from '../types/inventory'
import type { Kit, KitSlot, KitSlotType } from '../types/kit'
import type { Recipe, RecipeStepType } from '../types/recipe'

const STEP_TYPES: Array<'all' | RecipeStepType> = ['all', 'developer', 'stop', 'fixer', 'wash_aid', 'wetting_agent']

type ItemForm = {
  id?: string
  name: string
  recipe_id: string
  step_type: RecipeStepType
  bottle_type: 'one-shot' | 'reusable'
  mixed_date: string
  shelf_life_days: string
  max_rolls: string
  use_count: string
  notes: string
}

type DraftKit = {
  id?: string
  name: string
  description: string
  slots: KitSlot[]
}

const SLOT_TYPES: Array<{ type: KitSlotType; optional: boolean }> = [
  { type: 'developer', optional: false },
  { type: 'stop', optional: true },
  { type: 'fixer', optional: false },
  { type: 'wash_aid', optional: true },
  { type: 'wetting_agent', optional: true },
]

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function defaultInventoryForm(): ItemForm {
  return {
    name: '',
    recipe_id: '',
    step_type: 'developer',
    bottle_type: 'reusable',
    mixed_date: todayISO(),
    shelf_life_days: '',
    max_rolls: '',
    use_count: '0',
    notes: '',
  }
}

function defaultDraftKit(): DraftKit {
  return {
    name: '',
    description: '',
    slots: SLOT_TYPES.map((slot, index) => ({
      id: crypto.randomUUID(),
      slot_type: slot.type,
      inventory_item_id: null,
      order: index,
      optional: slot.optional,
    })),
  }
}

function validateDraft(draft: DraftKit): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  const developer = draft.slots.find((slot) => slot.slot_type === 'developer')
  const fixer = draft.slots.find((slot) => slot.slot_type === 'fixer')
  const stop = draft.slots.find((slot) => slot.slot_type === 'stop')

  if (!developer?.inventory_item_id) errors.push('Developer slot is required')
  if (!fixer?.inventory_item_id) errors.push('Fixer slot is required')
  if (!stop?.inventory_item_id) warnings.push('Stop slot is empty (water stop fallback)')

  return { errors, warnings }
}

function statusColor(status: InventoryItem['status']): string {
  if (status === 'active') return 'badge-success'
  if (status === 'expired') return 'badge-warning'
  return 'badge-error'
}

function slotBlueprint(devCount: number): Array<{ type: KitSlotType; optional: boolean }> {
  return [
    ...Array.from({ length: Math.max(1, devCount) }).map(() => ({ type: 'developer' as KitSlotType, optional: false })),
    { type: 'stop' as KitSlotType, optional: true },
    { type: 'fixer' as KitSlotType, optional: false },
    { type: 'wash_aid' as KitSlotType, optional: true },
    { type: 'wetting_agent' as KitSlotType, optional: true },
  ]
}

function remapSlots(existing: KitSlot[], devCount: number): KitSlot[] {
  const byType: Record<KitSlotType, KitSlot[]> = {
    developer: existing.filter((s) => s.slot_type === 'developer'),
    stop: existing.filter((s) => s.slot_type === 'stop'),
    fixer: existing.filter((s) => s.slot_type === 'fixer'),
    wash_aid: existing.filter((s) => s.slot_type === 'wash_aid'),
    wetting_agent: existing.filter((s) => s.slot_type === 'wetting_agent'),
  }

  return slotBlueprint(devCount).map((blueprint, index) => {
    const reused = byType[blueprint.type].shift()
    return {
      id: reused?.id ?? crypto.randomUUID(),
      slot_type: blueprint.type,
      inventory_item_id: reused?.inventory_item_id ?? null,
      order: index,
      optional: blueprint.optional,
      notes: reused?.notes,
    }
  })
}

function getDeveloperRecipe(draft: DraftKit, items: { id: string; recipe_id: string }[], recipesById: Map<string, Recipe>) {
  const devSlot = draft.slots.find((slot) => slot.slot_type === 'developer')
  if (!devSlot?.inventory_item_id) return null
  const devItem = items.find((item) => item.id === devSlot.inventory_item_id)
  if (!devItem) return null
  return recipesById.get(devItem.recipe_id) ?? null
}

export default function KitsPage() {

  const [query, setQuery] = useState('')
  const [stepType, setStepType] = useState<'all' | RecipeStepType>('all')
  const [editingItem, setEditingItem] = useState<ItemForm | null>(null)
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null)
  const [draftKit, setDraftKit] = useState<DraftKit | null>(null)

  const filter = useMemo(
    () => ({
      search: query.trim() || undefined,
      step_type: stepType === 'all' ? undefined : stepType,
    }),
    [query, stepType],
  )

  const {
    items,
    loading: inventoryLoading,
    error: inventoryError,
    save: saveInventory,
    remove: removeInventory,
    markStatus,
  } = useInventory(filter)
  const { kits, loading: kitsLoading, error: kitsError, save: saveKit, remove: removeKit } = useKits()
  const { recipes } = useRecipes({})

  const selectedItem = selectedInventoryId ? items.find((it) => it.id === selectedInventoryId) ?? null : null

  const itemById = useMemo(() => {
    const map = new Map<string, (typeof items)[number]>()
    items.forEach((item) => map.set(item.id, item))
    return map
  }, [items])

  const recipeById = useMemo(() => {
    const map = new Map<string, Recipe>()
    recipes.forEach((recipe) => map.set(recipe.id, recipe))
    return map
  }, [recipes])

  const chemistryErrors = useMemo(() => {
    if (!draftKit) return [] as string[]
    const errors: string[] = []

    const developerRecipe = getDeveloperRecipe(draftKit, items, recipeById)
    const fixerSlot = draftKit.slots.find((slot) => slot.slot_type === 'fixer')
    const fixerItem = fixerSlot?.inventory_item_id ? itemById.get(fixerSlot.inventory_item_id) : null
    const fixerRecipe = fixerItem ? recipeById.get(fixerItem.recipe_id) : null

    if (developerRecipe?.constraints?.required_fixer_type === 'alkaline') {
      const fixerLooksAlkaline = !!fixerRecipe?.tags?.some(
        (tag) => tag.toLowerCase().includes('alkaline') || tag.toLowerCase().includes('tf-4') || tag.toLowerCase().includes('tf-5'),
      )
      if (fixerRecipe && !fixerLooksAlkaline) {
        errors.push('Pyro/alkaline developer requires alkaline fixer (TF-4/TF-5)')
      }
    }

    return errors
  }, [draftKit, items, recipeById, itemById])

  function openCreateInventory() {
    setEditingItem(defaultInventoryForm())
  }

  function openEditInventory(item: InventoryItem) {
    setEditingItem({
      id: item.id,
      name: item.name,
      recipe_id: item.recipe_id,
      step_type: item.step_type,
      bottle_type: item.bottle_type,
      mixed_date: item.mixed_date,
      shelf_life_days: item.shelf_life_days ? String(item.shelf_life_days) : '',
      max_rolls: item.max_rolls ? String(item.max_rolls) : '',
      use_count: String(item.use_count),
      notes: item.notes ?? '',
    })
  }

  async function submitInventory() {
    if (!editingItem || !editingItem.name.trim()) return

    const now = new Date().toISOString()
    const recipeName = recipeById.get(editingItem.recipe_id)?.name || 'Unknown recipe'

    await saveInventory({
      id: editingItem.id ?? crypto.randomUUID(),
      name: editingItem.name.trim(),
      recipe_id: editingItem.recipe_id,
      recipe_snapshot: {
        name: recipeName,
        step_type: editingItem.step_type,
      },
      step_type: editingItem.step_type,
      bottle_type: editingItem.bottle_type,
      mixed_date: editingItem.mixed_date,
      shelf_life_days: editingItem.shelf_life_days ? Number(editingItem.shelf_life_days) : undefined,
      use_count: Number(editingItem.use_count) || 0,
      max_rolls: editingItem.max_rolls ? Number(editingItem.max_rolls) : undefined,
      status: selectedItem?.status ?? 'active',
      notes: editingItem.notes.trim() || undefined,
      created_at: now,
      updated_at: now,
    })

    setEditingItem(null)
  }

  function openCreateKit() {
    setDraftKit(defaultDraftKit())
  }

  function openEditKit(kit: Kit) {
    setDraftKit({
      id: kit.id,
      name: kit.name,
      description: kit.description ?? '',
      slots: kit.slots,
    })
  }

  async function submitKit() {
    if (!draftKit || !draftKit.name.trim()) return

    const now = new Date().toISOString()
    const payload: Kit = {
      id: draftKit.id ?? crypto.randomUUID(),
      name: draftKit.name.trim(),
      description: draftKit.description.trim() || undefined,
      slots: draftKit.slots,
      created_at: now,
      updated_at: now,
    }

    await saveKit(payload)
    setDraftKit(null)
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="My Kit"
        subtitle="Inventory + kits"
        showBack={false}
        left={<Package size={18} className="text-sub" />}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wide text-sub">Inventory bottles</h2>
            <button className="btn btn-primary btn-xs" onClick={openCreateInventory}>
              <Plus size={14} /> Add bottle
            </button>
          </div>

          <label className="input input-bordered flex items-center gap-2 w-full">
            <Search size={14} className="opacity-60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="grow"
              placeholder="Search bottle"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto">
            {STEP_TYPES.map((type) => (
              <button
                key={type}
                className={`btn btn-xs ${stepType === type ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStepType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {inventoryLoading && <p className="text-sm text-sub">Loading inventory...</p>}
          {inventoryError && <p className="text-sm text-error">{inventoryError}</p>}

          {!inventoryLoading && items.length === 0 && (
            <div className="text-center py-8 text-sub bg-base-200 rounded-lg">
              <Package size={24} className="mx-auto mb-2 opacity-60" />
              No inventory item
            </div>
          )}

          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                className="w-full text-left p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
                onClick={() => setSelectedInventoryId(item.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-sub mt-0.5 capitalize">
                      {item.step_type} · {item.bottle_type} · used {item.use_count}
                    </div>
                  </div>
                  <span className={`badge badge-xs ${statusColor(item.status)}`}>{item.status}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedItem && (
            <div className="border border-base-300 p-3 rounded-lg bg-base-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{selectedItem.name}</h3>
                  <p className="text-xs text-sub">
                    {selectedItem.recipe_snapshot?.name ?? recipeById.get(selectedItem.recipe_id)?.name ?? selectedItem.recipe_id}
                  </p>
                </div>
                <span className={`badge ${statusColor(selectedItem.status)}`}>{selectedItem.status}</span>
              </div>

              <div className="text-xs text-sub grid grid-cols-2 gap-2">
                <p>Mixed: {selectedItem.mixed_date}</p>
                <p>Use count: {selectedItem.use_count}</p>
                <p>Max rolls: {selectedItem.max_rolls ?? '-'}</p>
                <p>Shelf life: {selectedItem.shelf_life_days ?? '-'} days</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-sm btn-ghost" onClick={() => openEditInventory(selectedItem)}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn btn-sm btn-warning" onClick={() => void markStatus(selectedItem.id, 'exhausted')}>
                  Mark exhausted
                </button>
                <button className="btn btn-sm btn-error btn-outline" onClick={() => void removeInventory(selectedItem.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wide text-sub">Kits list</h2>
            <button className="btn btn-primary btn-xs" onClick={openCreateKit}>
              <Plus size={14} /> Add kit
            </button>
          </div>

          {kitsLoading && <p className="text-sm text-sub">Loading kits...</p>}
          {kitsError && <p className="text-sm text-error">{kitsError}</p>}

          {!kitsLoading && kits.length === 0 && (
            <div className="text-center py-8 text-sub bg-base-200 rounded-lg">
              <Layers size={24} className="mx-auto mb-2 opacity-60" />
              No kit preset
            </div>
          )}

          <div className="space-y-2">
            {kits.map((kit) => {
              const statuses = kit.slots
                .map((slot) => slot.inventory_item_id)
                .filter((id): id is string => !!id)
                .map((id) => itemById.get(id)?.status)
                .filter((status): status is 'active' | 'expired' | 'exhausted' => !!status)

              const hasProblem = statuses.some((status) => status !== 'active')

              return (
                <div key={kit.id} className="p-3 rounded-lg bg-base-200">
                  <div className="flex items-start justify-between gap-3">
                    <button className="text-left flex-1" onClick={() => openEditKit(kit)}>
                      <div className="font-semibold text-sm">{kit.name}</div>
                      <div className="text-xs text-sub mt-0.5">{kit.description || 'No description'}</div>
                    </button>

                    <button className="btn btn-ghost btn-xs text-error" onClick={() => void removeKit(kit.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {hasProblem && (
                    <div className="mt-2 text-xs text-warning flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Kit contains expired/exhausted inventory
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {editingItem && (
        <BottomSheet
          title={editingItem.id ? 'Edit bottle' : 'Add bottle'}
          onClose={() => setEditingItem(null)}
          actions={
            <>
              <button className="btn btn-ghost flex-1" onClick={() => setEditingItem(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={() => void submitInventory()}
                disabled={!editingItem.name.trim() || !editingItem.recipe_id}
              >
                Save bottle
              </button>
            </>
          }
        >

            <div>
              <label className="text-xs text-sub block mb-1">Bottle name</label>
              <input
                className="input input-bordered w-full"
                value={editingItem.name}
                onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                placeholder="e.g. Rodinal batch #3"
              />
            </div>

            <div>
              <label className="text-xs text-sub block mb-1">Recipe</label>
              <select
                className="select select-bordered w-full"
                value={editingItem.recipe_id}
                onChange={(e) => {
                  const recipe = recipes.find((r) => r.id === e.target.value)
                  setEditingItem((prev) =>
                    prev
                      ? {
                          ...prev,
                          recipe_id: e.target.value,
                          step_type: (recipe?.step_type ?? prev.step_type) as RecipeStepType,
                        }
                      : prev,
                  )
                }}
              >
                <option value="">Select recipe</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-sub block mb-1">Step type</label>
                <select
                  className="select select-bordered w-full"
                  value={editingItem.step_type}
                  onChange={(e) =>
                    setEditingItem((prev) => (prev ? { ...prev, step_type: e.target.value as RecipeStepType } : prev))
                  }
                >
                  {STEP_TYPES.filter((v) => v !== 'all').map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-sub block mb-1">Bottle type</label>
                <select
                  className="select select-bordered w-full"
                  value={editingItem.bottle_type}
                  onChange={(e) =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, bottle_type: e.target.value as 'one-shot' | 'reusable' } : prev,
                    )
                  }
                >
                  <option value="reusable">reusable</option>
                  <option value="one-shot">one-shot</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-sub block mb-1">Mixed date</label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={editingItem.mixed_date}
                  onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, mixed_date: e.target.value } : prev))}
                />
              </div>
              <div>
                <label className="text-xs text-sub block mb-1">Use count</label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={editingItem.use_count}
                  onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, use_count: e.target.value } : prev))}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-sub block mb-1">Shelf life (days)</label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={editingItem.shelf_life_days}
                  onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, shelf_life_days: e.target.value } : prev))}
                  placeholder="optional"
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs text-sub block mb-1">Max rolls</label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={editingItem.max_rolls}
                  onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, max_rolls: e.target.value } : prev))}
                  placeholder="optional"
                  min={1}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-sub block mb-1">Notes</label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={editingItem.notes}
                onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
                placeholder="optional"
                rows={2}
              />
            </div>

        </BottomSheet>
      )}

      {draftKit && (
        <BottomSheet
          title={draftKit.id ? 'Edit kit' : 'Create kit'}
          onClose={() => setDraftKit(null)}
          actions={
            <>
              <button className="btn btn-ghost flex-1" onClick={() => setDraftKit(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={() => void submitKit()}
                disabled={validateDraft(draftKit).errors.length > 0 || chemistryErrors.length > 0 || !draftKit.name.trim()}
              >
                Save kit
              </button>
            </>
          }
        >

            <div>
              <label className="text-xs text-sub block mb-1">Kit name</label>
              <input
                className="input input-bordered w-full"
                value={draftKit.name}
                onChange={(e) => setDraftKit((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                placeholder="e.g. B&W standard"
              />
            </div>

            <div>
              <label className="text-xs text-sub block mb-1">Description</label>
              <input
                className="input input-bordered w-full"
                value={draftKit.description}
                onChange={(e) => setDraftKit((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                placeholder="optional"
              />
            </div>

            <div className="space-y-2">
              {draftKit.slots.map((slot) => {
                const candidates = items.filter((item) => item.step_type === slot.slot_type)
                return (
                  <div key={slot.id} className="space-y-1">
                    <label className="text-xs text-sub capitalize">{slot.slot_type}</label>
                    <select
                      className="select select-bordered w-full"
                      value={slot.inventory_item_id ?? ''}
                      onChange={(e) =>
                        setDraftKit((prev) =>
                          prev
                            ? {
                                ...(() => {
                                  const nextSlots = prev.slots.map((s) =>
                                    s.id === slot.id ? { ...s, inventory_item_id: e.target.value || null } : s,
                                  )

                                  if (slot.slot_type !== 'developer') {
                                    return { ...prev, slots: nextSlots }
                                  }

                                  const selectedDevItem = e.target.value ? items.find((item) => item.id === e.target.value) : null
                                  const selectedDevRecipe = selectedDevItem ? recipeById.get(selectedDevItem.recipe_id) : null
                                  const needsTwoBath = !!selectedDevRecipe?.constraints?.is_two_bath

                                  const normalizedSlots = remapSlots(nextSlots, needsTwoBath ? 2 : 1)
                                  return { ...prev, slots: normalizedSlots }
                                })(),
                              }
                            : prev,
                        )
                      }
                    >
                      <option value="">{slot.optional ? 'Optional (none)' : 'Select item'}</option>
                      {candidates.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            {(() => {
              const check = validateDraft(draftKit)
              return (
                <div className="space-y-1">
                  {check.errors.map((msg) => (
                    <p key={msg} className="text-xs text-error">{msg}</p>
                  ))}
                  {chemistryErrors.map((msg) => (
                    <p key={msg} className="text-xs text-error">{msg}</p>
                  ))}
                  {check.warnings.map((msg) => (
                    <p key={msg} className="text-xs text-warning">{msg}</p>
                  ))}
                </div>
              )
            })()}

        </BottomSheet>
      )}
    </div>
  )
}
