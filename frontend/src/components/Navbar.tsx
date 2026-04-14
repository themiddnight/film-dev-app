// components/Navbar.tsx — shared top navbar
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type Props = {
  title: string
  subtitle?: string         // secondary text below title
  step?: string             // progress label shown right-aligned e.g. "2/4"
  showBack?: boolean
  onBack?: () => void       // override default navigate(-1)
  left?: React.ReactNode    // slot for left icon on top-level pages
  right?: React.ReactNode   // slot for right icon
}

export default function Navbar({ title, subtitle, step, showBack = true, onBack, left, right }: Props) {
  const navigate = useNavigate()
  const handleBack = onBack ?? (() => navigate(-1))

  return (
    <div className="bg-base-200/80 backdrop-blur-sm sticky top-0 z-30 border-b border-base-300 min-h-14 px-4">
      <div className="h-14 grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2">
        <div className="w-10 flex items-center justify-center">
          {showBack ? (
            <button className="btn btn-ghost btn-sm btn-circle" onClick={handleBack} aria-label="Go back">
              <ArrowLeft size={20} />
            </button>
          ) : (
            left
          )}
        </div>

        <div className="min-w-0 flex flex-col items-start overflow-hidden">
          <span className="font-semibold text-base truncate w-full">{title}</span>
          {subtitle && (
            <span className="text-xs text-sub truncate w-full">{subtitle}</span>
          )}
        </div>

        <div className="justify-self-end flex items-center justify-end gap-2 text-right">
          {step && (
            <span className="text-xs text-sub font-medium">{step}</span>
          )}
          {right}
        </div>
      </div>
    </div>
  )
}
