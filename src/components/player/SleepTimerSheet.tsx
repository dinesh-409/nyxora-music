import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { usePlayerStore } from '../../store/player-store'

type TimerMode = 'minutes' | 'end_of_track' | null

const TIMER_OPTIONS = [
  { label: '5 minutes', minutes: 5 },
  { label: '10 minutes', minutes: 10 },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
]

function toast(message: string) {
  window.dispatchEvent(new CustomEvent('nyxora-toast', { detail: message }))
}

export function SleepTimerSheet() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<TimerMode>(null)
  const [endsAt, setEndsAt] = useState<number | null>(null)

  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const setPlaying = usePlayerStore((state) => state.setPlaying)
  const setSleepTimer = usePlayerStore((state) => state.setSleepTimer)

  useEffect(() => {
    function openTimer() {
      setOpen(true)
    }

    window.addEventListener('nyxora-open-sleep-timer', openTimer)
    return () => window.removeEventListener('nyxora-open-sleep-timer', openTimer)
  }, [])

  useEffect(() => {
    if (mode !== 'minutes' || !endsAt) return

    const interval = window.setInterval(() => {
      if (Date.now() >= endsAt) {
        setPlaying(false)
        setMode(null)
        setEndsAt(null)
        setSleepTimer(null)
        toast('Sleep timer finished')
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [mode, endsAt, setPlaying, setSleepTimer])

  useEffect(() => {
    if (mode !== 'end_of_track') return
    if (!currentTrack) return
    if (!duration || duration <= 0) return

    const remaining = duration - currentTime
    if (remaining <= 1.2 && currentTime > 5) {
      setPlaying(false)
      setMode(null)
      setEndsAt(null)
      setSleepTimer(null)
      toast('Stopped at end of track')
    }
  }, [mode, currentTrack?.id, currentTime, duration, setPlaying, setSleepTimer])

  function chooseMinutes(minutes: number) {
    setMode('minutes')
    setEndsAt(Date.now() + minutes * 60 * 1000)
    setSleepTimer(minutes)
    setOpen(false)
    toast(`Sleep timer set for ${minutes} minutes`)
  }

  function chooseEndOfTrack() {
    setMode('end_of_track')
    setEndsAt(null)
    setSleepTimer(null)
    setOpen(false)
    toast('Playback will stop at end of track')
  }

  function cancelTimer() {
    setMode(null)
    setEndsAt(null)
    setSleepTimer(null)
    setOpen(false)
    toast('Sleep timer cancelled')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/55 text-white backdrop-blur-sm">
      <button
        className="absolute inset-0 cursor-default"
        onClick={() => setOpen(false)}
        aria-label="Close sleep timer"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md overflow-hidden rounded-t-[2rem] bg-[#1e1e1e] shadow-2xl">
        <div className="flex justify-center pt-4">
          <div className="h-1.5 w-24 rounded-full bg-white/30" />
        </div>

        <h2 className="border-b border-white/10 py-8 text-center text-3xl font-black">
          Sleep timer
        </h2>

        <div className="pb-6">
          {TIMER_OPTIONS.map((option) => {
            const active =
              mode === 'minutes' &&
              endsAt !== null &&
              Math.round((endsAt - Date.now()) / 60000) === option.minutes

            return (
              <button
                key={option.minutes}
                onClick={() => chooseMinutes(option.minutes)}
                className="flex w-full items-center justify-between px-8 py-5 text-left text-2xl font-medium active:bg-white/10"
              >
                <span>{option.label}</span>
                {active && <Check size={24} className="text-emerald-400" />}
              </button>
            )
          })}

          <button
            onClick={chooseEndOfTrack}
            className="flex w-full items-center justify-between px-8 py-5 text-left text-2xl font-medium active:bg-white/10"
          >
            <span>End of track</span>
            {mode === 'end_of_track' && <Check size={24} className="text-emerald-400" />}
          </button>

          {mode && (
            <button
              onClick={cancelTimer}
              className="mt-2 w-full px-8 py-5 text-left text-xl font-black text-red-300 active:bg-white/10"
            >
              Cancel timer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
