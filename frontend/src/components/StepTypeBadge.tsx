// components/StepTypeBadge.tsx
// Color-coded badge for each recipe step type
import type { RecipeStepType } from '@/types/recipe'

type StepTypeBadgeProps = {
  stepType: RecipeStepType | string | undefined | null
  className?: string
}

const CONFIG: Record<string, { label: string; cls: string }> = {
  developer:     { label: 'Dev',     cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  stop:          { label: 'Stop',    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  fixer:         { label: 'Fix',     cls: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  wash_aid:      { label: 'Wash',    cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  wetting_agent: { label: 'Wet',     cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
}

export default function StepTypeBadge({ stepType, className = '' }: StepTypeBadgeProps) {
  const key = stepType ?? ''
  const config = CONFIG[key] ?? { label: key || '?', cls: 'bg-base-300 text-sub border-base-300' }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${config.cls} ${className}`}
    >
      {config.label}
    </span>
  )
}
