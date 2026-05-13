import { usePlayerStore } from '../store/player-store'

export function openQueuePanel() {
  usePlayerStore.setState({ isQueueOpen: true })
  window.dispatchEvent(new CustomEvent('nyxora-open-queue'))
}
