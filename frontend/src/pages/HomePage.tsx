// pages/HomePage.tsx — 01 · Home
import { useNavigate } from 'react-router-dom'
import { Settings, Layers, ChevronRight } from 'lucide-react'
import { recipes } from '../data'
import { useDevelopStore } from '../store/developStore'

export default function HomePage() {
  const navigate = useNavigate()
  const setRecipe = useDevelopStore((s) => s.setRecipe)
  const lastRecipe = recipes[0]  // Phase 1: always Divided D-23

  function startDevelop() {
    navigate('/develop/recipe')
  }

  function startMixing() {
    navigate('/mixing/recipe')
  }

  function openRecent() {
    setRecipe(lastRecipe)
    navigate('/develop/preview')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status bar placeholder */}
      <div className="navbar bg-base-100 border-b border-base-300 px-4 sticky top-0 z-10">
        <div className="flex-1">
          <span className="text-base font-semibold flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            🎞 Film Dev Guidance
          </span>
        </div>
        <button
          className="btn btn-ghost btn-sm btn-circle"
          onClick={() => navigate('/settings')}
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-6">
        {/* Hero */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold leading-tight text-base-content">
            B&W Film Development<br />Guide & Timer
          </h1>
          <p className="text-sm text-sub mt-1">
            step-by-step · real-time timer · offline
          </p>
        </div>

        {/* Main actions */}
        <div className="flex flex-col gap-3">
          <button
            className="btn bg-base-200 hover:bg-base-300 border-none btn-lg justify-start gap-4 h-auto py-4 px-5"
            onClick={startDevelop}
          >
            <span className="text-xl">🎞</span>
            <div className="text-left">
              <div className="font-semibold text-base">ล้างฟิล์ม</div>
              <div className="text-xs text-sub font-normal">พร้อม timer และ agitation reminder</div>
            </div>
          </button>

          <button
            className="btn bg-base-200 hover:bg-base-300 border-none btn-lg justify-start gap-4 h-auto py-4 px-5"
            onClick={startMixing}
          >
            <span className="text-xl">🧪</span>
            <div className="text-left">
              <div className="font-semibold text-base">ผสมน้ำยา</div>
              <div className="text-xs text-sub font-normal">step-by-step checklist · ไม่มี timer กดดัน</div>
            </div>
          </button>
        </div>

        {/* Recent recipe */}
        <div>
          <p className="text-xs text-sub mb-2 uppercase tracking-wide">สูตรที่ใช้ล่าสุด</p>
          <button
            className="card bg-base-200 w-full text-left hover:bg-base-300 transition-colors"
            onClick={openRecent}
          >
            <div className="card-body py-4 px-5 flex-row items-center justify-between">
              <div>
                <div className="font-semibold text-sm">{lastRecipe.name}</div>
                <div className="text-xs text-sub mt-0.5">
                  Two-Bath · {lastRecipe.optimal_temp_range.min}–{lastRecipe.optimal_temp_range.max}°C · B&W all ISO
                </div>
              </div>
              <ChevronRight size={16} className="text-sub shrink-0" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
