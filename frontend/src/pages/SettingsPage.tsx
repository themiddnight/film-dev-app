import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useEquipmentStore } from '@/store/equipmentStore'
import { usePwaStore } from '@/store/pwaStore'
import { useSettingsStore } from '@/store/settingsStore'
import Navbar from '@/components/Navbar'
import { Settings, Download, RefreshCw } from 'lucide-react'
import { toTitleCase } from '@/utils/string'

const TANK_TYPES = ['paterson', 'stainless', 'jobo', 'other']
const AGITATION_METHODS = ['inversion', 'rotation', 'stand', 'rotary']
const WATER_HARDNESS = ['soft', 'medium', 'hard']

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function SettingsPage() {
  const { equipment, setEquipment } = useEquipmentStore(
    useShallow((s) => ({ equipment: s.equipment, setEquipment: s.setEquipment }))
  )
  const { isRegistered, isOfflineReady, hasUpdate, reloadWithUpdate } = usePwaStore(
    useShallow((s) => ({
      isRegistered: s.isRegistered,
      isOfflineReady: s.isOfflineReady,
      hasUpdate: s.hasUpdate,
      reloadWithUpdate: s.reloadWithUpdate,
    }))
  )
  const { sound, vibrate, screenFlash, update } = useSettingsStore(
    useShallow((s) => ({
      sound: s.sound,
      vibrate: s.vibrate,
      screenFlash: s.screenFlash,
      update: s.update,
    }))
  )
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsInstalled(displayMode.matches)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    const onModeChange = (event: MediaQueryListEvent) => {
      setIsInstalled(event.matches)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    displayMode.addEventListener('change', onModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      displayMode.removeEventListener('change', onModeChange)
    }
  }, [])

  async function onInstallApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome !== 'accepted') return
    setInstallPrompt(null)
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Settings" subtitle="Equipment profile" showBack={false} left={<Settings size={18} className="text-sub" />} />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs text-sub block mb-1">Tank type</label>
          <select
            className="select select-bordered w-full"
            value={equipment.tank_type}
            onChange={(e) => setEquipment({ tank_type: e.target.value as 'paterson' | 'stainless' | 'jobo' | 'other' })}
          >
            {TANK_TYPES.map((type) => (
              <option key={type} value={type}>
                {toTitleCase(type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-sub block mb-1">Default agitation method</label>
          <select
            className="select select-bordered w-full"
            value={equipment.agitation_method}
            onChange={(e) =>
              setEquipment({ agitation_method: e.target.value as 'inversion' | 'rotation' | 'stand' | 'rotary' })
            }
          >
            {AGITATION_METHODS.map((method) => (
              <option key={method} value={method}>
                {toTitleCase(method)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-sub block mb-1">Water hardness</label>
          <select
            className="select select-bordered w-full"
            value={equipment.water_hardness}
            onChange={(e) => setEquipment({ water_hardness: e.target.value as 'soft' | 'medium' | 'hard' })}
          >
            {WATER_HARDNESS.map((hardness) => (
              <option key={hardness} value={hardness}>
                {toTitleCase(hardness)}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-sub">
          Dev setup can override these values temporarily for each session and will not save back here.
        </div>

        <div className="divider my-1" />

        <div>
          <p className="text-xs text-sub uppercase font-medium mb-3">Agitation Notifications</p>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sound</p>
                <p className="text-xs text-sub">Play a beep when agitation starts</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={sound}
                onChange={(e) => update({ sound: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Vibrate</p>
                <p className="text-xs text-sub">Vibrate device when agitation starts</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={vibrate}
                onChange={(e) => update({ vibrate: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Screen Flash</p>
                <p className="text-xs text-sub">Flash screen when agitation starts</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={screenFlash}
                onChange={(e) => update({ screenFlash: e.target.checked })}
              />
            </label>
          </div>
        </div>

        <div className="divider my-1" />

        <div className="card bg-base-200">
          <div className="card-body p-4 space-y-3">
            <h3 className="font-semibold">App</h3>
            <div className="text-sm text-sub">
              <div>Service worker: {isRegistered ? 'ready' : 'not ready yet'}</div>
              <div>Offline shell: {isOfflineReady ? 'available' : 'preparing'}</div>
              <div>Installed: {isInstalled ? 'yes' : 'no'}</div>
            </div>

            {!isInstalled && installPrompt && (
              <button className="btn btn-outline btn-sm" onClick={() => void onInstallApp()}>
                <Download size={14} /> Install app
              </button>
            )}

            {hasUpdate && (
              <button className="btn btn-primary btn-sm" onClick={() => void reloadWithUpdate()}>
                <RefreshCw size={14} /> Update app now
              </button>
            )}

            {!hasUpdate && <div className="text-xs text-sub">App is on the latest available version.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
