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
  matchedDuration?: number
  autoOffset?: number
  matchConfidence?: number
  matchedTrackName?: string
  matchedArtistName?: string
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
  'trap',
  'bass boosted',
]

const nonArtistChannelWords = [
  'official',
  'vevo',
  'records',
  'music',
  'label',
  't-series',
  'sony',
  'saregama',
  'think music',
  'sun tv',
  'tips',
  'speed records',
  'yrf',
  'zeemusic',
]

const removeTitlePatterns = [
  /\(.*?official.*?\)/gi,
  /\[.*?official.*?\]/gi,
  /\(.*?music video.*?\)/gi,
  /\[.*?music video.*?\]/gi,
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

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 1)
}

function tokenOverlapScore(a: string, b: string): number {
  const aTokens = tokens(a)
  const bTokens = tokens(b)

  if (!aTokens.length || !bTokens.length) return 0

  const aSet = new Set(aTokens)
  const bSet = new Set(bTokens)

  const common = [...aSet].filter((token) => bSet.has(token)).length
  const max = Math.max(aSet.size, bSet.size)

  return common / max
}

export function normalizeYouTubeTitle(title: string): string {
  let clean = title

  for (const pattern of removeTitlePatterns) {
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
  let clean = artist

  for (const word of nonArtistChannelWords) {
    clean = clean.replace(new RegExp(word, 'gi'), '')
  }

  return clean.replace(/\s+/g, ' ').trim()
}

function splitTitleAndArtist(title: string, fallbackArtist: string) {
  const cleaned = normalizeYouTubeTitle(title)
  const separators = [' - ', ' – ', ' — ', '|']

  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep).map((x) => x.trim()).filter(Boolean)

      if (parts.length >= 2) {
        return {
          artist: normalizeArtistName(parts[0]),
          title: normalizeYouTubeTitle(parts.slice(1).join(' ')),
        }
      }
    }
  }

  return {
    artist: normalizeArtistName(fallbackArtist),
    title: cleaned,
  }
}

function candidateHasBadVersion(item: LrclibTrack, requestedTitle: string): boolean {
  const candidateText = normalizeText(`${item.trackName ?? ''} ${item.albumName ?? ''}`)
  const wantedText = normalizeText(requestedTitle)

  return badVersionWords.some((word) => candidateText.includes(word) && !wantedText.includes(word))
}

function isLikelyWrongCandidate(item: LrclibTrack, title: string, artist: string): boolean {
  const itemTitle = item.trackName ?? ''
  const itemArtist = item.artistName ?? ''

  const titleOverlap = tokenOverlapScore(itemTitle, title)
  const artistOverlap = artist ? tokenOverlapScore(itemArtist, artist) : 0

  const normalizedItemTitle = normalizeText(itemTitle)
  const normalizedWantedTitle = normalizeText(title)

  // Title must be strongly related. This prevents totally different song lyrics.
  const titleClearlyMatches =
    normalizedItemTitle === normalizedWantedTitle ||
    normalizedItemTitle.includes(normalizedWantedTitle) ||
    normalizedWantedTitle.includes(normalizedItemTitle) ||
    titleOverlap >= 0.55

  if (!titleClearlyMatches) return true

  // If we know artist, artist should not be completely different.
  if (artist && itemArtist && artistOverlap < 0.25) {
    const itemArtistNorm = normalizeText(itemArtist)
    const wantedArtistNorm = normalizeText(artist)

    if (!itemArtistNorm.includes(wantedArtistNorm) && !wantedArtistNorm.includes(itemArtistNorm)) {
      return true
    }
  }

  if (candidateHasBadVersion(item, title)) return true

  return false
}

function estimateAutoOffset(_track: Track, _matchedDuration?: number): number {
  // Keep neutral. Manual per-song saved offset gives safer sync.
  return 0
}

function toLyricsResult(
  item: LrclibTrack | null,
  track: Track,
  confidence = 0,
): LyricsResult | null {
  if (!item) return null

  const autoOffset = estimateAutoOffset(track, item.duration)

  if (item.syncedLyrics) {
    const lines = parseLrc(item.syncedLyrics)

    if (lines.length > 0) {
      return {
        synced: true,
        lines,
        plainLyrics: item.plainLyrics ?? null,
        source: 'lrclib',
        matchedDuration: item.duration,
        autoOffset,
        matchConfidence: confidence,
        matchedTrackName: item.trackName,
        matchedArtistName: item.artistName,
      }
    }
  }

  if (item.plainLyrics) {
    return {
      synced: false,
      lines: [],
      plainLyrics: item.plainLyrics,
      source: 'lrclib',
      matchedDuration: item.duration,
      autoOffset,
      matchConfidence: confidence,
      matchedTrackName: item.trackName,
      matchedArtistName: item.artistName,
    }
  }

  return null
}

async function tryExactGet(title: string, artist: string, track: Track): Promise<LyricsResult | null> {
  const params = new URLSearchParams()
  params.set('track_name', title)
  if (artist) params.set('artist_name', artist)

  const response = await fetch(`${LRCLIB_API_BASE}/get?${params.toString()}`)
  if (!response.ok) return null

  const data = (await response.json()) as LrclibTrack

  if (isLikelyWrongCandidate(data, title, artist)) return null

  return toLyricsResult(data, track, 999)
}

async function searchLrclib(query: string): Promise<LrclibTrack[]> {
  const params = new URLSearchParams()
  params.set('q', query)

  const response = await fetch(`${LRCLIB_API_BASE}/search?${params.toString()}`)
  if (!response.ok) return []

  const data = (await response.json()) as LrclibTrack[]
  return Array.isArray(data) ? data : []
}

function scoreLyricsCandidate(item: LrclibTrack, title: string, artist: string, track: Track): number {
  if (isLikelyWrongCandidate(item, title, artist)) return -999

  const itemTitle = item.trackName ?? ''
  const itemArtist = item.artistName ?? ''
  const itemAlbum = item.albumName ?? ''

  const itemTitleNorm = normalizeText(itemTitle)
  const wantedTitleNorm = normalizeText(title)
  const itemArtistNorm = normalizeText(itemArtist)
  const wantedArtistNorm = normalizeText(artist)

  const titleOverlap = tokenOverlapScore(itemTitle, title)
  const artistOverlap = artist ? tokenOverlapScore(itemArtist, artist) : 0

  let score = 0

  if (itemTitleNorm === wantedTitleNorm) score += 220
  else if (itemTitleNorm.includes(wantedTitleNorm)) score += 145
  else if (wantedTitleNorm.includes(itemTitleNorm) && itemTitleNorm.length >= 4) score += 110
  else score += Math.round(titleOverlap * 120)

  if (artist) {
    if (itemArtistNorm === wantedArtistNorm) score += 160
    else if (itemArtistNorm.includes(wantedArtistNorm)) score += 110
    else if (wantedArtistNorm.includes(itemArtistNorm) && itemArtistNorm.length >= 4) score += 80
    else score += Math.round(artistOverlap * 70)
  }

  if (item.syncedLyrics) score += 80
  if (item.plainLyrics) score += 20

  const videoDuration = track.duration
  if (videoDuration && item.duration) {
    const diff = Math.abs(videoDuration - item.duration)

    if (diff <= 1) score += 120
    else if (diff <= 3) score += 95
    else if (diff <= 6) score += 65
    else if (diff <= 12) score += 35
    else if (diff > 30) score -= 110
    else if (diff > 18) score -= 65
  }

  const fullCandidateText = normalizeText(`${itemTitle} ${itemArtist} ${itemAlbum}`)
  for (const word of badVersionWords) {
    if (fullCandidateText.includes(word) && !wantedTitleNorm.includes(word)) {
      score -= 100
    }
  }

  return score
}

async function trySearchFallback(title: string, artist: string, track: Track): Promise<LyricsResult | null> {
  const queries = [
    `${title} ${artist}`.trim(),
    `${artist} ${title}`.trim(),
    title,
  ].filter(Boolean)

  let bestOverall: { item: LrclibTrack; score: number } | null = null

  for (const query of queries) {
    const results = await searchLrclib(query)

    const best = results
      .map((item) => ({
        item,
        score: scoreLyricsCandidate(item, title, artist, track),
      }))
      .sort((a, b) => b.score - a.score)[0]

    if (best && (!bestOverall || best.score > bestOverall.score)) {
      bestOverall = best
    }
  }

  if (!bestOverall || bestOverall.score < 170) {
    console.warn('Lyrics rejected due to low confidence', {
      requestedTitle: title,
      requestedArtist: artist,
      bestScore: bestOverall?.score,
      bestTitle: bestOverall?.item.trackName,
      bestArtist: bestOverall?.item.artistName,
    })
    return null
  }

  console.info('Lyrics matched', {
    requestedTitle: title,
    requestedArtist: artist,
    score: bestOverall.score,
    matchedTitle: bestOverall.item.trackName,
    matchedArtist: bestOverall.item.artistName,
    matchedDuration: bestOverall.item.duration,
    youtubeDuration: track.duration,
  })

  return toLyricsResult(bestOverall.item, track, bestOverall.score)
}

export async function fetchLyrics(track: Track): Promise<LyricsResult> {
  if (!track?.title) {
    return {
      synced: false,
      lines: [],
      plainLyrics: null,
      source: 'missing',
      message: 'Lyrics not available for this song',
      autoOffset: 0,
    }
  }

  const fallbackArtist = track.artist || track.channelName || ''
  const split = splitTitleAndArtist(track.title, fallbackArtist)

  const title = split.title
  const artist = split.artist || normalizeArtistName(fallbackArtist)

  try {
    const exact = await tryExactGet(title, artist, track)
    if (exact) return exact

    const fallback = await trySearchFallback(title, artist, track)
    if (fallback) return fallback

    return {
      synced: false,
      lines: [],
      plainLyrics: null,
      source: 'missing',
      message: 'Synced lyrics not found for the exact song version',
      autoOffset: 0,
    }
  } catch (error) {
    console.warn('Lyrics fetch failed safely:', error)

    return {
      synced: false,
      lines: [],
      plainLyrics: null,
      source: 'missing',
      message: 'Lyrics not available for this song',
      autoOffset: 0,
    }
  }
}
