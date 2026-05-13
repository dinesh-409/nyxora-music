import type { LyricsLine, Track } from '../types/music'
import { parseLrc } from './lrc'

const LRCLIB_API_BASE =
  (import.meta.env.VITE_LRCLIB_API_BASE as string | undefined) || 'https://lrclib.net/api'

export interface LyricsResult {
  synced: boolean
  lines: LyricsLine[]
  plainLyrics: string | null
  source: 'lrclib' | 'missing'
  message?: string
}

export function normalizeYouTubeTitle(title: string): string {
  return title
    .replace(/\(.*?official.*?\)/gi, '')
    .replace(/\[.*?official.*?\]/gi, '')
    .replace(/official video/gi, '')
    .replace(/official music video/gi, '')
    .replace(/full video song/gi, '')
    .replace(/full song/gi, '')
    .replace(/lyrical video/gi, '')
    .replace(/lyrics/gi, '')
    .replace(/audio/gi, '')
    .replace(/\|.*$/g, '')
    .replace(/#\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeArtistName(artist: string): string {
  return artist
    .replace(/official/gi, '')
    .replace(/vevo/gi, '')
    .replace(/records/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchLyrics(track: Track): Promise<LyricsResult> {
  if (!track?.title) {
    return {
      synced: false,
      lines: [],
      plainLyrics: null,
      source: 'missing',
      message: 'Lyrics not available for this song',
    }
  }

  const title = normalizeYouTubeTitle(track.title)
  const artist = normalizeArtistName(track.artist || track.channelName || '')

  const params = new URLSearchParams()
  params.set('track_name', title)
  if (artist) params.set('artist_name', artist)
  if (track.duration && Number.isFinite(track.duration)) {
    params.set('duration', String(Math.round(track.duration)))
  }

  try {
    const response = await fetch(`${LRCLIB_API_BASE}/get?${params.toString()}`)

    if (!response.ok) {
      return {
        synced: false,
        lines: [],
        plainLyrics: null,
        source: 'missing',
        message: 'Lyrics not available for this song',
      }
    }

    const data = (await response.json()) as {
      syncedLyrics?: string | null
      plainLyrics?: string | null
    }

    if (data.syncedLyrics) {
      const lines = parseLrc(data.syncedLyrics)
      return {
        synced: lines.length > 0,
        lines,
        plainLyrics: data.plainLyrics ?? null,
        source: 'lrclib',
      }
    }

    if (data.plainLyrics) {
      return {
        synced: false,
        lines: [],
        plainLyrics: data.plainLyrics,
        source: 'lrclib',
      }
    }

    return {
      synced: false,
      lines: [],
      plainLyrics: null,
      source: 'missing',
      message: 'Lyrics not available for this song',
    }
  } catch (error) {
    console.warn('Lyrics fetch failed safely:', error)

    return {
      synced: false,
      lines: [],
      plainLyrics: null,
      source: 'missing',
      message: 'Lyrics not available for this song',
    }
  }
}
