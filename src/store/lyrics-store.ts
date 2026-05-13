import { create } from 'zustand'
import type { LyricsResult } from '../lib/lyrics.functions'
import { fetchLyrics } from '../lib/lyrics.functions'
import type { Track } from '../types/music'

interface LyricsState {
  trackId: string | null
  lyrics: LyricsResult | null
  loading: boolean
  error: string | null
  loadLyrics: (track: Track | null) => Promise<void>
  clearLyrics: () => void
}

export const useLyricsStore = create<LyricsState>((set, get) => ({
  trackId: null,
  lyrics: null,
  loading: false,
  error: null,

  loadLyrics: async (track) => {
    if (!track) {
      set({ trackId: null, lyrics: null, loading: false, error: null })
      return
    }

    const current = get()
    if (current.trackId === track.id && current.lyrics) return

    set({ trackId: track.id, loading: true, error: null })

    try {
      const lyrics = await fetchLyrics(track)

      if (get().trackId === track.id) {
        set({ lyrics, loading: false, error: null })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lyrics failed'
      if (get().trackId === track.id) {
        set({ lyrics: null, loading: false, error: message })
      }
    }
  },

  clearLyrics: () => set({ trackId: null, lyrics: null, loading: false, error: null }),
}))
