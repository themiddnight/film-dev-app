// pages/develop/AllDonePage.tsx — 06 · All Done 🎉
import { useNavigate } from 'react-router-dom'
import { useDevelopStore } from '../../store/developStore'

export default function AllDonePage() {
  const navigate = useNavigate()
  const { recipe, devType, tempCelsius } = useDevelopStore()

  // Guard: no recipe means user landed here directly (refresh / direct URL)
  if (!recipe) { navigate('/'); return null }

  const totalSeconds = recipe?.develop_steps
    .filter((s) => s.duration_seconds !== 'variable')
    .reduce((acc, s) => acc + (typeof s.duration_seconds === 'number' ? s.duration_seconds : 0), 0) ?? 0
  const totalMin = Math.round(totalSeconds / 60)

  return (
    <div className="flex flex-col h-full">
      {/* Minimal header — no back */}
      <div className="navbar bg-base-200/80 backdrop-blur-sm border-b border-base-300 min-h-[56px] px-4">
        <div className="flex-1">
          <span className="font-semibold">Film Dev Guidance</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-5 pb-28 pt-12">
        <span className="text-7xl mb-4">🎞</span>
        <h1 className="text-2xl font-bold mb-1">ล้างฟิล์มเสร็จแล้ว!</h1>
        <p className="text-sub text-sm text-center">
          ผึ่งแห้งในที่ไม่มีฝุ่น 1–2 ชั่วโมง<br />ก่อนตัดฟิล์ม
        </p>

        {/* Summary card */}
        {recipe && (
          <div className="card bg-base-200 w-full mt-8">
            <div className="card-body py-4 px-5">
              <p className="text-xs text-sub uppercase tracking-widest mb-3">สรุป session</p>
              <div className="flex flex-col gap-2">
                <SummaryRow label="สูตร" value={recipe.name} />
                <SummaryRow label="อุณหภูมิ" value={`${tempCelsius}°C · ${devType}`} />
                <SummaryRow label="เวลารวม" value={`~${totalMin} นาที`} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-base-100/90 backdrop-blur-sm border-t border-base-300 flex flex-col gap-2">
        <button className="btn btn-ghost w-full" onClick={() => navigate('/develop/recipe')}>
          ล้างฟิล์มม้วนใหม่
        </button>
        <button className="btn btn-primary w-full btn-lg" onClick={() => navigate('/')}>
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-sub">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
