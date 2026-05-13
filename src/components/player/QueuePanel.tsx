import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Grip,
  Pause,
  Play,
  Repeat,
  Shuffle,
  Timer,
  Trash2,
  X,
} from 'lucide-react'
import { usePlayerStore } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'
import { getRecommendedQueue, shuffleKeepingCurrent } from '../../lib/queue-recommendations'
import type { Track } from '../../types/music'

function toast(message: string) {
  window.dispatchEvent(new CustomEvent('nyxora-toast', { detail: message }))
}

function formatSource(value?: string | null) {
  if (!value) return 'Playing from Nyxora Music'

  if (value.toLowerCase().startsWith('search:')) {
    const query = value.replace(/^search:/i, '').trim()
    return `Playing "${query}" in Search`
  }

  return `Playing from ${value}`
}

function QueueRow({
  track,
  active,
  onPlay,
  onRemove,
  onMoveUp,
  onMoveDown,
  showMove,
}: {
  track: Track
  active?: boolean
  onPlay: () => void
  onRemove?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  showMove?: boolean
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl px-1 py-2">
      <button onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-4 text-left">
        <SafeImage
          src={track.thumbnail}
          alt={track.title}
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
          loading="eager"
        />

        <div className="min-w-0 flex-1">
          <p className={`truncate text-xl font-bold ${active ? 'text-emerald-400' : 'text-white'}`}>
            {active ? '▮▮ ' : ''}
            {track.title}
          </p>
          <p className="mt-1 truncate text-lg text-white/50">{track.artist}</p>
        </div>
      </button>

      {showMove ? (
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} className="rounded-full p-2 active:bg-white/10">
            <ChevronUp size={20} />
          </button>
          <button onClick={onMoveDown} className="rounded-full p-2 active:bg-white/10">
            <ChevronDown size={20} />
          </button>
          <button onClick={onRemove} className="rounded-full p-2 text-red-200 active:bg-white/10">
            <X size={18} />
          </button>
        </div>
      ) : (
        <Grip size={30} className="text-white/80" />
      )}
    </div>
  )
}

export function QueuePanel() {
  const [editMode, setEditMode] = useState(false)

  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    isQueueOpen,
    playingFromTitle,
    repeatMode,
    shuffleMode,
    setQueueOpen,
    setPlaying,
    playQueueIndex,
    clearQueue,
    removeQueueItem,
    toggleRepeat,
    toggleShuffle,
  } = usePlayerStore()

  const recommended = useMemo(
    () => getRecommendedQueue(currentTrack, queue),
    [currentTrack?.id, queue],
  )

  if (!isQueueOpen) return null

  function setQueueDirect(nextQueue: Track[], nextIndex = currentIndex) {
    usePlayerStore.setState({
      queue: nextQueue,
      currentIndex: Math.max(0, Math.min(nextIndex, nextQueue.length - 1)),
    })
  }

  function moveQueueItem(from: number, to: number) {
    if (to < 0 || to >= queue.length) return

    const next = [...queue]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)

    let nextCurrentIndex = currentIndex
    if (from === currentIndex) nextCurrentIndex = to
    else if (from < currentIndex && to >= currentIndex) nextCurrentIndex -= 1
    else if (from > currentIndex && to <= currentIndex) nextCurrentIndex += 1

    setQueueDirect(next, nextCurrentIndex)
  }

  function addRecommendedToQueue(track: Track) {
    usePlayerStore.setState({ queue: [...queue, { ...track }] })
    toast(`${track.title} added to queue`)
  }

  function shuffleQueue() {
    const shuffled = shuffleKeepingCurrent(queue, currentIndex)
    usePlayerStore.setState({
      queue: shuffled,
      currentIndex: 0,
    })

    if (shuffleMode === 'off') toggleShuffle()
    toast('Queue shuffled')
  }

  function openTimer() {
    window.dispatchEvent(new CustomEvent('nyxora-open-sleep-timer'))
  }

  return (
    <div className="fixed inset-0 z-[85] bg-black/50 text-white backdrop-blur-sm">
      <button
        className="absolute inset-0 cursor-default"
        onClick={() => setQueueOpen(false)}
        aria-label="Close queue"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto flex h-[88vh] max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-[#1f1f1f] shadow-2xl">
        <div className="flex justify-center pt-4">
          <div className="h-1.5 w-24 rounded-full bg-white/30" />
        </div>

        <header className="flex items-start justify-between px-5 pb-5 pt-7">
          <div>
            <h1 className="text-4xl font-black">Queue</h1>
            <p className="mt-2 text-2xl text-white/60">{formatSource(playingFromTitle)}</p>
          </div>

          <button
            onClick={() => setEditMode(!editMode)}
            className="rounded-full bg-white/10 px-6 py-4 text-xl font-black active:bg-white/15"
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </header>

        {currentTrack && (
          <section className="border-b border-white/10 px-5 pb-5">
            <div className="flex items-center gap-4">
              <SafeImage
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="h-20 w-20 rounded-xl object-cover"
                loading="eager"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-2xl font-black text-emerald-400">
                  ▮▮ {currentTrack.title}
                </p>
                <p className="mt-1 truncate text-xl text-white/55">{currentTrack.artist}</p>
              </div>

              <button
                onClick={() => setPlaying(!isPlaying)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black active:scale-95"
              >
                {isPlaying ? <Pause size={30} fill="black" /> : <Play size={30} fill="black" />}
              </button>
            </div>
          </section>
        )}

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {queue.length > 1 && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-2xl font-medium text-white/60">Next up</p>
                {editMode && (
                  <button
                    onClick={clearQueue}
                    className="flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-2 text-sm font-black text-red-200"
                  >
                    <Trash2 size={15} />
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {queue.map((track, index) => {
                  if (index === currentIndex) return null

                  return (
                    <QueueRow
                      key={`${track.id}-${index}`}
                      track={track}
                      active={false}
                      showMove={editMode}
                      onPlay={() => playQueueIndex(index)}
                      onRemove={() => removeQueueItem(index)}
                      onMoveUp={() => moveQueueItem(index, index - 1)}
                      onMoveDown={() => moveQueueItem(index, index + 1)}
                    />
                  )
                })}
              </div>
            </>
          )}

          <div className="mt-6">
            <p className="mb-4 text-2xl font-medium text-white/60">
              Next up: Recommended tracks
            </p>

            <div className="space-y-3 pb-36">
              {recommended.map((track) => (
                <QueueRow
                  key={`recommended-${track.id}`}
                  track={track}
                  onPlay={() => {
                    const nextQueue = [...queue, track]
                    usePlayerStore.setState({
                      queue: nextQueue,
                      currentIndex: nextQueue.length - 1,
                      currentTrack: track,
                      currentTime: 0,
                      isPlaying: true,
                      isLoading: true,
                    })
                  }}
                  onRemove={() => addRecommendedToQueue(track)}
                />
              ))}
            </div>
          </div>
        </section>

        <footer className="absolute inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-[#1f1f1f] via-[#1f1f1f] to-transparent px-5 pb-5 pt-8">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={shuffleQueue}
              className={`rounded-2xl px-4 py-5 text-center active:scale-95 ${
                shuffleMode !== 'off' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
              }`}
            >
              <Shuffle className="mx-auto" size={32} />
              <p className="mt-2 text-lg font-bold">Shuffle</p>
            </button>

            <button
              onClick={toggleRepeat}
              className={`rounded-2xl px-4 py-5 text-center active:scale-95 ${
                repeatMode !== 'off' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
              }`}
            >
              <Repeat className="mx-auto" size={32} />
              <p className="mt-2 text-lg font-bold">
                {repeatMode === 'one' ? 'Repeat 1' : repeatMode === 'all' ? 'Repeat all' : 'Repeat'}
              </p>
            </button>

            <button
              onClick={openTimer}
              className="rounded-2xl bg-white/10 px-4 py-5 text-center text-white active:scale-95"
            >
              <Timer className="mx-auto" size={32} />
              <p className="mt-2 text-lg font-bold">Timer</p>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
