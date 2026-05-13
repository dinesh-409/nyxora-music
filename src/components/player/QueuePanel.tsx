import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Grip,
  MinusCircle,
  Pause,
  Play,
  Repeat,
  Shuffle,
  Timer,
} from 'lucide-react'
import { usePlayerStore } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'
import { getRecommendedQueue } from '../../lib/queue-recommendations'
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

function QueueSongRow({
  track,
  active,
  editMode,
  onPlay,
  onRemove,
  onReorder,
}: {
  track: Track
  active?: boolean
  editMode?: boolean
  onPlay: () => void
  onRemove?: () => void
  onReorder?: () => void
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <button
        onClick={onPlay}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >
        <SafeImage
          src={track.thumbnail}
          alt={track.title}
          className="h-16 w-16 shrink-0 rounded-md object-cover"
          loading="eager"
        />

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[22px] font-semibold leading-tight ${
              active ? 'text-emerald-400' : 'text-white'
            }`}
          >
            {active ? '▮▮ ' : ''}
            {track.title}
          </p>
          <p className="mt-1 truncate text-[19px] text-white/48">{track.artist}</p>
        </div>
      </button>

      {editMode ? (
        <button
          onClick={onRemove}
          className="rounded-full p-2 text-red-300 active:bg-white/10"
          aria-label="Remove song"
        >
          <MinusCircle size={28} />
        </button>
      ) : (
        <button
          onClick={onReorder}
          className="rounded-full p-2 text-white/85 active:bg-white/10"
          aria-label="Reorder song"
        >
          <Grip size={34} strokeWidth={2.4} />
        </button>
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
    removeQueueItem,
    toggleRepeat,
    toggleShuffle,
  } = usePlayerStore()

  const recommended = useMemo(
    () => getRecommendedQueue(currentTrack, queue),
    [currentTrack?.id, queue],
  )

  if (!isQueueOpen) return null

  function moveQueueItem(from: number, to: number) {
    if (to < 0 || to >= queue.length) return

    const next = [...queue]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)

    let nextCurrentIndex = currentIndex
    if (from === currentIndex) nextCurrentIndex = to
    else if (from < currentIndex && to >= currentIndex) nextCurrentIndex -= 1
    else if (from > currentIndex && to <= currentIndex) nextCurrentIndex += 1

    usePlayerStore.setState({
      queue: next,
      currentIndex: Math.max(0, Math.min(nextCurrentIndex, next.length - 1)),
    })

    toast('Queue order updated')
  }

  function handleReorder(index: number) {
    // Spotify-style handle. Mobile simple behavior:
    // tap handle to move song one step up. If it is already first non-current item, move it down.
    const firstMovableIndex = queue.findIndex((_, itemIndex) => itemIndex !== currentIndex)

    if (index === firstMovableIndex) {
      moveQueueItem(index, index + 1)
      return
    }

    moveQueueItem(index, index - 1)
  }

  function addRecommendedToQueue(track: Track) {
    usePlayerStore.setState({ queue: [...queue, { ...track }] })
    toast(`${track.title} added to queue`)
  }

  function toggleShuffleOnly() {
    toggleShuffle()
    toast(shuffleMode === 'off' ? 'Shuffle on' : 'Shuffle off')
  }

  function openTimer() {
    window.dispatchEvent(new CustomEvent('nyxora-open-sleep-timer'))
  }

  return (
    <div className="fixed inset-0 z-[85] bg-black/55 text-white backdrop-blur-sm">
      <button
        className="absolute inset-0 cursor-default"
        onClick={() => setQueueOpen(false)}
        aria-label="Close queue"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto flex h-[88vh] max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-[#202020] shadow-2xl">
        <div className="flex justify-center pt-4">
          <div className="h-1.5 w-24 rounded-full bg-white/30" />
        </div>

        <header className="flex items-start justify-between px-5 pb-7 pt-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-[42px] font-black leading-none">Queue</h1>
            <p className="mt-3 truncate text-[25px] text-white/58">
              {formatSource(playingFromTitle)}
            </p>
          </div>

          <button
            onClick={() => setEditMode(!editMode)}
            className="ml-4 rounded-full bg-white/12 px-7 py-4 text-[22px] font-black active:bg-white/20"
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </header>

        {currentTrack && (
          <section className="border-b border-white/10 px-5 pb-7">
            <div className="flex items-center gap-4">
              <SafeImage
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="h-20 w-20 rounded-md object-cover"
                loading="eager"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[28px] font-semibold leading-tight text-emerald-400">
                  ▮▮ {currentTrack.title}
                </p>
                <p className="mt-2 truncate text-[22px] text-white/55">
                  {currentTrack.artist}
                </p>
              </div>

              <button
                onClick={() => setPlaying(!isPlaying)}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black active:scale-95"
              >
                {isPlaying ? <Pause size={38} fill="black" /> : <Play size={38} fill="black" />}
              </button>
            </div>
          </section>
        )}

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
          {queue.length > 1 && (
            <>
              <p className="mb-6 text-[28px] font-medium text-white/50">Next up</p>

              <div className="space-y-1">
                {queue.map((track, index) => {
                  if (index === currentIndex) return null

                  return (
                    <QueueSongRow
                      key={`${track.id}-${index}`}
                      track={track}
                      editMode={editMode}
                      onPlay={() => playQueueIndex(index)}
                      onRemove={() => removeQueueItem(index)}
                      onReorder={() => handleReorder(index)}
                    />
                  )
                })}
              </div>
            </>
          )}

          <div className="mt-8">
            <p className="mb-6 text-[28px] font-medium text-white/50">
              Next up: Recommended tracks
            </p>

            <div className="space-y-1 pb-40">
              {recommended.map((track) => (
                <QueueSongRow
                  key={`recommended-${track.id}`}
                  track={track}
                  editMode={false}
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
                  onReorder={() => addRecommendedToQueue(track)}
                />
              ))}
            </div>
          </div>
        </section>

        <footer className="absolute inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-[#202020] via-[#202020] to-transparent px-5 pb-5 pt-8">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={toggleShuffleOnly}
              className={`rounded-2xl px-4 py-5 text-center active:scale-95 ${
                shuffleMode !== 'off' ? 'bg-emerald-500 text-black' : 'bg-white/12 text-white'
              }`}
            >
              <Shuffle className="mx-auto" size={34} />
              <p className="mt-2 text-[20px] font-bold">
                {shuffleMode !== 'off' ? 'Shuffle on' : 'Shuffle'}
              </p>
            </button>

            <button
              onClick={toggleRepeat}
              className={`rounded-2xl px-4 py-5 text-center active:scale-95 ${
                repeatMode !== 'off' ? 'bg-emerald-500 text-black' : 'bg-white/12 text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <div className="relative mx-auto w-fit">
                  <Repeat size={34} />
                  <span className="absolute -right-2 -top-2 text-xs font-black">1</span>
                </div>
              ) : (
                <Repeat className="mx-auto" size={34} />
              )}
              <p className="mt-2 text-[20px] font-bold">
                {repeatMode === 'one' ? 'Repeat 1' : repeatMode === 'all' ? 'Repeat all' : 'Repeat'}
              </p>
            </button>

            <button
              onClick={openTimer}
              className="rounded-2xl bg-white/12 px-4 py-5 text-center text-white active:scale-95"
            >
              <Timer className="mx-auto" size={34} />
              <p className="mt-2 text-[20px] font-bold">Timer</p>
            </button>
          </div>

          {editMode && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-white/45">
              <CheckCircle2 size={16} />
              Select remove icons to delete songs from queue
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
