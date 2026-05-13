import { useEffect, useMemo } from 'react'
import { Check, Timer, X } from 'lucide-react'
import { usePlayerStore } from '../../store/player-store'

function toast(message: string) {
  window.dispatchEvent(new CustomEvent('nyxora-toast', { detail: message }))
}

const TIMER_OPTIONS = [
  { label: '5 minutes', minutes: 5 },
  { label: '10 minutes', minutes: 10 },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
]

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) return `${seconds}s left`
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s left`
}

export function SleepTimerSheet() {
  const state = usePlayerStore() as any

  const isOpen = Boolean(state.isSleepTimerOpen)
  const sleepTimerMode = state.sleepTimerMode ?? 'off'
  const sleepTimerEndsAt = state.sleepTimerEndsAt ?? null

  const remainingText = useMemo(() => {
    if (sleepTimerMode !== 'minutes' || !sleepTimerEndsAt) return null
    return formatRemaining(sleepTimerEndsAt - Date.now())
  }, [sleepTimerMode, sleepTimerEndsAt, isOpen])

  useEffect(() => {
    function openTimer() {
      usePlayerStore.setState({ isSleepTimerOpen: true })
    }

    window.addEventListener('nyxora-open-sleep-timer', openTimer)
    return () => window.removeEventListener('nyxora-open-sleep-timer', openTimer)
  }, [])

  useEffect(() => {
    if (sleepTimerMode !== 'minutes' || !sleepTimerEndsAt) return

    const interval = window.setInterval(() => {
      const latest = usePlayerStore.getState() as any
      if (latest.sleepTimerMode !== 'minutes' || !latest.sleepTimerEndsAt) return

      if (Date.now() >= latest.sleepTimerEndsAt) {
        usePlayerStore.setState({
          isPlaying: false,
          sleepTimerMode: 'off',
          sleepTimerEndsAt: null,
          isSleepTimerOpen: false,
        })
        toast('Sleep timer ended')
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [sleepTimerMode, sleepTimerEndsAt])

  if (!isOpen) return null

  function close() {
    usePlayerStore.setState({ isSleepTimerOpen: false })
  }

  function setMinutes(minutes: number) {
    state.setSleepTimerMinutes?.(minutes)
    toast(`Sleep timer set for ${minutes} minutes`)
  }

  function setEndOfTrack() {
    state.setSleepTimerEndOfTrack?.()
    toast('Sleep timer set for end of track')
  }

  function clearTimer() {
    state.clearSleepTimer?.()
    toast('Sleep timer cancelled')
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/45 text-white backdrop-blur-sm">
      <button className="absolute inset-0" onClick={close} aria-label="Close sleep timer" />

      <div
        onClick={(event) => event.stopPropagation()}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-md overflow-hidden rounded-t-[28px] bg-[#1f1f1f] shadow-2xl"
      >
        <div className="flex justify-center pb-3 pt-3">
          <div className="h-1.5 w-16 rounded-full bg-white/40" />
        </div>

        <header className="flex items-center justify-between border-b border-white/10 px-5 pb-5 pt-2">
          <div className="flex items-center gap-3">
            <Timer size={28} />
            <div>
              <h2 className="text-[28px] font-black leading-none">Sleep timer</h2>
              {sleepTimerMode === 'minutes' && remainingText && (
                <p className="mt-2 text-sm font-semibold text-emerald-400">{remainingText}</p>
              )}
              {sleepTimerMode === 'end-of-track' && (
                <p className="mt-2 text-sm font-semibold text-emerald-400">End of track selected</p>
              )}
            </div>
          </div>

          <button
            onClick={close}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 active:bg-white/20"
          >
            <X size={22} />
          </button>
        </header>

        <section className="px-5 py-3">
          {TIMER_OPTIONS.map((option) => {
            const isSelected =
              sleepTimerMode === 'minutes' &&
              sleepTimerEndsAt &&
              Math.abs(sleepTimerEndsAt - Date.now() - option.minutes * 60 * 1000) < 2500

            return (
              <button
                key={option.minutes}
                onClick={() => setMinutes(option.minutes)}
                className="flex w-full items-center justify-between py-5 text-left active:bg-white/5"
              >
                <span className="text-[22px] font-semibold">{option.label}</span>
                {isSelected && <Check className="text-emerald-400" size={24} />}
              </button>
            )
          })}

          <button
            onClick={setEndOfTrack}
            className="flex w-full items-center justify-between py-5 text-left active:bg-white/5"
          >
            <span className="text-[22px] font-semibold">End of track</span>
            {sleepTimerMode === 'end-of-track' && <Check className="text-emerald-400" size={24} />}
          </button>

          {sleepTimerMode !== 'off' && (
            <button
              onClick={clearTimer}
              className="mt-2 flex w-full items-center justify-center rounded-2xl bg-white/10 py-4 text-[18px] font-black text-white active:bg-white/20"
            >
              Cancel timer
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
