import type { Track } from '../types/music'
import type { YouTubePlaylistItem, YouTubeSearchItem } from '../types/youtube'
import { FALLBACK_COVER } from './constants'
import { detectQueryLanguage } from './language-detector'
import { rankTracks } from './search-ranker'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined

function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)

  return hours * 3600 + minutes * 60 + seconds
}

async function enrichTracksWithDurations(tracks: Track[]): Promise<Track[]> {
  if (!tracks.length || !YOUTUBE_API_KEY) return tracks

  const ids = tracks.map((track) => track.videoId).filter(Boolean).slice(0, 50)
  if (!ids.length) return tracks

  const url = new URL(`${YOUTUBE_API_BASE}/videos`)
  url.searchParams.set('part', 'contentDetails')
  url.searchParams.set('id', ids.join(','))
  url.searchParams.set('key', YOUTUBE_API_KEY)

  try {
    const response = await fetch(url.toString())
    if (!response.ok) return tracks

    const data = (await response.json()) as {
      items?: Array<{
        id: string
        contentDetails?: {
          duration?: string
        }
      }>
    }

    const durationMap = new Map<string, number>()

    data.items?.forEach((item) => {
      const duration = item.contentDetails?.duration
      if (duration) {
        durationMap.set(item.id, parseYouTubeDuration(duration))
      }
    })

    return tracks.map((track) => ({
      ...track,
      duration: track.videoId ? durationMap.get(track.videoId) ?? track.duration : track.duration,
    }))
  } catch (error) {
    console.warn('YouTube duration enrichment failed safely:', error)
    return tracks
  }
}

function getBestThumbnail(thumbnails: YouTubeSearchItem['snippet']['thumbnails']): string {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    FALLBACK_COVER
  )
}


function normalizeForDuplicate(value: string): string {
  return value
    .toLowerCase()
    .replace(/official music video/gi, '')
    .replace(/official video/gi, '')
    .replace(/official song/gi, '')
    .replace(/full video song/gi, '')
    .replace(/full song/gi, '')
    .replace(/lyrical video/gi, '')
    .replace(/lyric video/gi, '')
    .replace(/lyrics/gi, '')
    .replace(/audio/gi, '')
    .replace(/4k/gi, '')
    .replace(/hd/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function trackQualityScore(track: Track): number {
  const text = `${track.title} ${track.channelName ?? ''}`.toLowerCase()
  let score = 0

  if (text.includes('official music video')) score += 40
  if (text.includes('official video')) score += 35
  if (text.includes('official')) score += 25
  if (text.includes('vevo')) score += 20
  if (text.includes('lyrics') || text.includes('lyric')) score += 8
  if (text.includes('audio')) score += 6

  if (text.includes('reaction')) score -= 100
  if (text.includes('shorts')) score -= 100
  if (text.includes('trailer')) score -= 100
  if (text.includes('interview')) score -= 100
  if (text.includes('cover')) score -= 40
  if (text.includes('karaoke')) score -= 60
  if (text.includes('remix')) score -= 20

  return score
}

function dedupeTracks(tracks: Track[]): Track[] {
  const map = new Map<string, Track>()

  for (const track of tracks) {
    const titleKey = normalizeForDuplicate(track.title)
    const artistKey = normalizeForDuplicate(track.artist || track.channelName || '')
    const key = `${artistKey}::${titleKey}`

    const existing = map.get(key)

    if (!existing) {
      map.set(key, track)
      continue
    }

    if (trackQualityScore(track) > trackQualityScore(existing)) {
      map.set(key, track)
    }
  }

  return [...map.values()]
}

function guessArtistFromTitle(title: string, channelTitle: string): string {
  const separators = [' - ', ' – ', '|', ':']

  for (const separator of separators) {
    if (title.includes(separator)) {
      const first = title.split(separator)[0]?.trim()
      if (first) return first
    }
  }

  return channelTitle || 'YouTube'
}

function mapSearchItemToTrack(item: YouTubeSearchItem, queryLanguage: string): Track | null {
  const videoId = item.id.videoId
  if (!videoId) return null

  const track: Track = {
    id: videoId,
    videoId,
    title: item.snippet.title,
    artist: guessArtistFromTitle(item.snippet.title, item.snippet.channelTitle),
    channelName: item.snippet.channelTitle,
    thumbnail: getBestThumbnail(item.snippet.thumbnails),
    publishedAt: item.snippet.publishedAt,
    source: 'youtube',
    language: queryLanguage === 'Unknown' ? undefined : queryLanguage,
  }

  return track
}

export async function searchYouTubeSongs(
  query: string,
  preferredLanguages: string[] = [],
  followedArtists: string[] = [],
): Promise<Track[]> {
  const clean = query.trim()
  if (!clean) return []

  if (!YOUTUBE_API_KEY) {
    console.warn('Missing VITE_YOUTUBE_API_KEY. Showing empty YouTube results safely.')
    return []
  }

  const detectedLanguage = detectQueryLanguage(clean)
  const enhancedQuery = clean

  const url = new URL(`${YOUTUBE_API_BASE}/search`)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', enhancedQuery)
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '20')
  url.searchParams.set('videoCategoryId', '10')
  url.searchParams.set('key', YOUTUBE_API_KEY)

  const response = await fetch(url.toString())

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('YouTube API access blocked or quota exceeded. Check API key, quota, and restrictions.')
    }
    throw new Error(`YouTube search failed: ${response.status}`)
  }

  const data = (await response.json()) as { items?: YouTubeSearchItem[] }

  const tracks: Track[] =
    data.items
      ?.map((item) => mapSearchItemToTrack(item, detectedLanguage))
      .filter((item): item is Track => item !== null) ?? []

  const enrichedTracks = await enrichTracksWithDurations(tracks)
  const rankedTracks = rankTracks(enrichedTracks, clean, detectedLanguage, preferredLanguages, followedArtists)
  return dedupeTracks(rankedTracks)
}

export interface YouTubePlaylistSummary {
  id: string
  title: string
  description: string
  channelName: string
  thumbnail: string
  publishedAt: string
}

export async function searchYouTubePlaylists(query: string): Promise<YouTubePlaylistSummary[]> {
  const clean = query.trim()
  if (!clean) return []

  if (!YOUTUBE_API_KEY) {
    console.warn('Missing VITE_YOUTUBE_API_KEY. Showing empty playlist results safely.')
    return []
  }

  const url = new URL(`${YOUTUBE_API_BASE}/search`)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', `${clean} playlist songs`)
  url.searchParams.set('type', 'playlist')
  url.searchParams.set('maxResults', '20')
  url.searchParams.set('key', YOUTUBE_API_KEY)

  const response = await fetch(url.toString())

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('YouTube API access blocked or quota exceeded. Check API key, quota, and restrictions.')
    }
    throw new Error(`YouTube playlist search failed: ${response.status}`)
  }

  const data = (await response.json()) as { items?: YouTubeSearchItem[] }

  const playlists: YouTubePlaylistSummary[] =
    data.items
      ?.map((item) => {
        const playlistId = item.id.playlistId
        if (!playlistId) return null

        const playlist: YouTubePlaylistSummary = {
          id: playlistId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelName: item.snippet.channelTitle,
          thumbnail: getBestThumbnail(item.snippet.thumbnails),
          publishedAt: item.snippet.publishedAt,
        }

        return playlist
      })
      .filter((item): item is YouTubePlaylistSummary => item !== null) ?? []

  return playlists
}

export async function fetchYouTubePlaylistItems(playlistId: string): Promise<Track[]> {
  if (!playlistId) return []

  if (!YOUTUBE_API_KEY) {
    console.warn('Missing VITE_YOUTUBE_API_KEY. Showing empty playlist items safely.')
    return []
  }

  const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('playlistId', playlistId)
  url.searchParams.set('maxResults', '50')
  url.searchParams.set('key', YOUTUBE_API_KEY)

  const response = await fetch(url.toString())

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('YouTube API access blocked or quota exceeded. Check API key, quota, and restrictions.')
    }
    throw new Error(`YouTube playlist items failed: ${response.status}`)
  }

  const data = (await response.json()) as { items?: YouTubePlaylistItem[] }

  const tracks: Track[] =
    data.items
      ?.map((item) => {
        const videoId = item.snippet.resourceId?.videoId
        if (!videoId) return null

        const track: Track = {
          id: videoId,
          videoId,
          title: item.snippet.title,
          artist: guessArtistFromTitle(item.snippet.title, item.snippet.channelTitle),
          channelName: item.snippet.channelTitle,
          thumbnail: getBestThumbnail(item.snippet.thumbnails),
          publishedAt: item.snippet.publishedAt,
          source: 'youtube',
        }

        return track
      })
      .filter((item): item is Track => item !== null) ?? []

  return enrichTracksWithDurations(tracks)
}
