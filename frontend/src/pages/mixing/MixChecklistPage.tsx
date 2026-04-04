// pages/mixing/MixChecklistPage.tsx — 11 · Mix Checklist
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus } from 'lucide-react'
import Navbar from '../../components/Navbar'
import ConfirmLeaveModal from '../../components/ConfirmLeaveModal'
import { useMixingStore, computeMixComplete } from '../../store/mixingStore'
import { useUnit } from '../../hooks/useUnit'
import { useKitStore } from '../../store/kitStore'

// ── My Kit Prompt (หลัง developer bath Done) ──────────────────────────────────
type AddBottleSheetProps = {
  developerName: string
  existingBottleId: string | null  // ถ้ามีขวดชื่อเดิมอยู่แล้ว
  existingBottleName: string | null
  onAddNew: () => void
  onUpdateExisting: () => void
  onSkip: () => void
}

function MyKitPrompt({
  developerName,
  existingBottleId,
  existingBottleName,
  onAddNew,
  onUpdateExisting,
  onSkip,
}: AddBottleSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="bg-base-100 rounded-t-[14px] px-5 pt-5 pb-8 w-full max-w-[430px]"
        style={{ animation: 'slideUp 300ms cubic-bezier(0.32,0.72,0,1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Plus size={18} className="text-primary" />
          <h3 className="font-bold text-base">Save to Inventory?</h3>
        </div>
        <p className="text-sm text-sub mb-4">
          {developerName} — mixing complete
        </p>

        <div className="flex flex-col gap-2">
          {existingBottleId && (
            <button
              className="btn btn-outline btn-primary w-full"
              onClick={onUpdateExisting}
            >
              Update existing bottle ({existingBottleName})
            </button>
          )}
          <button
            className="btn btn-primary w-full"
            onClick={onAddNew}
          >
            {existingBottleId ? 'Add as new bottle' : 'Save as new bottle'}
          </button>
          <button className="btn btn-ghost w-full" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MixChecklistPage() {
  const navigate = useNavigate()
  const {
    recipe, mode, currentBathIndex, selectedBathIds,
    mixChecked, toggleMixItem,
    currentBath, scaledAmount, advanceToBath, reset,
  } = useMixingStore()
  useUnit() // used via resolveInstruction
  const { kit, loadKit, addBottle, updateBottle } = useKitStore()
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showKitPrompt, setShowKitPrompt] = useState(false)

  // Load kit เพื่อเช็คขวดที่มีอยู่
  useEffect(() => { loadKit() }, [loadKit])

  if (!recipe) { navigate('/mixing/recipe'); return null }

  const bath = currentBath()
  if (!bath) { navigate('/mixing/selection'); return null }

  const anyChecked = Object.values(mixChecked).some(Boolean)
  const isComplete = computeMixComplete(bath, mixChecked)
  const isLastBath = currentBathIndex + 1 >= selectedBathIds.length

  // ทุก bath ที่มี mixing_required → prompt เพิ่ม inventory (ไม่จำกัดแค่ developer)
  const isMixingBath = bath.mixing_required === true
  // ชื่อขวดที่บันทึก: "Divided D-23 Bath A", "Divided D-23 Stop Bath"
  // bath.name = "Bath A — Developer" → shortName = "Bath A"
  const bathShortName = bath.name.replace(/\s*—.*$/, '').trim()
  const bottleName = `${recipe.name.split(' + ')[0]} ${bathShortName}`
  const existingBottle = isMixingBath
    ? kit.bottles.find((b) =>
        b.developerName.toLowerCase() === bottleName.toLowerCase()
      ) ?? null
    : null

  // Resolve template variables in instruction text
  // Variables correspond to chemical amount_per_liter values for each recipe
  function resolveInstruction(text: string): string {
    const vol = useMixingStore.getState().targetVolumeMl

    // Build a lookup from all chemicals in the current bath
    const chemLookup: Record<string, number> = {}
    if (bath) {
      for (const chem of (bath.chemicals ?? [])) {
        chemLookup[chem.name.toLowerCase().replace(/[^a-z0-9]/g, '_')] = scaledAmount(chem.amount_per_liter)
      }
    }

    return text
      .replace(/{target_volume}/g, String(vol))
      .replace(/{volume_75pct}/g, String(Math.round(vol * 0.75)))
      .replace(/{volume_50pct}/g, String(Math.round(vol * 0.5)))
      // Divided D-23
      .replace(/{metol}/g, String(scaledAmount(7.5)))
      .replace(/{sodium_sulphite}/g, String(scaledAmount(100)))
      .replace(/{sodium_sulphite_fixer}/g, String(scaledAmount(15)))
      .replace(/{borax}/g, String(scaledAmount(10)))
      .replace(/{potassium_metabisulphite}/g, String(scaledAmount(22.5)))
      .replace(/{sodium_thiosulphate}/g, String(scaledAmount(250)))
      // D-76
      .replace(/{metol_d76}/g, String(scaledAmount(2)))
      .replace(/{hydroquinone}/g, String(scaledAmount(5)))
      .replace(/{borax_d76}/g, String(scaledAmount(2)))
      // HC-110 — volume-based
      .replace(/{hc110_concentrate}/g, String(Math.round(vol / 32)))  // 1:31 → ~32ml per liter
      .replace(/{hc110_water}/g, String(vol - Math.round(vol / 32)))
  }

  function proceedAfterKit() {
    if (isLastBath) {
      reset()
      navigate('/')
    } else {
      advanceToBath()
      if (mode === 'step-by-step') {
        navigate('/mixing/shopping')
      } else {
        navigate('/mixing/checklist')
      }
    }
  }

  function handleNext() {
    // ทุก bath ที่ผสมจริง (mixing_required) → prompt เพิ่ม inventory
    if (isMixingBath) {
      setShowKitPrompt(true)
    } else {
      proceedAfterKit()
    }
  }

  async function handleKitAddNew() {
    await addBottle({
      developerName: bottleName,
      role: bath!.role,
      // one-shot สำหรับ stop/fixer ที่มักไม่ reuse ข้ามสูตร
      // developer → reusable เป็น default ที่สมเหตุสมผล
      type: bath!.role === 'developer' ? 'reusable' : 'one-shot',
      mixedAt: new Date().toISOString(),
      rollsDeveloped: 0,
    })
    setShowKitPrompt(false)
    proceedAfterKit()
  }

  async function handleKitUpdateExisting() {
    if (!existingBottle) return
    await updateBottle(existingBottle.id, {
      mixedAt: new Date().toISOString(),
      rollsDeveloped: 0,
    })
    setShowKitPrompt(false)
    proceedAfterKit()
  }

  function handleKitSkip() {
    setShowKitPrompt(false)
    proceedAfterKit()
  }

  const navTitle = `MIX — ${bath.name}`
  const progressLabel = `${currentBathIndex + 1}/${selectedBathIds.length}`

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={navTitle}
        step={progressLabel}
        onBack={() => anyChecked ? setShowLeaveModal(true) : navigate('/mixing/shopping')}
      />

      {/* Phase indicator */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">PREP ✓</span>
          <span className="text-muted">──────────────</span>
          <span className="font-bold text-primary">MIX</span>
        </div>
      </div>

      <p className="text-sm text-sub px-4 pb-2">Follow the steps below to mix</p>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24">
        <div className="flex flex-col gap-2">
          {(bath.mixing_steps ?? []).map((step, i) => {
            const key = `${bath.id}-step-${i}`
            const checked = !!mixChecked[key]
            return (
              <div key={key}>
                <label
                  className={`flex items-start gap-3 rounded-xl px-4 py-4 cursor-pointer transition-colors ${
                    checked ? 'bg-success/10 border border-success/30' : 'bg-base-200 hover:bg-base-300'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    checked ? 'bg-success text-success-content' : 'bg-primary text-primary-content'
                  }`}>
                    {checked ? '✓' : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm leading-relaxed ${checked ? 'line-through text-muted' : ''}`}>
                      {resolveInstruction(step.instruction)}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-success mt-1 shrink-0"
                    checked={checked}
                    onChange={() => toggleMixItem(key)}
                  />
                </label>
                {/* Warning below step */}
                {step.warning && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-xl mx-1 mb-1 text-xs text-warning">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    {step.warning}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {isComplete && (
          <div className="alert alert-success text-sm mt-4">
            <span>✓ {bath.name} mixing complete!</span>
            {bath.storage && (
              <p className="text-xs opacity-70 mt-1">
                Store in {bath.storage.container} · {bath.storage.shelf_life}
              </p>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-base-100/90 backdrop-blur-sm border-t border-base-300">
        <button
          className="btn btn-primary w-full btn-lg"
          disabled={!isComplete}
          onClick={handleNext}
        >
          {isLastBath
            ? '✅ Done — chemicals ready to use!'
            : `Next → ${recipe.baths[currentBathIndex + 1]?.name ?? 'Next'}`}
        </button>
      </div>

      <ConfirmLeaveModal
        open={showLeaveModal}
        title="Leave mixing?"
        message="All progress will be lost"
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => navigate('/mixing/selection')}
        onCancel={() => setShowLeaveModal(false)}
      />

      {showKitPrompt && (
        <MyKitPrompt
          developerName={bottleName}
          existingBottleId={existingBottle?.id ?? null}
          existingBottleName={existingBottle?.developerName ?? null}
          onAddNew={handleKitAddNew}
          onUpdateExisting={handleKitUpdateExisting}
          onSkip={handleKitSkip}
        />
      )}
    </div>
  )
}
