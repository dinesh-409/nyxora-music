import { useEffect, useMemo, useRef } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ListMusic, Menu, Pause, Play, Repeat, Shuffle, Timer, X } from 'lucide-react'
import { usePlayerStore, type QueuedTrack } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'
import { getRecommendedQueue } from '../../lib/queue-recommendations'
import type { Track } from '../../types/music'

function toast(message: string) {
  window.dispatchEvent(new CustomEvent('nyxora-toast', { detail: message }))
}

function getQueueItemId(track: QueuedTrack) {
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

function SortableQueuedRow({
  track,
  editMode,
  onPlay,
  onRemove,
}: {
  track: QueuedTrack
  editMode: boolean
  onPlay: () => void
  onRemove: () => void
}) {
  const id = getQueueItemId(track)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: editMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 py-3 ${isDragging ? 'z-20 scale-[1.02] rounded-2xl bg-white/10 px-2' : ''}`}
    >
      <SafeImage
        src={track.thumbnail}
        alt={track.title}
        className="h-14 w-14 shrink-0 rounded-md object-cover"
        loading="eager"
      />

      <button
        onClick={() => {
          if (editMode) {
            onRemove()
            return
          }
          onPlay()
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
          className="flex h-10 w-10 items-center justify-center rounded-full text-red-300 active:bg-white/10"
          aria-label="Remove from queue"
        >
          <X size={25} />
        </button>
      ) : (
        <button
          className="touch-none rounded-md p-2 text-white/90 active:bg-white/10"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
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

  const {
    currentTrack,
    isPlaying,
    isQueueOpen,
    isQueueExpanded,
    isQueueEditMode,
    playingFromTitle,
    queuedTracks,
    recommendedTracks,
    queue,
    repeatMode,
    shuffleMode,
    setQueueOpen,
    setPlaying,
    setQueueExpanded,
    addTrackToQueue,
    removeQueuedTrack,
    clearQueuedTracks,
    moveQueuedTrack,
    setRecommendedTracks,
    toggleRepeat,
    toggleShuffle,
  } = usePlayerStore((state: any) => ({
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    isQueueOpen: state.isQueueOpen,
    isQueueExpanded: state.isQueueExpanded ?? false,
    isQueueEditMode: state.isQueueEditMode ?? false,
    playingFromTitle: state.playingFromTitle,
    queuedTracks: state.queuedTracks ?? [],
    recommendedTracks: state.recommendedTracks ?? [],
    queue: state.queue ?? [],
    repeatMode: state.repeatMode ?? 'off',
    shuffleMode: state.shuffleMode ?? 'off',
    setQueueOpen: state.setQueueOpen,
    setPlaying: state.setPlaying,
    setQueueExpanded: state.setQueueExpanded ?? ((value: boolean) => usePlayerStore.setState({ isQueueExpanded: value })),
    addTrackToQueue: state.addTrackToQueue,
    removeQueuedTrack: state.removeQueuedTrack,
    clearQueuedTracks: state.clearQueuedTracks,
    moveQueuedTrack: state.moveQueuedTrack,
    setRecommendedTracks: state.setRecommendedTracks,
    toggleRepeat: state.toggleRepeat,
    toggleShuffle: state.toggleShuffle,
  }))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 7 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 140, tolerance: 7 },
    }),
  )

  const fallbackRecommended = useMemo(
    () => getRecommendedQueue(currentTrack, queue),
    [currentTrack?.id, queue],
  )

  const recommendations: Track[] =
    recommendedTracks && recommendedTracks.length > 0 ? recommendedTracks : fallbackRecommended

  useEffect(() => {
    if (!currentTrack) return
    if (recommendedTracks?.length) return
    if (!setRecommendedTracks) return
    setRecommendedTracks(fallbackRecommended)
  }, [currentTrack?.id, fallbackRecommended, recommendedTracks?.length, setRecommendedTracks])

  const queueItems: QueuedTrack[] = queuedTracks ?? []

  const queueIds = useMemo(
    () => queueItems.map((item) => getQueueItemId(item)),
    [queueItems],
  )

  useEffect(() => {
    function openQueue() {
      usePlayerStore.setState({ isQueueOpen: true })
    }

    window.addEventListener('nyxora-open-queue', openQueue)
    return () => window.removeEventListener('nyxora-open-queue', openQueue)
  }, [])

  if (!isQueueOpen) return null

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    if (moveQueuedTrack) {
      moveQueuedTrack(String(active.id), String(over.id))
      toast('Queue order updated')
      return
    }

    const oldIndex = queueIds.indexOf(String(active.id))
    const newIndex = queueIds.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const next = [...queueItems]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)

    usePlayerStore.setState({ queuedTracks: next })
    toast('Queue order updated')
  }

  function playQueuedSong(track: QueuedTrack) {
    const normalTrack = { ...track } as Track & { queueItemId?: string }
    delete normalTrack.queueItemId

    usePlayerStore.setState({
      currentTrack: normalTrack,
      isPlaying: true,
      isLoading: true,
      currentTime: 0,
      playerLoadKey: ((usePlayerStore.getState() as any).playerLoadKey ?? 0) + 1,
    })
  }

  function playRecommended(track: Track) {
    addTrackToQueue(track)
    usePlayerStore.setState({
      currentTrack: track,
      isPlaying: true,
      isLoading: true,
      currentTime: 0,
      playerLoadKey: ((usePlayerStore.getState() as any).playerLoadKey ?? 0) + 1,
    })
  }

  function removeQueueItem(track: QueuedTrack, index: number) {
    const id = getQueueItemId(track)
    if (removeQueuedTrack) {
      removeQueuedTrack(id)
    } else {
      usePlayerStore.setState({
        queuedTracks: queueItems.filter((_, itemIndex) => itemIndex !== index),
      })
    }
  }

  function clearManualQueue() {
    if (clearQueuedTracks) {
      clearQueuedTracks()
    } else {
      usePlayerStore.setState({ queuedTracks: [] })
    }
    toast('Queue cleared')
  }

  function toggleEditMode() {
    usePlayerStore.setState({ isQueueEditMode: !isQueueEditMode })
  }

  function toggleExpandedFromHandle() {
    setQueueExpanded(!isQueueExpanded)
  }

  function onHandleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartY.current = event.touches[0].clientY
  }

  function onHandleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartY.current == null) return

    const endY = event.changedTouches[0].clientY
    const diff = touchStartY.current - endY

    if (diff > 30) setQueueExpanded(true)
    if (diff < -30) setQueueExpanded(false)

    touchStartY.current = null
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/45 text-white backdrop-blur-sm">
      <button
        className="absolute inset-0"
        onClick={() => setQueueOpen(false)}
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
            onClick={toggleExpandedFromHandle}
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
            {queueItems.length > 0 && (
              <button
                onClick={clearManualQueue}
                className="rounded-full bg-white/10 px-5 py-3 text-[16px] font-bold active:bg-white/20"
              >
                Clear
              </button>
            )}

            <button
              onClick={toggleEditMode}
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
              onClick={() => setPlaying(!isPlaying)}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-black active:scale-95"
            >
              {isPlaying ? <Pause size={25} fill="black" /> : <Play size={25} fill="black" />}
            </button>
          </section>
        )}

        <section className="min-h-0 flex-1 overflow-y-auto px-5 pb-28">
          {queueItems.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={queueIds} strategy={verticalListSortingStrategy}>
                {queueItems.map((track, index) => (
                  <SortableQueuedRow
                    key={getQueueItemId(track)}
                    track={track}
                    editMode={isQueueEditMode}
                    onPlay={() => playQueuedSong(track)}
                    onRemove={() => removeQueueItem(track, index)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {recommendations.map((track) => (
            <RecommendedRow
              key={`rec-${track.id}-${track.videoId}`}
              track={track}
              onAdd={() => {
                addTrackToQueue(track)
                toast(`${track.title} added to queue`)
              }}
              onPlay={() => playRecommended(track)}
            />
          ))}
        </section>

        <footer className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1f1f1f] via-[#1f1f1f] to-transparent px-5 pb-5 pt-5">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                toggleShuffle()
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
              onClick={toggleRepeat}
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
