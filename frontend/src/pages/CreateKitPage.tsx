// pages/CreateKitPage.tsx — Create / Edit DevKit (Phase 1c-3)
// Entry: My Kit page → "สร้าง Kit ใหม่"
// Flow:
//   1. เลือก recipe ที่จะผูก Kit ด้วย
//   2. ตั้งชื่อ Kit
//   3. ต่อแต่ละ slot (develop_steps ที่มี bath_ref): dropdown เลือกขวดตาม role
//   4. Save → saveDevKit → กลับ My Kit page

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useKitStore } from '../store/kitStore'
import { useRecipes } from '../hooks/useRecipes'
import type { DevKit, KitSlot } from '../types/kit'
import type { DevelopStep, Recipe } from '../types/recipe'

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

/**
 * หา Bath ที่ตรงกับ step นี้ โดย lookup จาก recipe.baths ผ่าน step.bath_ref
 * คืน bath.role ถ้าเจอ — ใช้ filter ขวดใน dropdown
 */
function getBathRole(step: DevelopStep, recipe: Recipe) {
  if (!step.bath_ref) return null
  const bath = recipe.baths.find((b) => b.id === step.bath_ref)
  return bath?.role ?? null
}

/**
 * Label แสดงใน slot row
 * step.name = "Bath A — Developer" → แสดงตรงๆ
 */
function stepLabel(step: DevelopStep): string {
  return step.name
}

// role → label สำหรับแสดงใน dropdown hint
const ROLE_LABEL: Record<string, string> = {
  developer: 'Developer',
  stop: 'Stop Bath',
  fixer: 'Fixer',
  wash_aid: 'Wash Aid',
  wetting_agent: 'Wetting Agent',
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CreateKitPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editKitId = searchParams.get('edit') // ถ้ามี → edit mode

  const { kit, loadKit, devKits, loadDevKits, saveDevKit } = useKitStore()
  const { recipes } = useRecipes()

  const [step, setStep] = useState<'select-recipe' | 'configure'>('select-recipe')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [kitName, setKitName] = useState('')
  const [slots, setSlots] = useState<KitSlot[]>([])
  const [saving, setSaving] = useState(false)
  const [kitId, setKitId] = useState<string>(generateId())

  // Load kit (bottles) และ devKits เพื่อ edit mode
  useEffect(() => {
    loadKit()
    loadDevKits()
  }, [loadKit, loadDevKits])

  // Edit mode: โหลด existing kit เข้า form
  useEffect(() => {
    if (!editKitId || devKits.length === 0 || recipes.length === 0) return
    const existing = devKits.find((k) => k.id === editKitId)
    if (!existing) return
    const recipe = recipes.find((r) => r.id === existing.recipeId)
    if (!recipe) return
    setKitId(existing.id)
    setKitName(existing.name)
    setSelectedRecipe(recipe)
    setSlots(existing.slots)
    setStep('configure')
  }, [editKitId, devKits, recipes])

  // เมื่อ select recipe → auto-generate slots
  function handleSelectRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe)
    // สร้าง slots จาก develop_steps ที่มี bath_ref เท่านั้น
    const newSlots: KitSlot[] = recipe.develop_steps
      .filter((s) => !!s.bath_ref)
      .map((s) => ({ stepId: s.id, bottleId: null }))
    setSlots(newSlots)
    // ตั้งชื่อ default
    if (!kitName) {
      setKitName(`${recipe.name.split(' + ')[0]} Kit`)
    }
    setStep('configure')
  }

  function handleSlotChange(stepId: string, bottleId: string | null) {
    setSlots((prev) =>
      prev.map((s) => (s.stepId === stepId ? { ...s, bottleId } : s))
    )
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  /** developer slot ต้องเลือกก่อน save ได้ */
  const developerStepIds = selectedRecipe
    ? selectedRecipe.develop_steps
        .filter((s) => {
          if (!s.bath_ref) return false
          const bath = selectedRecipe.baths.find((b) => b.id === s.bath_ref)
          return bath?.role === 'developer'
        })
        .map((s) => s.id)
    : []

  const developerSlotEmpty = developerStepIds.some(
    (id) => !slots.find((s) => s.stepId === id)?.bottleId
  )

  /** stop/fixer/wash_aid slots ว่าง → warn แต่ไม่ block */
  const nonDevSlotEmpty = selectedRecipe
    ? selectedRecipe.develop_steps
        .filter((s) => {
          if (!s.bath_ref) return false
          const bath = selectedRecipe.baths.find((b) => b.id === s.bath_ref)
          return bath?.role !== 'developer' && bath?.chemical_format !== 'ready_to_use'
        })
        .some((s) => !slots.find((sl) => sl.stepId === s.id)?.bottleId)
    : false

  const canSave = !!kitName.trim() && !developerSlotEmpty && !saving

  async function handleSave() {
    if (!selectedRecipe || !canSave) return
    setSaving(true)
    const kit: DevKit = {
      id: kitId,
      name: kitName.trim(),
      recipeId: selectedRecipe.id,
      slots,
      createdAt: now(),
      updatedAt: now(),
    }
    await saveDevKit(kit)
    setSaving(false)
    navigate('/my-kit')
  }

  // ── Render: Recipe Selection ─────────────────────────────────────────────

  if (step === 'select-recipe') {
    return (
      <div className="flex flex-col h-full">
        <Navbar title="Create New Kit" onBack={() => navigate('/my-kit')} />
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
          <p className="text-xs text-sub uppercase tracking-widest pt-4 pb-2">Select a recipe to link to this Kit</p>
          <div className="flex flex-col gap-2">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                className="card bg-base-200 text-left w-full hover:bg-base-300 transition-colors"
                onClick={() => handleSelectRecipe(recipe)}
              >
                <div className="card-body py-4 px-4">
                  <p className="font-semibold text-sm">{recipe.name}</p>
                  <p className="text-xs text-sub line-clamp-1">{recipe.description}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="badge badge-xs badge-ghost">{tag}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Configure Kit ────────────────────────────────────────────────

  if (!selectedRecipe) return null

  // Steps ที่มี bath_ref (เฉพาะที่ต้องใช้ขวดน้ำยา)
  const stepsWithBath = selectedRecipe.develop_steps.filter((s) => !!s.bath_ref)

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={editKitId ? 'Edit Kit' : 'Create New Kit'}
        onBack={() => {
          if (editKitId) {
            navigate('/my-kit')
          } else {
            setStep('select-recipe')
          }
        }}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-28">
        {/* Recipe info */}
        <div className="mt-4 mb-4 flex items-center gap-2">
          <span className="badge badge-primary badge-sm">{selectedRecipe.name.split(' + ')[0]}</span>
          {!editKitId && (
            <button
              className="btn btn-ghost btn-xs text-sub"
              onClick={() => setStep('select-recipe')}
            >
              Change →
            </button>
          )}
        </div>

        {/* Kit Name */}
        <p className="text-xs text-sub uppercase tracking-widest pb-2">Kit name</p>
        <div className="card bg-base-200 mb-4">
          <div className="card-body py-3 px-4">
            <input
              className="input input-bordered w-full"
              placeholder="e.g. D-23 + Ilfosol Stop Set"
              value={kitName}
              onChange={(e) => setKitName(e.target.value)}
              maxLength={60}
            />
          </div>
        </div>

        {/* Slots */}
        <p className="text-xs text-sub uppercase tracking-widest pb-2">
          Select bottle per step ({stepsWithBath.length} slots)
        </p>

        {stepsWithBath.length === 0 ? (
          <div className="card bg-base-200">
            <div className="card-body items-center text-center py-6">
              <p className="text-sm text-sub">This recipe has no steps requiring bottles</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {stepsWithBath.map((developStep) => {
              const bathRole = getBathRole(developStep, selectedRecipe)
              const slot = slots.find((s) => s.stepId === developStep.id)
              // Filter bottles ตาม role ของ bath นี้
              const availableBottles = bathRole
                ? kit.bottles.filter((b) => b.role === bathRole)
                : kit.bottles

              return (
                <div key={developStep.id} className="card bg-base-200">
                  <div className="card-body py-3 px-4 gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-5 rounded-full shrink-0 ${
                        bathRole === 'developer' ? 'bg-primary' :
                        bathRole === 'stop' ? 'bg-warning' :
                        bathRole === 'fixer' ? 'bg-accent' : 'bg-base-content/30'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{stepLabel(developStep)}</p>
                        {bathRole && (
                          <p className="text-xs text-sub">
                            {ROLE_LABEL[bathRole] ?? bathRole}
                          </p>
                        )}
                      </div>
                    </div>

                    {availableBottles.length > 0 ? (
                      <select
                        className="select select-sm select-bordered w-full"
                        value={slot?.bottleId ?? ''}
                        onChange={(e) =>
                          handleSlotChange(developStep.id, e.target.value || null)
                        }
                        aria-label={`Select bottle for ${developStep.name}`}
                      >
                        <option value="">— None (skip)</option>
                        {availableBottles.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.developerName}
                            {b.defaultDilution ? ` (${b.defaultDilution})` : ''}
                            {b.type === 'reusable' ? ` · ${b.rollsDeveloped} rolls` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-sub">
                        <FlaskConical size={12} />
                        <span>
                          No {bathRole ? ROLE_LABEL[bathRole] : ''} bottles in inventory
                        </span>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => navigate('/my-kit')}
                        >
                          Add bottle →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-base-100/90 backdrop-blur-sm border-t border-base-300">
        {developerSlotEmpty && kitName.trim() && (
          <p className="text-xs text-error text-center mb-2">
            Select a developer bottle first — required for film development
          </p>
        )}
        {nonDevSlotEmpty && !developerSlotEmpty && kitName.trim() && (
          <p className="text-xs text-warning text-center mb-2">
            ⚠️ Some slots are empty — usage won't be tracked for unselected chemicals
          </p>
        )}
        <button
          className="btn btn-primary w-full btn-lg"
          onClick={handleSave}
          disabled={!canSave}
        >
          {saving ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            editKitId ? 'Save changes' : 'Save Kit'
          )}
        </button>
      </div>
    </div>
  )
}
