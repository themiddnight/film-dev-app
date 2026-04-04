// pages/SettingsPage.tsx — 07 · Settings
import Navbar from '../components/Navbar'
import { useSettingsStore } from '../store/settingsStore'

export default function SettingsPage() {
  const s = useSettingsStore()

  return (
    <div className="flex flex-col h-full">
      <Navbar title="⚙️ Settings" />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-1">

        {/* AGITATION REMINDER */}
        <p className="text-xs text-sub uppercase tracking-widest px-1 pt-2 pb-1">
          Agitation Reminder
        </p>
        <div className="card bg-base-200">
          <div className="card-body p-0 divide-y divide-base-300">
            <ToggleRow
              label="Sound"
              desc="Beep when it's time to agitate"
              checked={s.sound}
              onChange={(v) => s.update({ sound: v })}
            />
            <ToggleRow
              label="Vibrate"
              desc="On supported devices"
              checked={s.vibrate}
              onChange={(v) => s.update({ vibrate: v })}
            />
            <ToggleRow
              label="Screen Flash"
              desc="Brief flash on the screen"
              checked={s.screenFlash}
              onChange={(v) => s.update({ screenFlash: v })}
            />
          </div>
        </div>

        {/* UNITS */}
        <p className="text-xs text-sub uppercase tracking-widest px-1 pt-4 pb-1">Units</p>
        <div className="card bg-base-200">
          <div className="card-body py-4 px-5 flex-row items-center justify-between">
            <div>
              <div className="font-medium text-sm">Units</div>
              <div className="text-xs text-sub">g/ml (metric) · oz/fl oz (imperial)</div>
            </div>
            <div className="join">
              <button
                className={`join-item btn btn-sm ${s.unit === 'metric' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => s.update({ unit: 'metric' })}
              >
                g/ml
              </button>
              <button
                className={`join-item btn btn-sm ${s.unit === 'imperial' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => s.update({ unit: 'imperial' })}
              >
                oz
              </button>
            </div>
          </div>
        </div>

        {/* APPEARANCE */}
        <p className="text-xs text-sub uppercase tracking-widest px-1 pt-4 pb-1">Appearance</p>
        <div className="card bg-base-200">
          <div className="card-body py-4 px-5 flex-row items-center justify-between">
            <div>
              <div className="font-medium text-sm">Theme</div>
              <div className="text-xs text-sub">{s.theme === 'dark' ? 'Dark (default)' : 'Light'}</div>
            </div>
            <div className="join">
              <button
                className={`join-item btn btn-sm ${s.theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => s.update({ theme: 'dark' })}
              >
                🌙
              </button>
              <button
                className={`join-item btn btn-sm ${s.theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => s.update({ theme: 'light' })}
              >
                ☀️
              </button>
            </div>
          </div>
        </div>

        {/* ABOUT */}
        <p className="text-xs text-sub uppercase tracking-widest px-1 pt-4 pb-1">About</p>
        <div className="card bg-base-200">
          <div className="card-body py-4 px-5">
            <div className="font-medium text-sm">Film Dev Guidance</div>
            <div className="text-xs text-sub">v0.1.0 · Phase 1</div>
          </div>
        </div>

        <p className="text-xs text-center text-sub mt-4 pb-6">
          All settings are saved automatically in localStorage
        </p>
      </div>
    </div>
  )
}

// ─── sub-component ────────────────────────────────────────────────────────────
function ToggleRow({
  label, desc, checked, onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-sub">{desc}</div>
      </div>
      <input
        type="checkbox"
        className="toggle toggle-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  )
}
