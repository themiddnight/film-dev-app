import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, FlaskConical, Home, Package, Settings, Timer } from 'lucide-react'
import { useMixingStore } from '../store/mixingStore'

// Tablet sidebar tabs (Home first, then the rest)
const sidebarTabs = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/dev', label: 'Dev', icon: Timer },
  { to: '/mix', label: 'Mix', icon: FlaskConical },
  { to: '/recipes', label: 'Recipes', icon: BookOpen },
  { to: '/kits', label: 'My Kit', icon: Package },
  { to: '/settings', label: 'Settings', icon: Settings },
]

// Mobile bottom nav: Recipes · HOME (FAB) · Settings
const mobileNavItems = [
  { to: '/recipes', label: 'Recipes', icon: BookOpen, isFab: false },
  { to: '/home', label: 'Home', icon: Home, isFab: true },
  { to: '/settings', label: 'Settings', icon: Settings, isFab: false },
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
  const navigate = useNavigate()
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
      {/* Tablet sidebar */}
      <aside className="hidden md:flex md:w-1/5 md:min-w-56 border-r border-base-300 p-3 flex-col gap-2 bg-base-100">
        {sidebarTabs.map((tab) => (
          <TabLink key={tab.to} to={tab.to} label={tab.label} icon={tab.icon} />
        ))}
      </aside>

      <main className={`flex-1 min-h-0 ${hideNav ? '' : 'pb-16'} md:pb-0`}>
        <Outlet />
      </main>

      {/* Mobile bottom nav: Recipes · HOME FAB · Settings */}
      {!hideNav && (
        <nav className="md:hidden h-16 fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-275 border-t border-base-300 bg-base-100 z-40 flex items-center justify-around px-4">
          {mobileNavItems.map(({ to, label, icon: Icon, isFab }) =>
            isFab ? (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`w-18 h-18 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-lg -mt-5 border-4 border-base-100 transition-colors ${
                  pathname === to
                    ? 'bg-primary text-primary-content'
                    : 'bg-base-300 text-base-content hover:bg-primary hover:text-primary-content'
                }`}
                aria-label={label}
              >
                <Icon size={22} />
                <span className="text-[10px] font-semibold">{label}</span>
              </button>
            ) : (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 gap-0.5 text-[10px] w-14 ${isActive ? 'text-primary font-semibold' : 'text-sub'}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            )
          )}
        </nav>
      )}
    </div>
  )
}
