// pages/develop/StepPreviewPage.tsx — 03 · Step Preview
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Pencil, Plus, Minus } from 'lucide-react'
import Navbar from '../../components/Navbar'
import ConfirmLeaveModal from '../../components/ConfirmLeaveModal'
import { useDevelopStore, computeEffectiveDuration } from '../../store/developStore'
import { formatTime } from '../../hooks/useTimer'
import type { DevType } from '../../types/settings'
import type { DevelopStep } from '../../types/recipe'

// ── Edit Sheet ─────────────────────────────────────────────────────────────
function EditTimeSheet({
  step,
  currentSeconds,
  defaultSeconds,
  onSave,
  onSaveReset,
  onClose,
}: {
  step: DevelopStep
  currentSeconds: number
  defaultSeconds: number
  onSave: (s: number) => void       // บันทึกค่า custom ปกติ
  onSaveReset: () => void           // บันทึกโดย reset override ออก
  onClose: () => void
}) {
  const [minutes, setMinutes] = useState(Math.floor(currentSeconds / 60))
  const [seconds, setSeconds] = useState(currentSeconds % 60)
  const [wasReset, setWasReset] = useState(false)
  const [closing, setClosing] = useState(false)

  function handleClose() {
    setClosing(true)
  }
  useEffect(() => {
    if (!closing) return
    const t = setTimeout(onClose, 280)
    return () => clearTimeout(t)
  }, [closing, onClose])

  function handleSave() {
    if (wasReset) {
      onSaveReset()
    } else {
      onSave(minutes * 60 + seconds)
    }
    handleClose()
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-280 ${closing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div
        className="relative bg-base-100 rounded-t-[14px] px-5 pt-5 pb-8 z-10"
        style={{
          animation: closing
            ? 'slideDown 280ms cubic-bezier(0.32,0.72,0,1) forwards'
            : 'slideUp 300ms cubic-bezier(0.32,0.72,0,1)'
        }}
      >
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={handleClose}
            aria-label="ปิด"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <h3 className="font-bold text-lg mb-1">แก้เวลา — {step.name}</h3>
        <p className="text-sm text-sub mb-4">
          Default จากสูตร: {formatTime(defaultSeconds)}
          {step.temp_table ? ' (ขึ้นกับอุณหภูมิ)' : ''}
        </p>
        <div className="divider my-0 mb-4" />

        <p className="text-xs text-sub mb-3">เวลา (นาที : วินาที)</p>
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Minutes */}
          <div className="flex flex-col items-center gap-2">
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => { setMinutes((m) => Math.min(99, m + 1)); setWasReset(false) }}
              aria-label="เพิ่มนาที"
            ><Plus size={16} /></button>
            <input
              type="number"
              min={0}
              max={99}
              value={minutes}
              onChange={(e) => { setMinutes(Math.min(99, Math.max(0, Number(e.target.value)))); setWasReset(false) }}
              className="input input-bordered text-center text-3xl font-bold w-20 h-14 tabular-nums"
            />
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => { setMinutes((m) => Math.max(0, m - 1)); setWasReset(false) }}
              aria-label="ลดนาที"
            ><Minus size={16} /></button>
            <span className="text-xs text-sub">นาที</span>
          </div>

          <span className="text-3xl font-bold pb-8">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center gap-2">
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => { setSeconds((s) => s >= 59 ? 0 : s + 1); setWasReset(false) }}
              aria-label="เพิ่มวินาที"
            ><Plus size={16} /></button>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => { setSeconds(Math.min(59, Math.max(0, Number(e.target.value)))); setWasReset(false) }}
              className="input input-bordered text-center text-3xl font-bold w-20 h-14 tabular-nums"
            />
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => { setSeconds((s) => s <= 0 ? 59 : s - 1); setWasReset(false) }}
              aria-label="ลดวินาที"
            ><Minus size={16} /></button>
            <span className="text-xs text-sub">วินาที</span>
          </div>
        </div>

        <button
          className="btn btn-ghost btn-sm gap-2 mb-4"
          onClick={() => {
            setMinutes(Math.floor(defaultSeconds / 60))
            setSeconds(defaultSeconds % 60)
            setWasReset(true)
          }}
        >
          <RefreshCw size={14} />
          Reset เป็น default
        </button>

        <div className="divider my-0 mb-4" />
        <div className="flex gap-3">
          <button className="btn btn-ghost flex-1" onClick={handleClose}>ยกเลิก</button>
          <button className="btn btn-primary flex-1" onClick={handleSave}>
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Derive available temps from recipe's temp_tables ─────────────────────────
function availableTemps(steps: DevelopStep[]): number[] {
  for (const step of steps) {
    if (step.temp_table) {
      return Object.keys(step.temp_table).map(Number).sort((a, b) => a - b)
    }
  }
  return []
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function StepPreviewPage() {
  const navigate = useNavigate()
  const { recipe, devType, tempCelsius, stepOverrides, setDevType, setTemp, setStepOverride,
    removeStepOverride, clearStepOverrides, hasStepOverrides, startSession } = useDevelopStore()

  const [editingStep, setEditingStep] = useState<DevelopStep | null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  if (!recipe) {
    navigate('/develop/recipe')
    return null
  }

  const devTypes: DevType[] = ['N-1', 'N', 'N+1']
  const temps = availableTemps(recipe.develop_steps)

  // Clamp stored temp to the valid range for this recipe
  const validTemp = temps.length > 0 && !temps.includes(tempCelsius)
    ? temps.reduce((a, b) => Math.abs(b - tempCelsius) < Math.abs(a - tempCelsius) ? b : a)
    : tempCelsius

  function handleBack() {
    if (hasStepOverrides()) {
      setShowLeaveModal(true)
    } else {
      navigate('/develop/recipe')
    }
  }

  function handleStart() {
    startSession()
    navigate('/develop/timer')
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={recipe.name.split(' + ')[0]}
        onBack={handleBack}
        right={
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => { clearStepOverrides() }}
            title="Reset ค่าทั้งหมด"
          >
            <RefreshCw size={16} />
          </button>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24">
        {/* Config section */}
        <p className="text-xs text-sub uppercase tracking-widest pt-4 pb-2">การตั้งค่า</p>

        <div className="card bg-base-200 mb-3">
          <div className="card-body py-4 px-5">
            <p className="text-xs text-sub mb-2">Development Type</p>
            <div className="join w-full">
              {devTypes.map((t) => (
                <button
                  key={t}
                  className={`join-item btn btn-sm flex-1 ${devType === t ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDevType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 mb-4">
          <div className="card-body py-4 px-5 flex-row items-center justify-between">
            <div>
              <p className="text-xs text-sub mb-0.5">อุณหภูมิน้ำยา</p>
              {/* <p className="text-xs text-sub">
                {recipe.optimal_temp_range.min}–{recipe.optimal_temp_range.max}°C แนะนำ
              </p> */}
            </div>
            {temps.length > 0 ? (
              <select
                className="select select-sm select-bordered w-28 text-right"
                value={validTemp}
                onChange={(e) => setTemp(Number(e.target.value))}
                aria-label="อุณหภูมิน้ำยา"
              >
                {temps.map((t) => (
                  <option key={t} value={t}>{t} °C</option>
                ))}
              </select>
            ) : (
              <span className="text-muted text-sm">— °C</span>
            )}
          </div>
        </div>

        {/* Step list */}
        <p className="text-xs text-sub uppercase tracking-widest pb-2">
          ขั้นตอนทั้งหมด{' '}
          <span className="normal-case text-sub">(กดเพื่อ custom เวลา)</span>
        </p>

        <div className="flex flex-col gap-1">
          {recipe.develop_steps.map((step) => {
            const dur = computeEffectiveDuration(step, devType, validTemp, stepOverrides)
            const isCustom = step.id in stepOverrides
            return (
              <div
                key={step.id}
                className="flex items-center gap-3 bg-base-200 rounded-xl px-4 py-3"
              >
                <div className={`w-1 self-stretch rounded-full ${stepColor(step.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.name}</p>
                  {isCustom && (
                    <p className="text-xs text-warning mt-0.5">custom</p>
                  )}
                </div>
                <span className={`text-sm font-mono font-semibold ${isCustom ? 'text-warning' : stepColor(step.type)} text-right`}>
                  {step.duration_seconds === 'variable' ? '—' : formatTime(dur)}
                </span>
                {step.duration_seconds !== 'variable' && (
                  <button
                    className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => setEditingStep(step)}
                    aria-label={`แก้เวลา ${step.name}`}
                  >
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
        <button className="btn btn-primary w-full btn-lg" onClick={handleStart}>
          เริ่มล้างฟิล์ม →
        </button>
      </div>

      {/* Edit bottom sheet */}
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

      {/* Confirm leave */}
      <ConfirmLeaveModal
        open={showLeaveModal}
        title="ออกจากหน้านี้?"
        message="การแก้ไขเวลาที่ทำไว้จะถูกยกเลิก"
        confirmLabel="ออก — ยกเลิกการแก้ไข"
        cancelLabel="อยู่ต่อ"
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
