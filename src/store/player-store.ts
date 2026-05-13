import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RepeatMode, SeekSource, ShuffleMode, Track } from '../types/music'

export type QueuedTrack = Track & {
  queueItemId: string
}

const makeQueueItem = (track: Track): QueuedTrack & { sourceType?: 'queued' | 'recommended' } => ({
  ...track,
  sourceType: 'queued',
  queueItemId:
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `queued-${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
})


interface PlayerState {
  currentTrack: Track | null
  playingFromTitle: string
  queue: Track[]
  queuedTracks: QueuedTrack[]
  recommendedTracks: Track[]
  queueDisplayItems: (QueuedTrack & { sourceType?: 'queued' | 'recommended' })[]
  currentIndex: number
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  seekRequest: number | null
  repeatMode: RepeatMode
  shuffleMode: ShuffleMode
  autoplay: boolean
  seekSource: SeekSource
  lyricsOffset: number
  savedLyricsOffsets: Record<string, number>
  playCounts: Record<string, number>
  playlistOpens: Record<string, number>
  searchHistory: string[]
  recentSearchItems: Track[]
  likedTrackIds: string[]
  isFullPlayerOpen: boolean
  sleepTimerMinutes: number | null
  isQueueOpen: boolean
  isQueueExpanded: boolean
  isQueueEditMode: boolean
  playerLoadKey: number

  setCurrentTrack: (track: Track | null, playingFromTitle?: string) => void
  setQueue: (queue: Track[], startIndex?: number, playingFromTitle?: string) => void
  setPlayingFromTitle: (title: string) => void
  setPlaying: (playing: boolean) => void
  setLoading: (loading: boolean) => void
  setCurrentTime: (time: number, source?: SeekSource) => void
  setDuration: (duration: number) => void
  seekTo: (time: number, source?: SeekSource) => void
  nextTrack: () => void
  previousTrack: () => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  setAutoplay: (enabled: boolean) => void
  addSearchQuery: (query: string) => void
  clearSearchHistory: () => void
  removeSearchQuery: (query: string) => void
  incrementPlayCount: (trackId: string) => void
  setFullPlayerOpen: (open: boolean) => void
  toggleLikeCurrentTrack: () => void
  addCurrentTrackToQueue: () => void
  addTrackToQueue: (track: Track) => void
  removeQueuedTrack: (queueItemId: string) => void
  clearQueuedTracks: () => void
  moveQueuedTrack: (activeId: string, overId: string) => void
  setRecommendedTracks: (tracks: Track[]) => void
  setQueueExpanded: (value: boolean) => void
  setSleepTimer: (minutes: number | null) => void
  setQueueOpen: (open: boolean) => void
  playQueueIndex: (index: number) => void
  clearQueue: () => void
  removeQueueItem: (index: number) => void
  adjustLyricsOffset: (amount: number) => void
  resetLyricsOffset: () => void
  applySavedLyricsOffset: (trackId: string) => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      playingFromTitle: 'Nyxora Music',
      queue: [],
      queuedTracks: [],
      recommendedTracks: [],
      queueDisplayItems: [],
      currentIndex: -1,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      seekRequest: null,
      repeatMode: 'off',
      shuffleMode: 'off',
      autoplay: true,
      seekSource: 'player-control',
      lyricsOffset: 0,
      savedLyricsOffsets: {},
      playCounts: {},
      playlistOpens: {},
      searchHistory: [],
      recentSearchItems: [],
      likedTrackIds: [],
      isFullPlayerOpen: false,
      sleepTimerMinutes: null,
      isQueueOpen: false,
      isQueueExpanded: false,
      isQueueEditMode: false,
      playerLoadKey: 0,

      setCurrentTrack: (track, playingFromTitle = 'Nyxora Music') =>
        set({
          currentTrack: track,
          playingFromTitle,
          currentTime: 0,
          lyricsOffset: track?.id ? get().savedLyricsOffsets[track.id] ?? 0 : 0,
          isLoading: Boolean(track),
        }),

      setPlayingFromTitle: (title) => set({ playingFromTitle: title || 'Nyxora Music' }),

      setQueue: (queue, startIndex = 0, playingFromTitle = 'Nyxora Music') => {
        const safeQueue = Array.isArray(queue) ? queue.filter(Boolean) : []
        const safeIndex = safeQueue[startIndex] ? startIndex : safeQueue.length ? 0 : -1

        set({
          queue: safeQueue,
          currentIndex: safeIndex,
          currentTrack: safeIndex >= 0 ? safeQueue[safeIndex] : null,
          playingFromTitle,
          currentTime: 0,
          lyricsOffset: safeIndex >= 0 ? get().savedLyricsOffsets[safeQueue[safeIndex].id] ?? 0 : 0,
          isLoading: safeIndex >= 0,
        })
      },

      setPlaying: (playing) => set({ isPlaying: playing }),
      setLoading: (loading) => set({ isLoading: loading }),

      setCurrentTime: (time, source = 'player-control') =>
        set({
          currentTime: Number.isFinite(time) ? Math.max(0, time) : 0,
          seekSource: source,
        }),

      setDuration: (duration) =>
        set({
          duration: Number.isFinite(duration) ? Math.max(0, duration) : 0,
        }),

      seekTo: (time, source = 'player-control') => {
        const safeTime = Number.isFinite(time) ? Math.max(0, time) : 0
        set({
          currentTime: safeTime,
          seekRequest: safeTime,
          seekSource: source,
        })
      },

      nextTrack: () => {
        const { queue, currentIndex, repeatMode, shuffleMode } = get()

        if (!queue.length) {
          set({ currentTrack: null, currentIndex: -1, isPlaying: false, currentTime: 0 })
          return
        }

        if (repeatMode === 'one' && queue[currentIndex]) {
          set({ currentTrack: queue[currentIndex], currentTime: 0, isLoading: true })
          return
        }

        let nextIndex = currentIndex + 1

        if (shuffleMode !== 'off' && queue.length > 1) {
          const available = queue.map((_, index) => index).filter((index) => index !== currentIndex)
          nextIndex = available[Math.floor(Math.random() * available.length)] ?? currentIndex
        }

        if (nextIndex >= queue.length) {
          if (repeatMode === 'all') nextIndex = 0
          else {
            set({ isPlaying: false, currentTime: 0 })
            return
          }
        }

        const next = queue[nextIndex]
        if (!next) {
          set({ isPlaying: false })
          return
        }

        set({
          currentIndex: nextIndex,
          currentTrack: next,
          currentTime: 0,
          lyricsOffset: get().savedLyricsOffsets[next.id] ?? 0,
          isLoading: true,
          playerLoadKey: get().playerLoadKey + 1,
        })
      },

      previousTrack: () => {
        const { queue, currentIndex } = get()
        if (!queue.length) return

        const previousIndex = currentIndex > 0 ? currentIndex - 1 : 0
        const previous = queue[previousIndex]
        if (!previous) return

        set({
          currentIndex: previousIndex,
          currentTrack: previous,
          currentTime: 0,
          lyricsOffset: get().savedLyricsOffsets[previous.id] ?? 0,
          isLoading: true,
          playerLoadKey: get().playerLoadKey + 1,
        })
      },

      toggleRepeat: () => {
        const current = get().repeatMode
        const next: RepeatMode = current === 'off' ? 'all' : current === 'all' ? 'one' : 'off'
        set({ repeatMode: next })
      },

      toggleShuffle: () => {
        const current = get().shuffleMode
        set({ shuffleMode: current === 'off' ? 'standard' : 'off' })
      },

      setAutoplay: (enabled) => set({ autoplay: enabled }),

      addSearchQuery: (query) => {
        const clean = query.trim()
        if (!clean) return
        const current = get().searchHistory.filter((item) => item !== clean)
        set({ searchHistory: [clean, ...current].slice(0, 20) })
      },

      clearSearchHistory: () => set({ searchHistory: [], recentSearchItems: [] }),

      removeSearchQuery: (query) => {
        const clean = query.trim()
        if (!clean) return
        set({
          searchHistory: get().searchHistory.filter((item) => item !== clean),
        })
      },

      incrementPlayCount: (trackId) => {
        if (!trackId) return
        const counts = get().playCounts
        set({ playCounts: { ...counts, [trackId]: (counts[trackId] ?? 0) + 1 } })
      },

      setFullPlayerOpen: (open) => set({ isFullPlayerOpen: open }),

      toggleLikeCurrentTrack: () => {
        const track = get().currentTrack
        if (!track?.id) return

        const liked = get().likedTrackIds
        const exists = liked.includes(track.id)

        set({
          likedTrackIds: exists
            ? liked.filter((id) => id !== track.id)
            : [track.id, ...liked],
        })
      },

      addCurrentTrackToQueue: () => {
        const track = get().currentTrack
        if (!track) return
        set({ queue: [...get().queue, { ...track }] })
      },

      addTrackToQueue: (track) => {
        if (!track?.id) return

        set({
          queuedTracks: [...get().queuedTracks, makeQueueItem(track)],
          queue: [...get().queue, { ...track }],
        })
      },

      removeQueuedTrack: (queueItemId) =>
        set({
          queuedTracks: get().queuedTracks.filter((item) => item.queueItemId !== queueItemId),
        }),

      clearQueuedTracks: () =>
        set({
          queuedTracks: [],
        }),

      moveQueuedTrack: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.queuedTracks.findIndex((item) => item.queueItemId === activeId)
          const newIndex = state.queuedTracks.findIndex((item) => item.queueItemId === overId)

          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return {}

          const updated = [...state.queuedTracks]
          const [moved] = updated.splice(oldIndex, 1)
          updated.splice(newIndex, 0, moved)

          return { queuedTracks: updated }
        }),

      setRecommendedTracks: (tracks) => set({ recommendedTracks: tracks }),

      setQueueExpanded: (value) => set({ isQueueExpanded: value }),

      setSleepTimer: (minutes) => set({ sleepTimerMinutes: minutes }),

      setQueueOpen: (open) => set({ isQueueOpen: open }),

      playQueueIndex: (index) => {
        const queue = get().queue
        const track = queue[index]

        if (!track) return

        set({
          currentIndex: index,
          currentTrack: track,
          currentTime: 0,
          lyricsOffset: get().savedLyricsOffsets[track.id] ?? 0,
          isPlaying: true,
          isLoading: true,
        })
      },

      clearQueue: () => {
        const current = get().currentTrack
        set({
          queue: current ? [current] : [],
          currentIndex: current ? 0 : -1,
        })
      },

      removeQueueItem: (index) => {
        const state = get()
        const nextQueue = state.queue.filter((_, itemIndex) => itemIndex !== index)

        let nextIndex = state.currentIndex
        if (index < state.currentIndex) nextIndex -= 1
        if (index === state.currentIndex) {
          const fallback = nextQueue[index] ?? nextQueue[index - 1] ?? null
          set({
            queue: nextQueue,
            currentIndex: fallback ? Math.max(0, Math.min(index, nextQueue.length - 1)) : -1,
            currentTrack: fallback,
            isPlaying: Boolean(fallback),
            currentTime: 0,
          })
          return
        }

        set({
          queue: nextQueue,
          currentIndex: nextIndex,
        })
      },

      adjustLyricsOffset: (amount) => {
        const current = get().lyricsOffset
        const next = Math.max(-30, Math.min(30, Number((current + amount).toFixed(2))))
        const track = get().currentTrack

        if (track?.id) {
          set({
            lyricsOffset: next,
            savedLyricsOffsets: {
              ...get().savedLyricsOffsets,
              [track.id]: next,
            },
          })
        } else {
          set({ lyricsOffset: next })
        }
      },

      resetLyricsOffset: () => {
        const track = get().currentTrack
        if (track?.id) {
          const saved = { ...get().savedLyricsOffsets }
          delete saved[track.id]
          set({ lyricsOffset: 0, savedLyricsOffsets: saved })
        } else {
          set({ lyricsOffset: 0 })
        }
      },

      applySavedLyricsOffset: (trackId) => {
        set({ lyricsOffset: get().savedLyricsOffsets[trackId] ?? 0 })
      },
    }),
    {
      name: 'nyxora-player-store',
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        playingFromTitle: state.playingFromTitle,
        queue: state.queue,
        currentIndex: state.currentIndex,
        repeatMode: state.repeatMode,
        shuffleMode: state.shuffleMode,
        autoplay: state.autoplay,
        playCounts: state.playCounts,
        playlistOpens: state.playlistOpens,
        searchHistory: state.searchHistory,
        recentSearchItems: state.recentSearchItems,
        likedTrackIds: state.likedTrackIds,
        sleepTimerMinutes: state.sleepTimerMinutes,
        isQueueOpen: state.isQueueOpen,
        isQueueExpanded: state.isQueueExpanded,
        isQueueEditMode: state.isQueueEditMode,
        queuedTracks: state.queuedTracks,
        recommendedTracks: state.recommendedTracks,
        queueDisplayItems: state.queueDisplayItems,
        playerLoadKey: state.playerLoadKey,
        savedLyricsOffsets: state.savedLyricsOffsets,
      }),
    },
  ),
)
