import { useEffect, useState } from 'react'

export function AppToast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    function onToast(event: Event) {
      const custom = event as CustomEvent<string>
      setMessage(custom.detail || 'Done')
    }

    window.addEventListener('nyxora-toast', onToast)
    return () => window.removeEventListener('nyxora-toast', onToast)
  }, [])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 1800)
    return () => window.clearTimeout(timer)
  }, [message])

  if (!message) return null

  return (
    <div className="fixed left-1/2 top-20 z-[120] w-[min(92vw,360px)] -translate-x-1/2 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-black shadow-2xl">
      {message}
    </div>
  )
}
