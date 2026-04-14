import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, FlaskConical, Package, Settings, Timer } from 'lucide-react'
import { useMixingStore } from '../store/mixingStore'

const tabs = [
  { to: '/dev', label: 'Dev', icon: Timer },
  { to: '/mix', label: 'Mix', icon: FlaskConical },
  { to: '/recipes', label: 'Recipes', icon: BookOpen },
  { to: '/kits', label: 'My Kit', icon: Package },
  { to: '/settings', label: 'Settings', icon: Settings },
]

// Routes where the bottom nav should be hidden (active process screens)
const PROCESS_ROUTES = [
  '/dev/setup',
  '/dev/timer',
  '/dev/done',
  '/mix/summary',
  '/mix/shopping',
  '/mix/prep',
  '/mix/mix',
  '/mix/steps',
  '/mix/done',
]

function TabLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Timer }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-primary text-primary-content' : 'text-sub hover:bg-base-200'}`
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function MainLayout() {
  const { pathname } = useLocation()
  const hideNav = PROCESS_ROUTES.includes(pathname)
  const resetMixing = useMixingStore((s) => s.resetAll)
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    const prev = prevPathRef.current
    prevPathRef.current = pathname
    if (prev.startsWith('/mix') && !pathname.startsWith('/mix')) {
      resetMixing()
    }
  }, [pathname, resetMixing])

  return (
    <div className="h-full w-full flex flex-col md:flex-row">
      <aside className="hidden md:flex md:w-56 border-r border-base-300 p-3 flex-col gap-2 bg-base-100">
        {tabs.map((tab) => (
          <TabLink key={tab.to} to={tab.to} label={tab.label} icon={tab.icon} />
        ))}
      </aside>

      <main className={`flex-1 min-h-0 ${hideNav ? '' : 'pb-16'} md:pb-0`}>
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="md:hidden h-16 fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-275 border-t border-base-300 bg-base-100 px-2 py-1 grid grid-cols-5 gap-1 z-40">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 rounded-md text-[10px] ${isActive ? 'text-primary font-semibold' : 'text-sub'}`
                }
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </NavLink>
            )
          })}
        </nav>
      )}
    </div>
  )
}
