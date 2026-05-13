import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RepeatMode, SeekSource, ShuffleMode, Track } from '../types/music'

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  currentIndex: number
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  repeatMode: RepeatMode
  shuffleMode: ShuffleMode
  autoplay: boolean
  seekSource: SeekSource
  playCounts: Record<string, number>
  playlistOpens: Record<string, number>
  searchHistory: string[]
  recentSearchItems: Track[]

  setCurrentTrack: (track: Track | null) => void
  setQueue: (queue: Track[], startIndex?: number) => void
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
  incrementPlayCount: (trackId: string) => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      repeatMode: 'off',
      shuffleMode: 'off',
      autoplay: true,
      seekSource: 'player-control',
      playCounts: {},
      playlistOpens: {},
      searchHistory: [],
      recentSearchItems: [],

      setCurrentTrack: (track) =>
        set({
          currentTrack: track,
          currentTime: 0,
          isLoading: Boolean(track),
        }),

      setQueue: (queue, startIndex = 0) => {
        const safeQueue = Array.isArray(queue) ? queue.filter(Boolean) : []
        const safeIndex = safeQueue[startIndex] ? startIndex : safeQueue.length ? 0 : -1

        set({
          queue: safeQueue,
          currentIndex: safeIndex,
          currentTrack: safeIndex >= 0 ? safeQueue[safeIndex] : null,
          currentTime: 0,
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

      seekTo: (time, source = 'player-control') =>
        set({
          currentTime: Number.isFinite(time) ? Math.max(0, time) : 0,
          seekSource: source,
        }),

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
          isLoading: true,
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
          isLoading: true,
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

      incrementPlayCount: (trackId) => {
        if (!trackId) return
        const counts = get().playCounts
        set({ playCounts: { ...counts, [trackId]: (counts[trackId] ?? 0) + 1 } })
      },
    }),
    {
      name: 'nyxora-player-store',
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        currentIndex: state.currentIndex,
        repeatMode: state.repeatMode,
        shuffleMode: state.shuffleMode,
        autoplay: state.autoplay,
        playCounts: state.playCounts,
        playlistOpens: state.playlistOpens,
        searchHistory: state.searchHistory,
        recentSearchItems: state.recentSearchItems,
      }),
    },
  ),
)
