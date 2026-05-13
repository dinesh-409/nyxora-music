import type { Track } from '../types/music'
import type { DetectedLanguage } from './language-detector'

const badKeywords = [
  'shorts',
  'trailer',
  'teaser',
  'reaction',
  'interview',
  'news',
  'review',
  'reels',
  'status',
  'making',
  'behind the scenes',
]

const officialKeywords = [
  'official',
  'vevo',
  'music',
  'records',
  'label',
  'sony',
  't-series',
  'think music',
  'saregama',
  'sun tv',
  'speed records',
]

export function scoreTrack(
  track: Track,
  query: string,
  detectedLanguage: DetectedLanguage,
  preferredLanguages: string[] = [],
  followedArtists: string[] = [],
): number {
  const q = query.toLowerCase()
  const title = track.title.toLowerCase()
  const artist = track.artist.toLowerCase()
  const channel = (track.channelName ?? '').toLowerCase()
  const full = `${title} ${artist} ${channel}`

  let score = 0

  if (title.includes(q)) score += 80
  if (full.includes(q)) score += 45

  if (detectedLanguage !== 'Unknown' && track.language === detectedLanguage) score += 35
  if (track.language && preferredLanguages.includes(track.language)) score += 25

  if (followedArtists.some((item) => artist.includes(item.toLowerCase()) || title.includes(item.toLowerCase()))) {
    score += 30
  }

  if (officialKeywords.some((keyword) => full.includes(keyword))) score += 20
  if (title.includes('official')) score += 15
  if (title.includes('lyrical') || title.includes('lyrics')) score += 3
  if (title.includes('full video') || title.includes('full song')) score += 8

  if (badKeywords.some((keyword) => full.includes(keyword))) score -= 120
  if (title.includes('#shorts')) score -= 150
  if (title.length > 120) score -= 8

  return score
}

export function rankTracks(
  tracks: Track[],
  query: string,
  detectedLanguage: DetectedLanguage,
  preferredLanguages: string[] = [],
  followedArtists: string[] = [],
): Track[] {
  return [...tracks].sort((a, b) => {
    const scoreA = scoreTrack(a, query, detectedLanguage, preferredLanguages, followedArtists)
    const scoreB = scoreTrack(b, query, detectedLanguage, preferredLanguages, followedArtists)
    return scoreB - scoreA
  })
}
