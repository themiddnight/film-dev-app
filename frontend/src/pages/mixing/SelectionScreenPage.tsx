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
    { value: 'prep', label: 'Prep Mode', desc: 'ชั่ง/ตวงทุก step ก่อน แล้วผสมรวด' },
    { value: 'step-by-step', label: 'Step-by-Step', desc: 'เตรียม + ผสม ทีละ step' },
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
          เลือก Process Steps ที่จะผสม
        </p>
        <div className="flex flex-col gap-1 mb-5">
          {recipe.baths.map((bath) => (
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
                  {bath.chemicals.map((c) => c.name).join(' + ')}
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
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={100}
                max={5000}
                step={100}
                value={targetVolumeMl}
                onChange={(e) => setTargetVolume(Number(e.target.value))}
                className="input input-bordered w-28 text-right font-bold text-lg"
              />
              <div className="join">
                <button className={`join-item btn btn-sm ${unit === 'metric' ? 'btn-primary' : 'btn-ghost'}`}>
                  ml
                </button>
                <button className={`join-item btn btn-sm ${unit === 'imperial' ? 'btn-primary' : 'btn-ghost'}`}>
                  oz
                </button>
              </div>
            </div>
            <p className="text-xs text-sub mt-1">
              สารเคมีทุกตัวจะ scale ตามปริมาณนี้
            </p>
          </div>
        </div>

        {/* Mode */}
        <p className="text-xs text-sub uppercase tracking-widest pb-2">วิธีการเตรียม</p>
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
                <span className="badge badge-primary badge-xs mt-2">✓ เลือก</span>
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
          เริ่มผสม →
        </button>
      </div>
    </div>
  )
}
