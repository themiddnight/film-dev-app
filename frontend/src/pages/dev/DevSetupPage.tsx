import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { recipeRepo, kitRepo, inventoryRepo } from '../../repositories'
import { useDevSessionStore } from '../../store/devSessionStore'
import type { Recipe } from '../../types/recipe'
import type { Kit } from '../../types/kit'
import type { InventoryItem } from '../../types/inventory'
import { applyAdjustments, getRecipeTimingSeconds } from '../../utils/dev'
import type { DevType } from '../../types/settings'
import { useEquipmentStore } from '../../store/equipmentStore'

function getBaseSeconds(recipe: Recipe, temperatureCelsius: number, devType: DevType): number {
  if (recipe.constraints?.is_two_bath && (recipe.develop_steps?.length ?? 0) > 0) {
    return (recipe.develop_steps ?? [])
      .filter((step) => step.type === 'developer' || step.type === 'activator')
      .reduce((sum, step) => sum + (typeof step.duration_seconds === 'number' ? step.duration_seconds : 0), 0)
  }

  return getRecipeTimingSeconds(recipe, temperatureCelsius, devType)
}

const DEV_TYPES: DevType[] = ['N-2', 'N-1', 'N', 'N+1', 'N+2']

export default function DevSetupPage() {
  const navigate = useNavigate()
  const [developerRecipe, setDeveloperRecipe] = useState<Recipe | null>(null)
  const [kit, setKit] = useState<Kit | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [bathBOptions, setBathBOptions] = useState<InventoryItem[]>([])
  const [selectedBathBItemId, setSelectedBathBItemId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    source,
    film_format,
    rolls_count,
    temperature_celsius,
    dev_type,
    agitation_method,
    setConfig,
    setSelectedBathBItemId: storeSetBathB,
    startTimerSession,
  } = useDevSessionStore()
  const { equipment } = useEquipmentStore()
  const [sessionTankType, setSessionTankType] = useState<'paterson' | 'stainless' | 'jobo' | 'other'>(equipment.tank_type)
  const [sessionWaterHardness, setSessionWaterHardness] = useState<'soft' | 'medium' | 'hard'>(equipment.water_hardness)

  useEffect(() => {
    setConfig({ agitation_method: equipment.agitation_method })
    setSessionTankType(equipment.tank_type)
    setSessionWaterHardness(equipment.water_hardness)
  }, [equipment.agitation_method, equipment.tank_type, equipment.water_hardness, setConfig])

  useEffect(() => {
    if (!source) {
      navigate('/dev')
      return
    }

    const resolvedSource = source

    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        let resolvedRecipe: Recipe | null = null
        let resolvedKit: Kit | null = null

        if (resolvedSource.type === 'recipe') {
          const recipe = await recipeRepo.getById(resolvedSource.recipeId)
          if (!cancelled) {
            setDeveloperRecipe(recipe)
            setKit(null)
            setInventoryItems([])
            resolvedRecipe = recipe
          }
        } else {
          const k = await kitRepo.getById(resolvedSource.kitId)
          const allItems = await inventoryRepo.getAll()
          if (!k) {
            if (!cancelled) setLoading(false)
            return
          }

          const kitItemIds = [...new Set(k.slots.map((s) => s.inventory_item_id).filter((id): id is string => !!id))]
          const selectedItems = allItems.filter((item) => kitItemIds.includes(item.id))
          const developerItem = selectedItems.find((item) => item.step_type === 'developer' && item.developer_bath_role === 'bath_a')
            ?? selectedItems.find((item) => item.step_type === 'developer')
          const recipe = developerItem ? await recipeRepo.getById(developerItem.recipe_id) : null

          if (!cancelled) {
            setKit(k)
            setInventoryItems(selectedItems)
            setDeveloperRecipe(recipe)
            resolvedRecipe = recipe
            resolvedKit = k
          }
        }

        // Load Bath B options for two-bath recipes
        if (!cancelled && resolvedRecipe?.constraints?.is_two_bath) {
          const allItems = await inventoryRepo.getAll()
          const options = allItems.filter(
            (item) =>
              item.recipe_id === resolvedRecipe!.id &&
              item.developer_bath_role === 'bath_b' &&
              item.status === 'active',
          )
          if (!cancelled) {
            setBathBOptions(options)
            // Pre-select: kit's Bath B slot item if available, else first option
            const kitBathBId = resolvedSource.type === 'kit'
              ? (() => {
                  const kitBathBSlot = resolvedKit?.slots.find((s) => s.developer_slot_role === 'bath_b')
                  return kitBathBSlot?.inventory_item_id ?? null
                })()
              : null
            setSelectedBathBItemId(kitBathBId ?? options[0]?.id ?? null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [navigate, source])

  const developerInventory = useMemo(
    () => inventoryItems.find((item) => item.step_type === 'developer' && item.developer_bath_role === 'bath_a')
      ?? inventoryItems.find((item) => item.step_type === 'developer'),
    [inventoryItems],
  )

  const baseSeconds = useMemo(() => {
    if (!developerRecipe) return 0
    return getBaseSeconds(developerRecipe, temperature_celsius, dev_type)
  }, [developerRecipe, temperature_celsius, dev_type])

  const adjusted = useMemo(() => {
    if (!developerRecipe) return { seconds: 0 as number, compensationPct: undefined as number | undefined }
    return applyAdjustments(baseSeconds, developerRecipe, agitation_method, developerInventory?.use_count)
  }, [developerRecipe, baseSeconds, agitation_method, developerInventory?.use_count])

  function format(seconds: number): string {
    const mm = Math.floor(seconds / 60)
    const ss = seconds % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  const isTwoBath = !!(developerRecipe?.constraints?.is_two_bath)

  useEffect(() => {
    if (isTwoBath && dev_type !== 'N') {
      setConfig({ dev_type: 'N' })
    }
  }, [isTwoBath, dev_type, setConfig])

  function start() {
    storeSetBathB(isTwoBath ? (selectedBathBItemId ?? null) : null)
    startTimerSession(adjusted.seconds)
    navigate('/dev/timer')
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Session Setup" onBack={() => navigate('/dev')} />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-28 space-y-4">
        {loading && <p className="text-sm text-sub">Loading setup...</p>}

        {!loading && !developerRecipe && (
          <p className="text-sm text-error">Developer recipe not resolved. Please select another source.</p>
        )}

        {developerRecipe && (
          <>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <p className="text-xs text-sub uppercase">Source</p>
                <p className="font-semibold text-sm">
                  {source?.type === 'kit' ? `Kit: ${kit?.name ?? '-'}` : `Recipe: ${developerRecipe.name}`}
                </p>
                {source?.type === 'recipe' && (
                  <p className="text-xs text-warning">Anonymous session: no inventory tracking</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-sub block mb-1">Film format</label>
                <select
                  className="select select-bordered w-full"
                  value={film_format}
                  onChange={(e) => setConfig({ film_format: e.target.value as '35mm' | '120' | '4x5' | 'other' })}
                >
                  <option value="35mm">35mm</option>
                  <option value="120">120</option>
                  <option value="4x5">4x5</option>
                  <option value="other">other</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-sub block mb-1">Rolls</label>
                <input
                  className="input input-bordered w-full"
                  type="number"
                  min={1}
                  max={12}
                  value={rolls_count}
                  onChange={(e) => setConfig({ rolls_count: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-sub block mb-1">Temperature (°C)</label>
                <input
                  className="input input-bordered w-full"
                  type="number"
                  min={10}
                  max={35}
                  value={temperature_celsius}
                  onChange={(e) => setConfig({ temperature_celsius: Number(e.target.value) || 20 })}
                />
              </div>

              {!isTwoBath && (
                <div>
                  <label className="text-xs text-sub block mb-1">Dev type</label>
                  <select
                    className="select select-bordered w-full"
                    value={dev_type}
                    onChange={(e) => setConfig({ dev_type: e.target.value as DevType })}
                  >
                    {DEV_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {isTwoBath && (
              <div>
                <label className="text-xs text-sub block mb-1">Bath B — N level</label>
                <select
                  className="select select-bordered w-full"
                  value={selectedBathBItemId ?? ''}
                  onChange={(e) => setSelectedBathBItemId(e.target.value || null)}
                >
                  <option value="">— select Bath B —</option>
                  {bathBOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.n_level ?? 'N'} — {item.name} (used {item.use_count})
                    </option>
                  ))}
                </select>
                {bathBOptions.length === 0 && (
                  <p className="text-xs text-error mt-1">No Bath B in inventory — mix one first.</p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs text-sub block mb-1">Agitation</label>
              <select
                className="select select-bordered w-full"
                value={agitation_method}
                onChange={(e) =>
                  setConfig({
                    agitation_method: e.target.value as 'inversion' | 'rotation' | 'stand' | 'rotary',
                  })
                }
              >
                <option value="inversion">inversion</option>
                <option value="rotation">rotation</option>
                <option value="rotary">rotary</option>
                <option value="stand">stand</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-sub block mb-1">Tank type</label>
                <select className="select select-bordered w-full" value={sessionTankType} onChange={(e) => setSessionTankType(e.target.value as 'paterson' | 'stainless' | 'jobo' | 'other')}>
                  <option value="paterson">paterson</option>
                  <option value="stainless">stainless</option>
                  <option value="jobo">jobo</option>
                  <option value="other">other</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-sub block mb-1">Water hardness</label>
                <select className="select select-bordered w-full" value={sessionWaterHardness} onChange={(e) => setSessionWaterHardness(e.target.value as 'soft' | 'medium' | 'hard')}>
                  <option value="soft">soft</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-sub">Tank type and water hardness here are session-level overrides only.</p>

            <div className="card bg-base-200">
              <div className="card-body p-4 text-sm">
                <p><span className="font-semibold">Recipe:</span> {developerRecipe.name}</p>
                <p><span className="font-semibold">Base time:</span> {format(baseSeconds)}</p>
                <p><span className="font-semibold">Adjusted time:</span> {format(adjusted.seconds)}</p>
                {adjusted.compensationPct !== undefined && (
                  <p className="text-warning">Reusable compensation +{adjusted.compensationPct}%</p>
                )}
              </div>
            </div>

          </>
        )}
      </div>

      {developerRecipe && (
        <div
          className="sticky bottom-0 z-20 border-t border-base-300 bg-base-100/95 px-4 pt-3 backdrop-blur"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <button
            className="btn btn-primary w-full"
            onClick={start}
            disabled={adjusted.seconds <= 0 || (isTwoBath && !selectedBathBItemId)}
          >
            Start timer
          </button>
        </div>
      )}
    </div>
  )
}
