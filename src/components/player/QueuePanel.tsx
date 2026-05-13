import { useEffect, useMemo, useRef, type CSSProperties, type TouchEvent } from 'react'
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
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ListMusic, Menu, Pause, Play, Repeat, Shuffle, Timer, X } from 'lucide-react'
import { usePlayerStore, type QueuedTrack } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'
import { getRecommendedQueue } from '../../lib/queue-recommendations'
import type { Track } from '../../types/music'

type QueueDisplayItem = QueuedTrack & {
  sourceType: 'queued' | 'recommended'
}

function toast(message: string) {
  window.dispatchEvent(new CustomEvent('nyxora-toast', { detail: message }))
}

function createQueueItem(
  track: Track,
  sourceType: 'queued' | 'recommended' = 'queued',
  index = 0,
): QueueDisplayItem {
  const existing = track as Track & { queueItemId?: string; sourceType?: 'queued' | 'recommended' }

  return {
    ...track,
    queueItemId:
      existing.queueItemId ||
      `${sourceType}-${track.id}-${track.videoId || 'no-video'}-${index}`,
    sourceType,
  }
}

function cleanTrack(track: Track | QueuedTrack): Track {
  const next = { ...track } as Track & { queueItemId?: string; sourceType?: string }
  delete next.queueItemId
  delete next.sourceType
  return next
}

function formatPlayingText(value?: string | null, currentTrack?: Track | null) {
  if (value?.toLowerCase().startsWith('search:')) {
    const query = value.replace(/^search:/i, '').trim()
    return `Playing ${query}`
  }

  if (value) return `Playing ${value}`
  return currentTrack?.title ? `Playing ${currentTrack.title}` : 'Playing music'
}

function SortableQueueRow({
  item,
  editMode,
  onPlay,
  onRemove,
}: {
  item: QueueDisplayItem
  editMode: boolean
  onPlay: () => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.queueItemId,
    disabled: editMode,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isRecommended = item.sourceType === 'recommended'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 py-3 ${
        isDragging ? 'z-50 scale-[1.02] rounded-2xl bg-white/10 px-2 shadow-2xl' : ''
      }`}
    >
      <SafeImage
        src={item.thumbnail}
        alt={item.title}
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
          {item.title}
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-[16px] text-white/60">
          {isRecommended ? (
            <span className="grid h-4 w-4 place-items-center rounded-[3px] bg-emerald-500 text-[10px] text-black">
              ✦
            </span>
          ) : (
            <ListMusic size={15} className="shrink-0 text-emerald-400" />
          )}
          {item.artist}
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
          className="cursor-grab touch-none select-none rounded-md p-2 text-white/90 active:cursor-grabbing active:bg-white/10"
          style={{ touchAction: 'none' }}
          aria-label="Press and hold to reorder"
          {...attributes}
          {...listeners}
        >
          <Menu size={31} />
        </button>
      )}
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
  const playingFromTitle = state.playingFromTitle as string | null | undefined
  const repeatMode = state.repeatMode ?? 'off'
  const shuffleMode = state.shuffleMode ?? 'off'

  const queuedTracks = ((state.queuedTracks ?? []) as QueuedTrack[]).filter((item) =>
    Boolean(item.queueItemId),
  )

  const playbackQueue = (state.queue ?? []) as Track[]

  const recommendedTracks = useMemo(() => {
    try {
      const saved = (state.recommendedTracks ?? []) as Track[]
      if (saved.length) return saved
      return getRecommendedQueue(currentTrack, playbackQueue)
    } catch {
      return []
    }
  }, [currentTrack?.id, playbackQueue.length, state.recommendedTracks?.length])

  const displayItems: QueueDisplayItem[] = useMemo(() => {
    const queuedItems: QueueDisplayItem[] = queuedTracks.map((track, index) => ({
      ...track,
      queueItemId: track.queueItemId || `queued-${track.id}-${track.videoId || 'no-video'}-${index}`,
      sourceType: 'queued' as const,
    }))

    const queuedKeys = new Set(
      queuedItems.map((track) => `${track.id}-${track.videoId ?? ''}`),
    )

    const recommendedItems: QueueDisplayItem[] = recommendedTracks
      .filter((track) => !queuedKeys.has(`${track.id}-${track.videoId ?? ''}`))
      .map((track, index) => createQueueItem(track, 'recommended', index))

    return [...queuedItems, ...recommendedItems].filter((item) => Boolean(item.queueItemId))
  }, [queuedTracks, recommendedTracks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 140, tolerance: 6 },
    }),
  )

  useEffect(() => {
    function openQueue() {
      usePlayerStore.setState({ isQueueOpen: true })
    }

    window.addEventListener('nyxora-open-queue', openQueue)
    return () => window.removeEventListener('nyxora-open-queue', openQueue)
  }, [])

  if (!isQueueOpen) return null

  function syncDisplayItemsToQueue(items: QueueDisplayItem[]) {
    const normalizedQueuedTracks: QueuedTrack[] = items.map((item) => ({
      ...cleanTrack(item),
      queueItemId: item.queueItemId,
    }))

    usePlayerStore.setState({
      queuedTracks: normalizedQueuedTracks,
      queue: [
        ...(currentTrack ? [currentTrack] : []),
        ...normalizedQueuedTracks.map((item) => cleanTrack(item)),
      ],
      recommendedTracks: [],
    })
  }

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
    usePlayerStore.setState({ queuedTracks: [], recommendedTracks: [] })
    toast('Queue cleared')
  }

  function removeDisplayItem(index: number) {
    const next = displayItems.filter((_, itemIndex) => itemIndex !== index)
    syncDisplayItemsToQueue(next)
  }

  function playDisplayItem(index: number) {
    const selected = displayItems[index]
    if (!selected) return

    const selectedTrack = cleanTrack(selected)
    const nextDisplayItems = displayItems.filter((_, itemIndex) => itemIndex !== index)

    const nextQueuedTracks: QueuedTrack[] = nextDisplayItems.map((item) => ({
      ...cleanTrack(item),
      queueItemId: item.queueItemId,
    }))

    usePlayerStore.setState({
      currentTrack: selectedTrack,
      queuedTracks: nextQueuedTracks,
      queue: [
        selectedTrack,
        ...nextQueuedTracks.map((item) => cleanTrack(item)),
      ],
      recommendedTracks: [],
      currentIndex: 0,
      isPlaying: true,
      isLoading: true,
      currentTime: 0,
      playerLoadKey: (state.playerLoadKey ?? 0) + 1,
    })

    toast(`Playing ${selectedTrack.title}`)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayItems.findIndex((item) => item.queueItemId === active.id)
    const newIndex = displayItems.findIndex((item) => item.queueItemId === over.id)

    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(displayItems, oldIndex, newIndex)
    syncDisplayItemsToQueue(reordered)
    toast('Queue order updated')
  }

  function onHandleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartY.current = event.touches[0].clientY
  }

  function onHandleTouchEnd(event: TouchEvent<HTMLDivElement>) {
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
            {displayItems.length > 0 && (
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
            About{' '}
            <span className="font-normal text-white/65">
              recommendations and the impact of promotion
            </span>
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
          {displayItems.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayItems.map((item) => String(item.queueItemId))}
                strategy={verticalListSortingStrategy}
              >
                {displayItems.map((item, index) => (
                  <SortableQueueRow
                    key={item.queueItemId}
                    item={item}
                    editMode={isQueueEditMode}
                    onPlay={() => playDisplayItem(index)}
                    onRemove={() => removeDisplayItem(index)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </section>

        <footer className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1f1f1f] via-[#1f1f1f] to-transparent px-5 pb-5 pt-5">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                state.toggleShuffle?.()
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
