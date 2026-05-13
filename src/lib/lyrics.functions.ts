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

interface LrclibTrack {
  id: number
  trackName?: string
  artistName?: string
  albumName?: string
  duration?: number
  syncedLyrics?: string | null
  plainLyrics?: string | null
}

const badVersionWords = [
  'remix',
  'live',
  'cover',
  'karaoke',
  'instrumental',
  'sped up',
  'slowed',
  'nightcore',
  'acoustic',
  'lofi',
  'lo-fi',
  '8d',
  'edit',
  'short',
  'reverb',
]

const removePatterns = [
  /\(.*?official.*?\)/gi,
  /\[.*?official.*?\]/gi,
  /\(.*?lyric.*?\)/gi,
  /\[.*?lyric.*?\]/gi,
  /\(.*?video.*?\)/gi,
  /\[.*?video.*?\]/gi,
  /official music video/gi,
  /official video/gi,
  /official song/gi,
  /full video song/gi,
  /full song/gi,
  /lyrical video/gi,
  /lyric video/gi,
  /lyrics video/gi,
  /lyrics/gi,
  /audio song/gi,
  /audio/gi,
  /video song/gi,
  /from .*$/gi,
  /feat\..*$/gi,
  /ft\..*$/gi,
  /#\w+/g,
]

export function normalizeYouTubeTitle(title: string): string {
  let clean = title

  for (const pattern of removePatterns) {
    clean = clean.replace(pattern, '')
  }

  clean = clean
    .replace(/\|.*$/g, '')
    .replace(/\/\/.*$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[-–—]\s*$/g, '')
    .trim()

  return clean
}

export function normalizeArtistName(artist: string): string {
  return artist
    .replace(/official/gi, '')
    .replace(/vevo/gi, '')
    .replace(/records/gi, '')
    .replace(/music/gi, '')
    .replace(/label/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitTitleAndArtist(title: string, fallbackArtist: string) {
  const cleaned = normalizeYouTubeTitle(title)

  const separators = [' - ', ' – ', ' — ', '|']
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const [left, right] = cleaned.split(sep).map((x) => x.trim())
      if (left && right) {
        return {
          artist: normalizeArtistName(left),
          title: normalizeYouTubeTitle(right),
        }
      }
    }
  }

  return {
    artist: normalizeArtistName(fallbackArtist),
    title: cleaned,
  }
}

function toLyricsResult(item: LrclibTrack | null): LyricsResult | null {
  if (!item) return null

  if (item.syncedLyrics) {
    const lines = parseLrc(item.syncedLyrics)

    if (lines.length > 0) {
      return {
        synced: true,
        lines,
        plainLyrics: item.plainLyrics ?? null,
        source: 'lrclib',
      }
    }
  }

  if (item.plainLyrics) {
    return {
      synced: false,
      lines: [],
      plainLyrics: item.plainLyrics,
      source: 'lrclib',
    }
  }

  return null
}

async function tryExactGet(title: string, artist: string, duration?: number): Promise<LyricsResult | null> {
  const params = new URLSearchParams()
  params.set('track_name', title)
  if (artist) params.set('artist_name', artist)
  if (duration && Number.isFinite(duration)) {
    params.set('duration', String(Math.round(duration)))
  }

  const response = await fetch(`${LRCLIB_API_BASE}/get?${params.toString()}`)
  if (!response.ok) return null

  const data = (await response.json()) as LrclibTrack
  return toLyricsResult(data)
}

async function searchLrclib(query: string): Promise<LrclibTrack[]> {
  const params = new URLSearchParams()
  params.set('q', query)

  const response = await fetch(`${LRCLIB_API_BASE}/search?${params.toString()}`)
  if (!response.ok) return []

  const data = (await response.json()) as LrclibTrack[]
  return Array.isArray(data) ? data : []
}

function scoreLyricsCandidate(item: LrclibTrack, title: string, artist: string, duration?: number): number {
  const itemTitle = (item.trackName ?? '').toLowerCase()
  const itemArtist = (item.artistName ?? '').toLowerCase()
  const itemAlbum = (item.albumName ?? '').toLowerCase()
  const wantedTitle = title.toLowerCase()
  const wantedArtist = artist.toLowerCase()
  const fullItemText = `${itemTitle} ${itemArtist} ${itemAlbum}`

  let score = 0

  if (itemTitle === wantedTitle) score += 160
  else if (itemTitle.includes(wantedTitle)) score += 90
  else if (wantedTitle.includes(itemTitle) && itemTitle.length >= 4) score += 70

  if (wantedArtist && itemArtist === wantedArtist) score += 100
  else if (wantedArtist && itemArtist.includes(wantedArtist)) score += 75
  else if (wantedArtist && wantedArtist.includes(itemArtist) && itemArtist.length >= 4) score += 45

  if (item.syncedLyrics) score += 40
  if (item.plainLyrics) score += 15

  if (duration && item.duration) {
    const diff = Math.abs(item.duration - duration)

    if (diff <= 1) score += 90
    else if (diff <= 3) score += 70
    else if (diff <= 6) score += 45
    else if (diff <= 10) score += 20
    else if (diff > 20) score -= 80
    else if (diff > 12) score -= 40
  }

  for (const word of badVersionWords) {
    const candidateHasBadWord = fullItemText.includes(word)
    const wantedHasBadWord = wantedTitle.includes(word)

    if (candidateHasBadWord && !wantedHasBadWord) {
      score -= 60
    }
  }

  if (!item.syncedLyrics && item.plainLyrics) score -= 10

  return score
}

async function trySearchFallback(title: string, artist: string, duration?: number): Promise<LyricsResult | null> {
  const queries = [
    `${title} ${artist}`.trim(),
    `${artist} ${title}`.trim(),
    title,
  ].filter(Boolean)

  for (const query of queries) {
    const results = await searchLrclib(query)

    const best = results
      .map((item) => ({
        item,
        score: scoreLyricsCandidate(item, title, artist, duration),
      }))
      .sort((a, b) => b.score - a.score)[0]

    if (best && best.score >= 75) {
      const result = toLyricsResult(best.item)
      if (result) return result
    }
  }

  return null
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

  const fallbackArtist = track.artist || track.channelName || ''
  const split = splitTitleAndArtist(track.title, fallbackArtist)

  const title = split.title
  const artist = split.artist || normalizeArtistName(fallbackArtist)
  const duration = track.duration

  try {
    const exact = await tryExactGet(title, artist, duration)
    if (exact) return exact

    const fallback = await trySearchFallback(title, artist, duration)
    if (fallback) return fallback

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
