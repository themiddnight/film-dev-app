import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './tokens.css'   // Figma design tokens — must come after index.css to override DaisyUI
import App from './App.tsx'
import { usePwaStore } from './store/pwaStore'

const updateServiceWorker = registerSW({
  immediate: true,
  onOfflineReady() {
    usePwaStore.getState().setOfflineReady(true)
  },
  onNeedRefresh() {
    usePwaStore.getState().setNeedRefresh(true)
  },
  onRegisteredSW() {
    usePwaStore.getState().setRegistered(true)
  },
  onRegisterError() {
    usePwaStore.getState().setRegistered(false)
  },
})

usePwaStore.getState().setUpdateHandler(updateServiceWorker)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
