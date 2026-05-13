import { create } from 'zustand'
import type { LyricsResult } from '../lib/lyrics.functions'
import { fetchLyrics } from '../lib/lyrics.functions'
import type { Track } from '../types/music'

const LYRICS_MATCH_VERSION = 'strict-v2'

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

    const cacheKey = `${LYRICS_MATCH_VERSION}:${track.id}`
    const cached = get().cache[cacheKey]
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
            [cacheKey]: lyrics,
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
    const cacheKey = `${LYRICS_MATCH_VERSION}:${track.id}`
    if (get().cache[cacheKey]) return

    try {
      const lyrics = await fetchLyrics(track)
      set((state) => ({
        cache: {
          ...state.cache,
          [cacheKey]: lyrics,
        },
      }))
    } catch {
      // safe prefetch fail
    }
  },

  clearLyrics: () => set({ trackId: null, lyrics: null, loading: false, error: null }),
}))
