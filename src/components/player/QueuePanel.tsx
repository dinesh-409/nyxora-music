import { useMemo, useState } from 'react'
import {
  GripVertical,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  Timer,
  X,
} from 'lucide-react'
import { SafeImage } from '../common/SafeImage'
import { usePlayerStore } from '../../store/player-store'
import type { Track } from '../../types/music'

type QueuePanelProps = {
  open?: boolean
  isOpen?: boolean
  onClose?: () => void
}

type SheetSize = 'half' | 'full'

function getTrackKey(track?: Track | null) {
  if (!track) return ''
  return track.videoId || track.id || `${track.title}-${track.artist}`
}

function sameTrack(a?: Track | null, b?: Track | null) {
  const aKey = getTrackKey(a)
  const bKey = getTrackKey(b)
  return Boolean(aKey && bKey && aKey === bKey)
}

function getQueueTitle(playingFromTitle?: string | null) {
  return playingFromTitle || 'Queue'
}

export function QueuePanel({ open = true, isOpen, onClose }: QueuePanelProps) {
  const visible = isOpen ?? open
  const [sheetSize, setSheetSize] = useState<SheetSize>('half')
  const [dragStartY, setDragStartY] = useState<number | null>(null)
  const [queueShuffleOn, setQueueShuffleOn] = useState(false)

  const {
    queue,
    currentTrack,
    currentIndex,
    isPlaying,
    repeatMode,
    activeContextTitle,
    setPlaying,
    toggleShuffle,
    toggleRepeat,
    setQueue,
  } = usePlayerStore()

  const safeQueue = useMemo(() => {
    if (queue?.length) return queue
    return currentTrack ? [currentTrack] : []
  }, [queue, currentTrack])

  const playingTitle = getQueueTitle(activeContextTitle)
  const activeIndex =
    typeof currentIndex === 'number' && currentIndex >= 0
      ? currentIndex
      : safeQueue.findIndex((track) => sameTrack(track, currentTrack))

  if (!visible) return null

  function playTrack(track: Track, index: number) {
    if (sameTrack(track, currentTrack)) {
      setPlaying(!isPlaying)
      return
    }

    setQueue(safeQueue, index, playingTitle)
    setPlaying(true)
  }

  function handleDragStart(clientY: number) {
    setDragStartY(clientY)
  }

  function handleDragEnd(clientY: number) {
    if (dragStartY === null) return

    const diff = clientY - dragStartY

    if (diff < -35) {
      setSheetSize('full')
    }

    if (diff > 35) {
      setSheetSize('half')
    }

    setDragStartY(null)
  }

  const isFull = sheetSize === 'full'

  return (
    <div className="fixed inset-0 z-[120] text-white">
      <button
        type="button"
        aria-label="Close queue"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <section
        className={`absolute left-0 right-0 mx-auto max-w-md rounded-t-[28px] bg-[#202020] shadow-2xl transition-all duration-300 ease-out ${
          isFull ? 'top-6 h-[calc(100vh-32px)]' : 'bottom-0 h-[58vh]'
        }`}
      >
        <div
          className="flex cursor-grab touch-none justify-center pb-3 pt-4 active:cursor-grabbing"
          onMouseDown={(event) => handleDragStart(event.clientY)}
          onMouseUp={(event) => handleDragEnd(event.clientY)}
          onTouchStart={(event) => handleDragStart(event.touches[0]?.clientY ?? 0)}
          onTouchEnd={(event) => handleDragEnd(event.changedTouches[0]?.clientY ?? 0)}
          onClick={() => setSheetSize((value) => (value === 'half' ? 'full' : 'half'))}
        >
          <div className="h-1.5 w-16 rounded-full bg-white/35" />
        </div>

        <div className="flex h-full min-h-0 flex-col px-5 pb-6">
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[28px] font-black leading-none">Queue</h2>
              <p className="mt-2 truncate text-[17px] text-white/65">
                Playing {playingTitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full bg-white/10 px-6 py-3 text-base font-black active:bg-white/15"
              >
                Edit
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-3 text-white/60 active:bg-white/10"
                  aria-label="Close queue"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </header>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <div className="space-y-5 pb-32">
              {safeQueue.length === 0 ? (
                <div className="rounded-3xl bg-white/5 p-5 text-white/60">
                  Queue is empty. Play a song to build your queue.
                </div>
              ) : (
                safeQueue.map((track, index) => {
                  const active = index === activeIndex || sameTrack(track, currentTrack)

                  return (
                    <div key={`${getTrackKey(track)}-${index}`} className="flex items-center gap-4">
                      <SafeImage
                        src={track.thumbnail || '/logo.png'}
                        alt={track.title}
                        className="h-[68px] w-[68px] shrink-0 rounded-md object-cover"
                        loading="eager"
                      />

                      <button
                        type="button"
                        onClick={() => playTrack(track, index)}
                        className="min-w-0 flex-1 text-left active:scale-[0.99]"
                      >
                        <p
                          className={`truncate text-[24px] font-semibold leading-tight ${
                            active ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {active && '... '}
                          {track.title}
                        </p>
                        <p className="mt-2 truncate text-[19px] text-white/55">{track.artist}</p>
                      </button>

                      {active ? (
                        <button
                          type="button"
                          onClick={() => setPlaying(!isPlaying)}
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-black active:scale-95"
                          aria-label={isPlaying ? 'Pause song' : 'Play song'}
                        >
                          {isPlaying ? (
                            <Pause size={25} fill="black" />
                          ) : (
                            <Play size={25} fill="black" className="ml-1" />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-full p-2 text-white/75 active:bg-white/10"
                          aria-label="Queue item drag handle"
                        >
                          <GripVertical size={28} />
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <footer className="absolute bottom-6 left-5 right-5 grid grid-cols-3 gap-3 bg-gradient-to-t from-[#202020] via-[#202020] to-transparent pt-8">
            <button
              type="button"
              onClick={() => {
                toggleShuffle()
                setQueueShuffleOn((value) => !value)
              }}
              className={`rounded-2xl bg-white/10 px-3 py-4 text-center active:bg-white/15 ${
                queueShuffleOn ? 'text-emerald-400' : 'text-white'
              }`}
            >
              <Shuffle size={32} className="mx-auto mb-2" />
              <span className="text-sm font-semibold">Shuffle</span>
            </button>

            <button
              type="button"
              onClick={toggleRepeat}
              className={`rounded-2xl bg-white/10 px-3 py-4 text-center active:bg-white/15 ${
                repeatMode !== 'off' ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 size={32} className="mx-auto mb-2" />
              ) : (
                <Repeat size={32} className="mx-auto mb-2" />
              )}
              <span className="text-sm font-semibold">Repeat</span>
            </button>

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('nyxora-open-sleep-timer', {
                    detail: true,
                  }),
                )
              }
              className="rounded-2xl bg-white/10 px-3 py-4 text-center text-white active:bg-white/15"
            >
              <Timer size={32} className="mx-auto mb-2" />
              <span className="text-sm font-semibold">Timer</span>
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}
