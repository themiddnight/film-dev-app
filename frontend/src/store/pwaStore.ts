import { create } from 'zustand'

type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>

type PwaStore = {
  isRegistered: boolean
  isOfflineReady: boolean
  hasUpdate: boolean
  updateServiceWorker?: UpdateServiceWorker
  setRegistered: (registered: boolean) => void
  setOfflineReady: (ready: boolean) => void
  setNeedRefresh: (needRefresh: boolean) => void
  setUpdateHandler: (handler: UpdateServiceWorker) => void
  reloadWithUpdate: () => Promise<void>
}

export const usePwaStore = create<PwaStore>((set, get) => ({
  isRegistered: false,
  isOfflineReady: false,
  hasUpdate: false,
  updateServiceWorker: undefined,
  setRegistered: (registered) => set({ isRegistered: registered }),
  setOfflineReady: (ready) => set({ isOfflineReady: ready }),
  setNeedRefresh: (needRefresh) => set({ hasUpdate: needRefresh }),
  setUpdateHandler: (handler) => set({ updateServiceWorker: handler }),
  reloadWithUpdate: async () => {
    const updater = get().updateServiceWorker
    if (!updater) return
    await updater(true)
  },
}))
