import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/lilita-one/400.css'
import './index.css'
import App from './App.tsx'
import { watchUpdates } from './lib/update'

registerSW({ immediate: true })
watchUpdates()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
