// pages/mixing/SelectionScreenPage.tsx — 08 · Mixing: Selection Screen
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useMixingStore } from '../../store/mixingStore'
import { useUnit } from '../../hooks/useUnit'
import type { MixingMode } from '../../types/settings'

export default function SelectionScreenPage() {
  const navigate = useNavigate()
  const { recipe, selectedBathIds, targetVolumeMl, mode,
    setSelectedBaths, setTargetVolume, setMode } = useMixingStore()
  const { unit } = useUnit()

  if (!recipe) { navigate('/mixing/recipe'); return null }

  function toggleBath(id: string) {
    if (selectedBathIds.includes(id)) {
      setSelectedBaths(selectedBathIds.filter((b) => b !== id))
    } else {
      setSelectedBaths([...selectedBathIds, id])
    }
  }

  function handleStart() {
    navigate('/mixing/shopping')
  }

  const modes: { value: MixingMode; label: string; desc: string }[] = [
    { value: 'prep', label: 'Prep Mode', desc: 'Measure all steps first, then mix at once' },
    { value: 'step-by-step', label: 'Step-by-Step', desc: 'Measure and mix one step at a time' },
  ]

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={`${recipe.name.split(' + ')[0]} — Mixing Guide`}
        onBack={() => navigate('/mixing/recipe')}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 pt-3">
        {/* Bath selection */}
        <p className="text-xs text-sub uppercase tracking-widest pb-2">
          Select process steps to mix
        </p>
        <div className="flex flex-col gap-1 mb-5">
          {recipe.baths.filter((b) => b.mixing_required).map((bath) => (
            <label
              key={bath.id}
              className="flex items-center gap-4 bg-base-200 rounded-xl px-4 py-4 cursor-pointer hover:bg-base-300 transition-colors"
            >
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={selectedBathIds.includes(bath.id)}
                onChange={() => toggleBath(bath.id)}
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{bath.name}</p>
                <p className="text-xs text-sub">
                  {(bath.chemicals ?? []).map((c) => c.name).join(' + ')}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Target volume */}
        <p className="text-xs text-sub uppercase tracking-widest pb-2">
          Target Volume
        </p>
        <div className="card bg-base-200 mb-5">
          <div className="card-body py-4 px-5">
            {(() => {
              const ML_TO_FLOZ = 0.033814
              const FLOZ_TO_ML = 29.5735
              const isImperial = unit === 'imperial'
              const displayValue = isImperial
                ? Math.round(targetVolumeMl * ML_TO_FLOZ * 10) / 10
                : targetVolumeMl
              const unitLabel = isImperial ? 'fl oz' : 'ml'
              const minVal = isImperial ? 3.4 : 100
              const maxVal = isImperial ? 169 : 5000
              const stepVal = isImperial ? 1 : 100
              return (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={minVal}
                    max={maxVal}
                    step={stepVal}
                    value={displayValue}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setTargetVolume(isImperial ? Math.round(v * FLOZ_TO_ML) : v)
                    }}
                    className="input input-bordered w-28 text-right font-bold text-lg"
                  />
                  <span className="text-sm font-medium text-sub">{unitLabel}</span>
                </div>
              )
            })()}
            <p className="text-xs text-sub mt-1">
              All chemicals will be scaled to this volume
            </p>
          </div>
        </div>

        {/* Mode */}
        <p className="text-xs text-sub uppercase tracking-widest pb-2">Mixing mode</p>
        <div className="grid grid-cols-2 gap-2">
          {modes.map(({ value, label, desc }) => (
            <button
              key={value}
              className={`card border-2 text-left p-4 transition-all h-auto ${
                mode === value
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 bg-base-200 hover:border-primary/40'
              }`}
              onClick={() => setMode(value)}
            >
              <p className="font-semibold text-sm mb-1">{label}</p>
              <p className="text-xs text-sub leading-relaxed">{desc}</p>
              {mode === value && (
                <span className="badge badge-primary badge-xs mt-2">✓ Selected</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-base-100/90 backdrop-blur-sm border-t border-base-300">
        <button
          className="btn btn-primary w-full btn-lg"
          disabled={selectedBathIds.length === 0}
          onClick={handleStart}
        >
          Start mixing →
        </button>
      </div>
    </div>
  )
}
