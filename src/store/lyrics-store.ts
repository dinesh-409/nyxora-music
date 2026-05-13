import { create } from 'zustand'
import type { LyricsResult } from '../lib/lyrics.functions'
import { fetchLyrics } from '../lib/lyrics.functions'
import type { Track } from '../types/music'

interface LyricsState {
  trackId: string | null
  lyrics: LyricsResult | null
  loading: boolean
  error: string | null
  cache: Record<string, LyricsResult>
  loadLyrics: (track: Track | null) => Promise<void>
  prefetchLyrics: (track: Track | null) => Promise<void>
  clearLyrics: () => void
}

export const useLyricsStore = create<LyricsState>((set, get) => ({
  trackId: null,
  lyrics: null,
  loading: false,
  error: null,
  cache: {},

  loadLyrics: async (track) => {
    if (!track) {
      set({ trackId: null, lyrics: null, loading: false, error: null })
      return
    }

    const cached = get().cache[track.id]
    if (cached) {
      set({ trackId: track.id, lyrics: cached, loading: false, error: null })
      return
    }

    set({ trackId: track.id, loading: true, error: null })

    try {
      const lyrics = await fetchLyrics(track)

      if (get().trackId === track.id) {
        set((state) => ({
          lyrics,
          loading: false,
          error: null,
          cache: {
            ...state.cache,
            [track.id]: lyrics,
          },
        }))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lyrics failed'
      if (get().trackId === track.id) {
        set({ lyrics: null, loading: false, error: message })
      }
    }
  },

  prefetchLyrics: async (track) => {
    if (!track) return
    if (get().cache[track.id]) return

    try {
      const lyrics = await fetchLyrics(track)
      set((state) => ({
        cache: {
          ...state.cache,
          [track.id]: lyrics,
        },
      }))
    } catch {
      // safe prefetch fail
    }
  },

  clearLyrics: () => set({ trackId: null, lyrics: null, loading: false, error: null }),
}))
