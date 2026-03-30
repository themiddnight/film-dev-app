// pages/mixing/ShoppingListPage.tsx — 09/10 · Shopping List (Prep & SBS)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import ConfirmLeaveModal from '../../components/ConfirmLeaveModal'
import { useMixingStore } from '../../store/mixingStore'
import { useUnit } from '../../hooks/useUnit'

export default function ShoppingListPage() {
  const navigate = useNavigate()
  const {
    recipe, mode, currentBathIndex, selectedBathIds,
    prepChecked, togglePrepItem, prepComplete,
    selectedBaths, currentBath, scaledAmount, advanceToMix,
  } = useMixingStore()
  const { formatAmount } = useUnit()
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  if (!recipe) { navigate('/mixing/recipe'); return null }

  const anyChecked = Object.values(prepChecked).some(Boolean)

  // Prep Mode: show all selected baths grouped
  // SBS Mode: show only current bath
  const bathsToShow = mode === 'prep' ? selectedBaths() : [currentBath()].filter(Boolean) as typeof selectedBaths extends () => infer R ? R : never

  const isComplete = prepComplete()

  function handleNext() {
    if (mode === 'step-by-step') {
      advanceToMix()
    }
    navigate('/mixing/checklist')
  }

  const navTitle = mode === 'prep'
    ? 'PREP — ชั่ง/ตวงให้ครบก่อน'
    : `PREP — ${currentBath()?.name ?? ''}`

  const progressLabel = mode === 'step-by-step'
    ? `${currentBathIndex + 1}/${selectedBathIds.length}`
    : undefined

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={navTitle}
        subtitle={progressLabel}
        onBack={() => anyChecked ? setShowLeaveModal(true) : navigate('/mixing/selection')}
      />

      {/* Phase indicator */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-primary">PREP</span>
          <span className="text-muted">──────────────</span>
          <span className="text-muted">MIX</span>
        </div>
      </div>

      <div className="alert alert-info py-2 px-4 mx-4 mb-2 text-sm rounded-xl">
        <span>ชั่ง/ตวงสารเคมีทุกรายการให้ครบก่อนเริ่มผสม</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24">
        {bathsToShow.map((bath) => (
          <div key={bath.id} className="mb-5">
            <div className="flex justify-between items-baseline mb-2">
              <p className="font-semibold text-sm">{bath.name}</p>
              <p className="text-xs text-sub">
                {scaledAmount(recipe.base_volume_ml) > 0
                  ? `${useMixingStore.getState().targetVolumeMl} ml`
                  : ''}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              {bath.chemicals.map((chem, i) => {
                const key = `${bath.id}-${i}`
                const scaled = scaledAmount(chem.amount_per_liter)
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                      prepChecked[key] ? 'bg-success/10 border border-success/30' : 'bg-base-200 hover:bg-base-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-success mt-0.5"
                      checked={!!prepChecked[key]}
                      onChange={() => togglePrepItem(key)}
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${prepChecked[key] ? 'line-through text-muted' : ''}`}>
                        {chem.name}
                      </p>
                      {chem.note && (
                        <p className="text-xs text-sub mt-0.5">{chem.note}</p>
                      )}
                    </div>
                    <span className="text-sm font-mono font-semibold shrink-0 text-primary">
                      {formatAmount(scaled, chem.unit)}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}

        {/* Progress summary */}
        {isComplete && (
          <div className="alert alert-success text-sm mb-4">
            <span>✓ เตรียมครบแล้ว พร้อมผสม!</span>
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
          {mode === 'prep'
            ? 'ชั่ง/ตวงครบแล้ว → เริ่มผสม'
            : `ชั่งครบแล้ว → เริ่มผสม ${currentBath()?.name ?? ''}`}
        </button>
        {!isComplete && (
          <p className="text-xs text-center text-sub mt-1">
            (active เมื่อ tick ครบทุกรายการ)
          </p>
        )}
      </div>

      <ConfirmLeaveModal
        open={showLeaveModal}
        title="ออกจากการเตรียม?"
        message="tick ที่ทำไว้จะหายไปทั้งหมด"
        confirmLabel="ออก"
        cancelLabel="อยู่ต่อ"
        onConfirm={() => navigate('/mixing/selection')}
        onCancel={() => setShowLeaveModal(false)}
      />
    </div>
  )
}
