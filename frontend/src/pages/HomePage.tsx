// pages/HomePage.tsx — entry point / launcher
import { useNavigate } from 'react-router-dom'
import { Timer, FlaskConical, Package, BookOpen, Settings, ChevronRight } from 'lucide-react'

type NavCard = {
  to: string
  icon: typeof Timer
  label: string
  description: string
  size: 'hero' | 'secondary' | 'tertiary'
}

const cards: NavCard[] = [
  {
    to: '/dev',
    icon: Timer,
    label: 'Develop',
    description: 'Start a development session. Set your parameters and let the timer guide you through each step.',
    size: 'hero',
  },
  {
    to: '/mix',
    icon: FlaskConical,
    label: 'Mix',
    description: 'Mix chemicals with step-by-step guidance.',
    size: 'secondary',
  },
  {
    to: '/kits',
    icon: Package,
    label: 'My Kit',
    description: 'Manage your chemical bottles and kit presets.',
    size: 'secondary',
  },
  {
    to: '/recipes',
    icon: BookOpen,
    label: 'Recipes',
    description: 'Browse and create development recipes',
    size: 'tertiary',
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Settings',
    description: 'Preferences and app configuration',
    size: 'tertiary',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  const hero = cards.find((c) => c.size === 'hero')!
  const secondary = cards.filter((c) => c.size === 'secondary')
  const tertiary = cards.filter((c) => c.size === 'tertiary')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-base-100 sticky top-0 z-30 border-b border-base-300 px-5 pt-5 pb-4">
        <p className="text-xs font-medium text-sub uppercase tracking-widest mb-0.5">B&amp;W Film</p>
        <h1 className="text-2xl font-bold tracking-tight">Develop</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">

        {/* Hero — Dev */}
        <button
          onClick={() => navigate(hero.to)}
          className="w-full text-left rounded-2xl bg-primary text-primary-content p-5 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-content/15 flex items-center justify-center shrink-0">
              <hero.icon size={24} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60 mb-1">Start here</p>
              <p className="text-xl font-bold mb-1.5">{hero.label}</p>
              <p className="text-sm opacity-75 leading-relaxed">{hero.description}</p>
            </div>
          </div>
        </button>

        {/* Secondary — Mix + My Kit */}
        <div className="grid grid-cols-2 gap-3">
          {secondary.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className="text-left rounded-2xl bg-base-200 hover:bg-base-300 active:scale-[0.97] transition-all p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <card.icon size={18} className="text-primary" strokeWidth={1.75} />
              </div>
              <p className="font-semibold text-sm mb-1">{card.label}</p>
              <p className="text-[11px] text-sub leading-relaxed">{card.description}</p>
            </button>
          ))}
        </div>

        {/* Tertiary — Recipes + Settings */}
        <div className="rounded-2xl bg-base-200 overflow-hidden divide-y divide-base-300">
          {tertiary.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-base-300 active:bg-base-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center shrink-0">
                <card.icon size={15} className="text-base-content/60" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{card.label}</p>
                <p className="text-[11px] text-sub">{card.description}</p>
              </div>
              <ChevronRight size={14} className="text-base-content/30 shrink-0" />
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
