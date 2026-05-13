import { useEffect, useMemo, useRef } from 'react'
import { ListMusic, Menu, Pause, Play, Repeat, Shuffle, Timer, X } from 'lucide-react'
import { usePlayerStore, type QueuedTrack } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'
import { getRecommendedQueue } from '../../lib/queue-recommendations'
import type { Track } from '../../types/music'

function toast(message: string) {
  window.dispatchEvent(new CustomEvent('nyxora-toast', { detail: message }))
}

function queueId(track: QueuedTrack) {
  return track.queueItemId
}

function formatPlayingText(value?: string | null, currentTrack?: Track | null) {
  if (value?.toLowerCase().startsWith('search:')) {
    const query = value.replace(/^search:/i, '').trim()
    return `Playing ${query}`
  }

  if (value) return `Playing ${value}`
  return currentTrack?.title ? `Playing ${currentTrack.title}` : 'Playing music'
}

function removeQueueItemAt(items: QueuedTrack[], index: number): QueuedTrack[] {
  return items.filter((_, itemIndex) => itemIndex !== index)
}

function moveQueueItem(items: QueuedTrack[], from: number, to: number): QueuedTrack[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return items

  const next = [...items]
  const [moved] = next.splice(from, 1)
  if (!moved) return items
  next.splice(to, 0, moved)
  return next
}

function QueuedRow({
  track,
  editMode,
  onPlay,
  onRemove,
  onMove,
}: {
  track: QueuedTrack
  editMode: boolean
  onPlay: () => void
  onRemove: () => void
  onMove: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <SafeImage
        src={track.thumbnail}
        alt={track.title}
        className="h-14 w-14 shrink-0 rounded-md object-cover"
        loading="eager"
      />

      <button
        onClick={() => {
          if (editMode) onRemove()
          else onPlay()
        }}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-[20px] font-semibold leading-tight text-white">
          {track.title}
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-[16px] text-white/60">
          <ListMusic size={15} className="shrink-0 text-emerald-400" />
          {track.artist}
        </p>
      </button>

      {editMode ? (
        <button
          onClick={onRemove}
          className="grid h-10 w-10 place-items-center rounded-full text-red-300 active:bg-white/10"
          aria-label="Remove from queue"
        >
          <X size={24} />
        </button>
      ) : (
        <button
          onClick={onMove}
          className="rounded-md p-2 text-white/90 active:bg-white/10"
          aria-label="Reorder song"
        >
          <Menu size={31} />
        </button>
      )}
    </div>
  )
}

function RecommendedRow({
  track,
  onAdd,
  onPlay,
}: {
  track: Track
  onAdd: () => void
  onPlay: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <SafeImage
        src={track.thumbnail}
        alt={track.title}
        className="h-14 w-14 shrink-0 rounded-md object-cover"
        loading="eager"
      />

      <button onClick={onPlay} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[20px] font-semibold leading-tight text-white">
          {track.title}
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-[16px] text-white/60">
          <span className="grid h-4 w-4 place-items-center rounded-[3px] bg-emerald-500 text-[10px] text-black">
            ✦
          </span>
          {track.artist}
        </p>
      </button>

      <button
        onClick={onAdd}
        className="rounded-md p-2 text-white/80 active:bg-white/10"
        aria-label="Add recommended song to queue"
      >
        <Menu size={31} />
      </button>
    </div>
  )
}

export function QueuePanel() {
  const touchStartY = useRef<number | null>(null)

  const state = usePlayerStore() as any

  const currentTrack = state.currentTrack as Track | null
  const isPlaying = Boolean(state.isPlaying)
  const isQueueOpen = Boolean(state.isQueueOpen)
  const isQueueExpanded = Boolean(state.isQueueExpanded)
  const isQueueEditMode = Boolean(state.isQueueEditMode)
  const queuedTracks = ((state.queuedTracks ?? []) as QueuedTrack[]).filter((item) => Boolean(item.queueItemId))
  const queue = (state.queue ?? []) as Track[]
  const playingFromTitle = state.playingFromTitle as string | null | undefined
  const repeatMode = state.repeatMode ?? 'off'
  const shuffleMode = state.shuffleMode ?? 'off'

  const recommended = useMemo(() => {
    try {
      const saved = (state.recommendedTracks ?? []) as Track[]
      if (saved.length) return saved
      return getRecommendedQueue(currentTrack, queue)
    } catch {
      return []
    }
  }, [currentTrack?.id, queue.length, state.recommendedTracks?.length])

  useEffect(() => {
    function openQueue() {
      usePlayerStore.setState({ isQueueOpen: true })
    }

    window.addEventListener('nyxora-open-queue', openQueue)
    return () => window.removeEventListener('nyxora-open-queue', openQueue)
  }, [])

  if (!isQueueOpen) return null

  function closeQueue() {
    usePlayerStore.setState({ isQueueOpen: false })
  }

  function setExpanded(value: boolean) {
    usePlayerStore.setState({ isQueueExpanded: value })
  }

  function toggleEdit() {
    usePlayerStore.setState({ isQueueEditMode: !isQueueEditMode })
  }

  function clearQueue() {
    usePlayerStore.setState({ queuedTracks: [] })
    toast('Queue cleared')
  }

  function addToQueue(track: Track) {
    if (state.addTrackToQueue) state.addTrackToQueue(track)
    else {
      const item: QueuedTrack = {
        ...track,
        queueItemId: `${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      }
      usePlayerStore.setState({ queuedTracks: [...queuedTracks, item] })
    }
    toast(`${track.title} added to queue`)
  }

  function playTrack(track: Track) {
    const cleanTrack = { ...track } as Track

    usePlayerStore.setState({
      currentTrack: cleanTrack,
      isPlaying: true,
      isLoading: true,
      currentTime: 0,
      playerLoadKey: (state.playerLoadKey ?? 0) + 1,
    })
  }

  function removeAt(index: number) {
    usePlayerStore.setState({
      queuedTracks: removeQueueItemAt(queuedTracks, index),
    })
  }

  function moveAt(index: number) {
    if (queuedTracks.length <= 1) return

    const target = index === 0 ? 1 : index - 1
    usePlayerStore.setState({
      queuedTracks: moveQueueItem(queuedTracks, index, target),
    })
    toast('Queue order updated')
  }

  function onHandleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartY.current = event.touches[0].clientY
  }

  function onHandleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartY.current == null) return

    const diff = touchStartY.current - event.changedTouches[0].clientY
    if (diff > 30) setExpanded(true)
    if (diff < -30) setExpanded(false)

    touchStartY.current = null
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/45 text-white backdrop-blur-sm">
      <button
        className="absolute inset-0"
        onClick={closeQueue}
        aria-label="Close queue"
      />

      <div
        onClick={(event) => event.stopPropagation()}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-md flex-col rounded-t-[28px] bg-[#1f1f1f] shadow-2xl transition-all duration-300 ${
          isQueueExpanded ? 'h-[94vh]' : 'h-[72vh]'
        }`}
      >
        <div className="flex justify-center pb-2 pt-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(!isQueueExpanded)}
            onTouchStart={onHandleTouchStart}
            onTouchEnd={onHandleTouchEnd}
            className="h-1.5 w-16 rounded-full bg-white/40"
          />
        </div>

        <header className="flex items-start justify-between px-5 pt-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-[30px] font-black leading-none">Queue</h2>
            <p className="mt-2 truncate text-[17px] text-white/65">
              {formatPlayingText(playingFromTitle, currentTrack)}
            </p>
          </div>

          <div className="ml-3 flex items-center gap-2">
            {queuedTracks.length > 0 && (
              <button
                onClick={clearQueue}
                className="rounded-full bg-white/10 px-5 py-3 text-[16px] font-bold active:bg-white/20"
              >
                Clear
              </button>
            )}

            <button
              onClick={toggleEdit}
              className="rounded-full bg-white/10 px-5 py-3 text-[16px] font-bold active:bg-white/20"
            >
              {isQueueEditMode ? 'Done' : 'Edit'}
            </button>
          </div>
        </header>

        <div className="px-5 pt-3">
          <p className="text-[15px] font-bold text-white/90">
            About <span className="font-normal text-white/65">recommendations and the impact of promotion</span>
          </p>
        </div>

        {currentTrack && (
          <section className="flex items-center gap-3 px-5 py-5">
            <SafeImage
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="h-16 w-16 shrink-0 rounded-md object-cover"
              loading="eager"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[20px] font-semibold leading-tight text-emerald-400">
                … {currentTrack.title}
              </p>
              <p className="mt-1 truncate text-[16px] text-white/65">
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={() => usePlayerStore.setState({ isPlaying: !isPlaying })}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-black active:scale-95"
            >
              {isPlaying ? <Pause size={25} fill="black" /> : <Play size={25} fill="black" />}
            </button>
          </section>
        )}

        <section className="min-h-0 flex-1 overflow-y-auto px-5 pb-28">
          {queuedTracks.map((track, index) => (
            <QueuedRow
              key={queueId(track)}
              track={track}
              editMode={isQueueEditMode}
              onPlay={() => playTrack(track)}
              onRemove={() => removeAt(index)}
              onMove={() => moveAt(index)}
            />
          ))}

          {recommended.map((track) => (
            <RecommendedRow
              key={`rec-${track.id}-${track.videoId}`}
              track={track}
              onAdd={() => addToQueue(track)}
              onPlay={() => {
                addToQueue(track)
                playTrack(track)
              }}
            />
          ))}
        </section>

        <footer className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1f1f1f] via-[#1f1f1f] to-transparent px-5 pb-5 pt-5">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                if (state.toggleShuffle) state.toggleShuffle()
                toast(shuffleMode === 'off' ? 'Shuffle on' : 'Shuffle off')
              }}
              className={`rounded-2xl py-4 text-center font-semibold active:scale-95 ${
                shuffleMode !== 'off' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/45'
              }`}
            >
              <Shuffle className="mx-auto mb-1" size={28} />
              Shuffle
            </button>

            <button
              onClick={() => state.toggleRepeat?.()}
              className={`rounded-2xl py-4 text-center font-semibold active:scale-95 ${
                repeatMode !== 'off' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/45'
              }`}
            >
              <Repeat className="mx-auto mb-1" size={28} />
              {repeatMode === 'one' ? 'Repeat 1' : repeatMode === 'all' ? 'Repeat all' : 'Repeat'}
            </button>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('nyxora-open-sleep-timer'))}
              className="rounded-2xl bg-white/10 py-4 text-center font-semibold text-white active:scale-95"
            >
              <Timer className="mx-auto mb-1" size={28} />
              Timer
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
