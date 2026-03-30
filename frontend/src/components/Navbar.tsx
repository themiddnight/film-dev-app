// components/Navbar.tsx — shared top navbar
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type Props = {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void       // override default navigate(-1)
  right?: React.ReactNode   // slot for right icon
}

export default function Navbar({ title, subtitle, showBack = true, onBack, right }: Props) {
  const navigate = useNavigate()
  const handleBack = onBack ?? (() => navigate(-1))

  return (
    <div className="navbar bg-base-200/80 backdrop-blur-sm sticky top-0 z-30 border-b border-base-300 min-h-[56px] px-4">
      <div className="navbar-start w-10">
        {showBack && (
          <button className="btn btn-ghost btn-sm btn-circle" onClick={handleBack} aria-label="ย้อนกลับ">
            <ArrowLeft size={20} />
          </button>
        )}
      </div>

      <div className="navbar-center flex flex-col items-center overflow-hidden">
        <span className="font-semibold text-base truncate max-w-[200px]">{title}</span>
        {subtitle && (
          <span className="text-xs text-sub truncate max-w-[200px]">{subtitle}</span>
        )}
      </div>

      <div className="navbar-end w-10">
        {right}
      </div>
    </div>
  )
}
