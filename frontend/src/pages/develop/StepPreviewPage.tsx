// pages/develop/StepPreviewPage.tsx — 03 · Step Preview
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Pencil, Plus, Minus, FlaskConical, Layers, Settings2, ChevronDown } from 'lucide-react'
import Navbar from '../../components/Navbar'
import ConfirmLeaveModal from '../../components/ConfirmLeaveModal'
import { useDevelopStore, computeEffectiveDuration } from '../../store/developStore'
import { useKitStore } from '../../store/kitStore'
import { formatTime } from '../../hooks/useTimer'
import type { DevType } from '../../types/settings'
import type { DevelopStep } from '../../types/recipe'
import type { EquipmentProfile } from '../../types/kit'

// ── Edit Time Bottom Sheet ────────────────────────────────────────────────────
function EditTimeSheet({
  step, currentSeconds, defaultSeconds, onSave, onSaveReset, onClose,
}: {
  step: DevelopStep
  currentSeconds: number
  defaultSeconds: number
  onSave: (s: number) => void
  onSaveReset: () => void
  onClose: () => void
}) {
  const [minutes, setMinutes] = useState(Math.floor(currentSeconds / 60))
  const [seconds, setSeconds] = useState(currentSeconds % 60)
  const [wasReset, setWasReset] = useState(false)
  const [closing, setClosing] = useState(false)

  function handleClose() { setClosing(true) }
  useEffect(() => {
    if (!closing) return
    const t = setTimeout(onClose, 280)
    return () => clearTimeout(t)
  }, [closing, onClose])

  function handleSave() {
    wasReset ? onSaveReset() : onSave(minutes * 60 + seconds)
    handleClose()
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-280 ${closing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div
        className="relative bg-base-100 rounded-t-[14px] px-5 pt-5 pb-8 z-10"
        style={{ animation: closing ? 'slideDown 280ms cubic-bezier(0.32,0.72,0,1) forwards' : 'slideUp 300ms cubic-bezier(0.32,0.72,0,1)' }}
      >
        <div className="flex justify-end mb-2">
          <button className="btn btn-ghost btn-sm btn-circle" onClick={handleClose} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <h3 className="font-bold text-lg mb-1">Edit time — {step.name}</h3>
        <p className="text-sm text-sub mb-4">
          Recipe default: {formatTime(defaultSeconds)}{step.temp_table ? ' (temperature-dependent)' : ''}
        </p>
        <div className="divider my-0 mb-4" />
        <p className="text-xs text-sub mb-3">Time (min : sec)</p>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex flex-col items-center gap-2">
            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => { setMinutes((m) => Math.min(99, m + 1)); setWasReset(false) }} aria-label="Increase minutes"><Plus size={16} /></button>
            <input type="number" min={0} max={99} value={minutes} onChange={(e) => { setMinutes(Math.min(99, Math.max(0, Number(e.target.value)))); setWasReset(false) }} className="input input-bordered text-center text-3xl font-bold w-20 h-14 tabular-nums" />
            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => { setMinutes((m) => Math.max(0, m - 1)); setWasReset(false) }} aria-label="Decrease minutes"><Minus size={16} /></button>
            <span className="text-xs text-sub">min</span>
          </div>
          <span className="text-3xl font-bold pb-8">:</span>
          <div className="flex flex-col items-center gap-2">
            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => { setSeconds((s) => s >= 59 ? 0 : s + 1); setWasReset(false) }} aria-label="Increase seconds"><Plus size={16} /></button>
            <input type="number" min={0} max={59} value={seconds} onChange={(e) => { setSeconds(Math.min(59, Math.max(0, Number(e.target.value)))); setWasReset(false) }} className="input input-bordered text-center text-3xl font-bold w-20 h-14 tabular-nums" />
            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => { setSeconds((s) => s <= 0 ? 59 : s - 1); setWasReset(false) }} aria-label="Decrease seconds"><Minus size={16} /></button>
            <span className="text-xs text-sub">sec</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm gap-2 mb-4" onClick={() => { setMinutes(Math.floor(defaultSeconds / 60)); setSeconds(defaultSeconds % 60); setWasReset(true) }}>
          <RefreshCw size={14} /> Reset to default
        </button>
        <div className="divider my-0 mb-4" />
        <div className="flex gap-3">
          <button className="btn btn-ghost flex-1" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Collapsible Section ───────────────────────────────────────────────────────
function CollapsibleCard({
  icon, title, summary, badge, children,
}: {
  icon: React.ReactNode
  title: string
  summary?: React.ReactNode   // แสดงตอน collapse
  badge?: React.ReactNode     // badge ข้างชื่อ (เช่น "custom")
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card bg-base-200 mb-3 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sub shrink-0">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="text-sm font-medium">{title}</span>
          {badge && <span className="ml-2">{badge}</span>}
          {!open && summary && (
            <span className="block text-xs text-sub mt-0.5 truncate">{summary}</span>
          )}
        </span>
        <ChevronDown
          size={15}
          className={`text-sub shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 flex flex-col gap-3 border-t border-base-300">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function availableTemps(steps: DevelopStep[]): number[] {
  for (const step of steps) {
    if (step.temp_table) return Object.keys(step.temp_table).map(Number).sort((a, b) => a - b)
  }
  return []
}

function tankLabel(t: EquipmentProfile['tankType'], custom?: string): string {
  if (t === 'other' && custom) return custom
  return { paterson: 'Paterson', stainless: 'Stainless', jobo: 'Jobo', other: 'Other' }[t]
}
function agitationLabel(a: EquipmentProfile['agitationMethod']): string {
  return { inversion: 'Inversion', rotation: 'Rotation', rotary: 'Rotary (Jobo)', stand: 'Stand' }[a]
}

type FilmFormat = '35mm' | '120' | '4x5'

function getTimeCompensation(rollsDeveloped: number): { factor: number; warn: boolean } {
  if (rollsDeveloped <= 2) return { factor: 1.0, warn: false }
  if (rollsDeveloped <= 4) return { factor: 1.25, warn: false }
  if (rollsDeveloped <= 6) return { factor: 1.5, warn: false }
  if (rollsDeveloped <= 8) return { factor: 1.75, warn: false }
  return { factor: 2.0, warn: true }
}
function compensationLabel(rolls: number): string {
  const { factor, warn } = getTimeCompensation(rolls)
  if (warn) return `⚠️ Roll ${rolls + 1}: developer may be exhausted`
  if (factor === 1.0) return ''
  return `Roll ${rolls + 1}: +${Math.round((factor - 1) * 100)}% time`
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StepPreviewPage() {
  const navigate = useNavigate()
  const {
    recipe, devType, tempCelsius, stepOverrides,
    setDevType, setTemp, setStepOverride, removeStepOverride,
    clearStepOverrides, hasStepOverrides, startSession,
    setSelectedBottle, selectedKitId, slotSelections,
    setSelectedKit, applyKitSlots, setSlotSelection,
  } = useDevelopStore()
  const { kit, loadKit, devKits, loadDevKits } = useKitStore()

  const [editingStep, setEditingStep] = useState<DevelopStep | null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [filmFormat, setFilmFormat] = useState<FilmFormat>('35mm')
  const [rolls, setRolls] = useState(1)
  const [equipmentOverride, setEquipmentOverride] = useState<EquipmentProfile | null>(null)
  // true = user ยังไม่ได้แตะ equipment ใน session นี้ → sync ตาม kit.equipment เสมอ
  const [equipmentIsFromSettings, setEquipmentIsFromSettings] = useState(true)

  useEffect(() => { loadKit() }, [loadKit])
  useEffect(() => { if (recipe) loadDevKits(recipe.id) }, [recipe?.id, loadDevKits])
  // Sync equipmentOverride ตาม kit.equipment ตราบใดที่ user ยังไม่ได้ override เอง
  // ทำให้แม้ kit โหลด async ช้า ก็ได้ค่าจริงจาก settings เสมอ
  useEffect(() => {
    if (kit.equipment && equipmentIsFromSettings) {
      setEquipmentOverride(structuredClone(kit.equipment))
    }
  }, [kit.equipment, equipmentIsFromSettings])

  if (!recipe) { navigate('/develop/recipe'); return null }

  const matchingKits = devKits.filter((k) => k.recipeId === recipe.id)
  const stepsWithBath = recipe.develop_steps.filter((s) => !!s.bath_ref)
  const equipment: EquipmentProfile = equipmentOverride ?? kit.equipment
  const pushPullWarn = devType !== 'N' && rolls > 1
  const devTypes: DevType[] = ['N-1', 'N', 'N+1']
  const temps = availableTemps(recipe.develop_steps)
  const validTemp = temps.length > 0 && !temps.includes(tempCelsius)
    ? temps.reduce((a, b) => Math.abs(b - tempCelsius) < Math.abs(a - tempCelsius) ? b : a)
    : tempCelsius

  // ── slot validation ──────────────────────────────────────────────────────────
  const developerStepIds = stepsWithBath
    .filter((s) => {
      const bath = recipe.baths.find((b) => b.id === s.bath_ref)
      return bath?.role === 'developer'
    })
    .map((s) => s.id)

  const developerSlotEmpty = developerStepIds.some(
    (id) => !slotSelections[id]
  )

  /** non-developer slots (excluding stop bath + ready_to_use) that are empty
   *  stop bath excluded: fallback เป็น water stop เสมอ — ไม่ต้อง warn ถ้าไม่มีขวด chemical stop
   */
  const nonDevSlotEmpty = stepsWithBath.some((s) => {
    const bath = recipe.baths.find((b) => b.id === s.bath_ref)
    if (!bath) return false
    if (bath.role === 'developer') return false
    if (bath.role === 'stop') return false          // water stop คือ fallback เสมอ
    if (bath.chemical_format === 'ready_to_use') return false
    return !slotSelections[s.id]
  })

  // ── derived: title + kit state ──────────────────────────────────────────────
  const selectedKit = matchingKits.find((k) => k.id === selectedKitId)
  const pageTitle = selectedKit ? selectedKit.name : recipe.name.split(' + ')[0]

  // หา slot ที่ถูก override จาก kit slots (ถ้ามี kit เลือกอยู่)
  const hasSlotOverride = selectedKit
    ? stepsWithBath.some((s) => {
        const kitSlot = selectedKit.slots.find((sl) => sl.stepId === s.id)
        const current = slotSelections[s.id] ?? null
        return kitSlot?.bottleId !== current
      })
    : false

  // ── bottle summary (collapsed) ──────────────────────────────────────────────
  const bottleSummary = stepsWithBath.length === 0
    ? 'No steps require a bottle'
    : stepsWithBath.map((s) => {
        const bottleId = slotSelections[s.id]
        if (!bottleId) return null
        const bottle = kit.bottles.find((b) => b.id === bottleId)
        return bottle?.developerName.split(' ').slice(-2).join(' ') ?? null
      }).filter(Boolean).join(' · ') || 'No bottles selected'

  // ── equipment summary (collapsed) ───────────────────────────────────────────
  const equipmentSummary = `${tankLabel(equipment.tankType, equipment.tankLabel)} · ${agitationLabel(equipment.agitationMethod)}${equipment.usesPreSoak ? ' · Pre-soak' : ''}`
  // เปรียบเฉพาะ field ที่ user แก้ได้ใน UI — ป้องกัน false positive
  // จาก field ที่ไม่มีใน localStorage เวอร์ชันเก่า (เช่น waterHardness)
  const isEquipmentOverridden = equipmentOverride
    ? equipmentOverride.tankType !== kit.equipment.tankType ||
      equipmentOverride.agitationMethod !== kit.equipment.agitationMethod ||
      equipmentOverride.usesPreSoak !== kit.equipment.usesPreSoak
    : false

  function handleBack() {
    hasStepOverrides() ? setShowLeaveModal(true) : navigate('/develop/recipe')
  }

  useEffect(() => {
    const devStep = stepsWithBath.find((s) => {
      const bath = recipe.baths.find((b) => b.id === s.bath_ref)
      return bath?.role === 'developer'
    })
    setSelectedBottle(devStep ? (slotSelections[devStep.id] ?? null) : null)
  }, [slotSelections])

  function handleKitSelect(kitId: string) {
    setSelectedKit(kitId || null)
    if (!kitId) {
      applyKitSlots(stepsWithBath.map((s) => ({ stepId: s.id, bottleId: null })))
      return
    }
    const devKit = matchingKits.find((k) => k.id === kitId)
    if (devKit) applyKitSlots(devKit.slots)
  }

  function handleStart() { startSession(); navigate('/develop/timer') }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={pageTitle}
        onBack={handleBack}
        right={
          <button className="btn btn-ghost btn-sm btn-circle" onClick={clearStepOverrides} title="Reset all values">
            <RefreshCw size={16} />
          </button>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 pt-4">

        {/* ── 1. Bottles (collapsible) ── */}
        <CollapsibleCard
          icon={<FlaskConical size={14} />}
          title="Chemical Bottles"
          summary={bottleSummary}
          badge={
            hasSlotOverride
              ? <span className="badge badge-warning badge-xs">custom</span>
              : undefined
          }
        >
          {/* Kit selector */}
          {matchingKits.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Layers size={12} className="text-sub" />
                <p className="text-xs text-sub">Kit</p>
              </div>
              <select
                className="select select-sm select-bordered w-full"
                value={selectedKitId ?? ''}
                onChange={(e) => handleKitSelect(e.target.value)}
                aria-label="Select Kit"
              >
                <option value="">— No Kit</option>
                {matchingKits.map((k) => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Per-slot dropdowns */}
          {stepsWithBath.length > 0 ? stepsWithBath.map((developStep) => {
            const bath = recipe.baths.find((b) => b.id === developStep.bath_ref)
            const availableBottles = bath?.role
              ? kit.bottles.filter((b) => b.role === bath.role)
              : kit.bottles
            const currentBottleId = slotSelections[developStep.id] ?? ''
            const selectedBottle = availableBottles.find((b) => b.id === currentBottleId)
            const compensation = selectedBottle?.type === 'reusable'
              ? compensationLabel(selectedBottle.rollsDeveloped) : ''

            return (
              <div key={developStep.id}>
                <p className="text-xs text-sub mb-1">{developStep.name}</p>
                {availableBottles.length > 0 ? (
                  <>
                    <select
                      className="select select-sm select-bordered w-full"
                      value={currentBottleId}
                      onChange={(e) => setSlotSelection(developStep.id, e.target.value || null)}
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
                    {compensation && (
                      <p className={`text-xs mt-1 ${compensation.startsWith('⚠️') ? 'text-warning' : 'text-info'}`}>
                        {compensation}
                      </p>
                    )}
                  </>
                ) : bath?.role === 'stop' ? (
                  <div className="text-xs text-info flex items-center gap-1.5">
                    <span>💧 Will use water rinse (fallback)</span>
                    <button className="btn btn-ghost btn-xs text-sub" onClick={() => navigate('/my-kit')}>Add bottle →</button>
                  </div>
                ) : (
                  <div className="text-xs text-sub flex items-center gap-2">
                    <span>No bottles in inventory</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => navigate('/my-kit')}>Add bottle →</button>
                  </div>
                )}
              </div>
            )
          }) : (
            <p className="text-xs text-sub">No steps require a bottle</p>
          )}
        </CollapsibleCard>

        {/* ── 2. Equipment (collapsible) ── */}
        {equipmentOverride && (
          <CollapsibleCard
            icon={<Settings2 size={14} />}
            title="Equipment"
            summary={equipmentSummary}
            badge={
              isEquipmentOverridden
                ? <span className="badge badge-warning badge-xs">custom</span>
                : undefined
            }
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-sub">Tank</p>
              <div className="join">
                {(['paterson', 'stainless', 'jobo', 'other'] as EquipmentProfile['tankType'][]).map((t) => (
                  <button key={t} className={`join-item btn btn-xs ${equipmentOverride.tankType === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setEquipmentIsFromSettings(false); setEquipmentOverride({ ...equipmentOverride, tankType: t }) }}>
                    {tankLabel(t)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-sub">Agitation</p>
              <div className="join">
                {(['inversion', 'rotation', 'rotary', 'stand'] as EquipmentProfile['agitationMethod'][]).map((a) => (
                  <button key={a} className={`join-item btn btn-xs ${equipmentOverride.agitationMethod === a ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setEquipmentIsFromSettings(false); setEquipmentOverride({ ...equipmentOverride, agitationMethod: a }) }}>
                    {agitationLabel(a)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-sub">Pre-soak</p>
              <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={equipmentOverride.usesPreSoak} onChange={(e) => { setEquipmentIsFromSettings(false); setEquipmentOverride({ ...equipmentOverride, usesPreSoak: e.target.checked }) }} />
            </div>
            {isEquipmentOverridden && (
              <p className="text-xs text-sub opacity-60">
                From Settings: {tankLabel(kit.equipment.tankType, kit.equipment.tankLabel)} · {agitationLabel(kit.equipment.agitationMethod)}
              </p>
            )}
          </CollapsibleCard>
        )}

        {/* ── 3. Film format + Rolls ── */}
        <div className="card bg-base-200 mb-3">
          <div className="card-body py-4 px-5 gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-sub">Film Format</p>
              <div className="join">
                {(['35mm', '120', '4x5'] as FilmFormat[]).map((f) => (
                  <button key={f} className={`join-item btn btn-xs ${filmFormat === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilmFormat(f)}>{f}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-sub">Number of Rolls</p>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setRolls((r) => Math.max(1, r - 1))} disabled={rolls <= 1}><Minus size={12} /></button>
                <span className="text-sm font-semibold tabular-nums w-6 text-center">{rolls}</span>
                <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setRolls((r) => Math.min(12, r + 1))} disabled={rolls >= 12}><Plus size={12} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Dev type ── */}
        <div className="card bg-base-200 mb-3">
          <div className="card-body py-4 px-5">
            <p className="text-xs text-sub mb-2">Development Type</p>
            <div className="join w-full">
              {devTypes.map((t) => (
                <button key={t} className={`join-item btn btn-sm flex-1 ${devType === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDevType(t)}>{t}</button>
              ))}
            </div>
            {pushPullWarn && (
              <p className="text-xs text-warning mt-2">
                ⚠️ Push/Pull with multiple rolls — rolls with different push values should be developed in separate sessions
              </p>
            )}
          </div>
        </div>

        {/* ── 5. Temperature ── */}
        <div className="card bg-base-200 mb-4">
          <div className="card-body py-4 px-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-sub">Chemical temperature</p>
              {temps.length > 0 ? (
                <select className="select select-sm select-bordered w-28 text-right" value={validTemp} onChange={(e) => setTemp(Number(e.target.value))} aria-label="Chemical temperature">
                  {temps.map((t) => <option key={t} value={t}>{t} °C</option>)}
                </select>
              ) : (
                <span className="text-muted text-sm">— °C</span>
              )}
            </div>
            {temps.length > 0 && (
              <p className="text-xs text-sub">Measure actual temp before starting — directly affects developer time</p>
            )}
          </div>
        </div>

        {/* ── 6. Steps ── */}
        <p className="text-xs text-sub uppercase tracking-widest pb-2">
          All steps <span className="normal-case">(tap to customise time)</span>
        </p>
        <div className="flex flex-col gap-1">
          {recipe.develop_steps.map((step) => {
            const dur = computeEffectiveDuration(step, devType, validTemp, stepOverrides)
            const isCustom = step.id in stepOverrides
            return (
              <div key={step.id} className="flex items-center gap-3 bg-base-200 rounded-xl px-4 py-3">
                <div className={`w-1 self-stretch rounded-full ${stepColor(step.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.name}</p>
                  {isCustom && <p className="text-xs text-warning mt-0.5">custom</p>}
                </div>
                <span className={`text-sm font-mono font-semibold ${isCustom ? 'text-warning' : stepColor(step.type)} text-right`}>
                  {step.duration_seconds === 'variable' ? '—' : formatTime(dur)}
                </span>
                {step.duration_seconds !== 'variable' && (
                  <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setEditingStep(step)} aria-label={`Edit time for ${step.name}`}>
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-base-100/90 backdrop-blur-sm border-t border-base-300">
        {developerSlotEmpty && (
          <p className="text-xs text-error text-center mb-2">
            Select a developer bottle before starting — required for film development
          </p>
        )}
        {nonDevSlotEmpty && !developerSlotEmpty && (
          <p className="text-xs text-warning text-center mb-2">
            ⚠️ Some slots are empty — usage won't be tracked for unselected chemicals
          </p>
        )}
        <button
          className="btn btn-primary w-full btn-lg"
          onClick={handleStart}
          disabled={developerSlotEmpty}
        >
          Start developing →
        </button>
      </div>

      {editingStep && (
        <EditTimeSheet
          step={editingStep}
          currentSeconds={computeEffectiveDuration(editingStep, devType, validTemp, stepOverrides)}
          defaultSeconds={computeEffectiveDuration(editingStep, devType, validTemp, {})}
          onSave={(s) => { setStepOverride(editingStep.id, s); setEditingStep(null) }}
          onSaveReset={() => { removeStepOverride(editingStep.id); setEditingStep(null) }}
          onClose={() => setEditingStep(null)}
        />
      )}

      <ConfirmLeaveModal
        open={showLeaveModal}
        title="Leave this page?"
        message="Any time edits you've made will be discarded"
        confirmLabel="Leave — discard edits"
        cancelLabel="Stay"
        onConfirm={() => { clearStepOverrides(); navigate('/develop/recipe') }}
        onCancel={() => setShowLeaveModal(false)}
      />
    </div>
  )
}

function stepColor(type: DevelopStep['type']): string {
  switch (type) {
    case 'developer': return 'text-primary'
    case 'activator': return 'text-secondary'
    case 'stop': return 'text-warning'
    case 'fixer': return 'text-accent'
    case 'wash': case 'rinse': return 'text-info'
    default: return 'text-muted'
  }
}
