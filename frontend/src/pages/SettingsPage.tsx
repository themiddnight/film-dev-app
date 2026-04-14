import { useEffect, useState } from 'react'
import { Download, RefreshCw, Settings } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useEquipmentStore } from '../store/equipmentStore'
import { usePwaStore } from '../store/pwaStore'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function SettingsPage() {
  const { equipment, setEquipment } = useEquipmentStore()
  const { isRegistered, isOfflineReady, hasUpdate, reloadWithUpdate } = usePwaStore()
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
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
            <option value="paterson">paterson</option>
            <option value="stainless">stainless</option>
            <option value="jobo">jobo</option>
            <option value="other">other</option>
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
            <option value="inversion">inversion</option>
            <option value="rotation">rotation</option>
            <option value="rotary">rotary</option>
            <option value="stand">stand</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-sub block mb-1">Water hardness</label>
          <select
            className="select select-bordered w-full"
            value={equipment.water_hardness}
            onChange={(e) => setEquipment({ water_hardness: e.target.value as 'soft' | 'medium' | 'hard' })}
          >
            <option value="soft">soft</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>

        <div className="text-xs text-sub">
          Dev setup can override these values temporarily for each session and will not save back here.
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
