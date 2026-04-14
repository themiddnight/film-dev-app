// components/BottomSheet.tsx — shared bottom drawer sheet
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  title: string
  onClose: () => void
  /** Buttons at the bottom (e.g. Cancel + Save). Rendered in a sticky footer. */
  actions: ReactNode
  children: ReactNode
}

export default function BottomSheet({ title, onClose, actions, children }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={onClose}
    >
      {/* Sheet panel — stop propagation so clicks inside don't close it */}
      <div
        className="w-full bg-base-100 rounded-t-2xl flex flex-col max-h-[85dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h3 className="font-semibold text-base">{title}</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2 space-y-3">
          {children}
        </div>

        {/* Sticky action footer */}
        <div className="shrink-0 px-4 py-3 border-t border-base-300 flex gap-2">
          {actions}
        </div>
      </div>
    </div>
  )
}
