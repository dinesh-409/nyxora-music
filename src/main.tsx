import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Queue panel is temporary UI state; never restore it opened after refresh.
try {
  for (const key of ['nyxora-player-store', 'nyxora-music-player']) {
    const raw = localStorage.getItem(key)
    if (!raw) continue

    const parsed = JSON.parse(raw)
    if (parsed?.state) {
      parsed.state.isQueueOpen = false
      parsed.state.isQueueExpanded = false
      parsed.state.isQueueEditMode = false
      localStorage.setItem(key, JSON.stringify(parsed))
    }
  }
} catch {
  // Ignore broken persisted player state.
}



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
