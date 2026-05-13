import type { Track } from '../types/music'
import { FALLBACK_TRACKS } from './fallback-catalog'

function normalize(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .replace(/official music video/gi, '')
    .replace(/official video/gi, '')
    .replace(/lyrics?/gi, '')
    .replace(/audio/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sameTrack(a: Track, b: Track) {
  return a.id === b.id || a.videoId === b.videoId
}

function scoreTrack(candidate: Track, current: Track) {
  const currentTitle = normalize(current.title)
  const currentArtist = normalize(current.artist || current.channelName)
  const candidateTitle = normalize(candidate.title)
  const candidateArtist = normalize(candidate.artist || candidate.channelName)

  let score = 0

  if (candidateArtist && currentArtist && candidateArtist === currentArtist) score += 100
  if (candidateArtist && currentArtist && candidateArtist.includes(currentArtist)) score += 60

  const currentWords = currentTitle.split(' ').filter(Boolean)
  for (const word of currentWords) {
    if (word.length > 2 && candidateTitle.includes(word)) score += 10
  }

  // Popular adjacent fallback vibe boost
  const popWords = ['love', 'party', 'lights', 'perfect', 'believer', 'shape', 'espresso']
  for (const word of popWords) {
    if (currentTitle.includes(word) && candidateTitle.includes(word)) score += 20
  }

  return score
}

export function getRecommendedQueue(currentTrack: Track | null, queue: Track[] = []) {
  if (!currentTrack) return []

  const used = new Set(
    [currentTrack, ...queue]
      .filter(Boolean)
      .map((track) => `${track.id}:${track.videoId}`),
  )

  const candidates = FALLBACK_TRACKS
    .filter((track) => !sameTrack(track, currentTrack))
    .filter((track) => !used.has(`${track.id}:${track.videoId}`))
    .map((track) => ({
      track,
      score: scoreTrack(track, currentTrack),
    }))
    .sort((a, b) => b.score - a.score)

  const positive = candidates.filter((item) => item.score > 0).map((item) => item.track)
  const fallback = candidates.filter((item) => item.score <= 0).map((item) => item.track)

  return [...positive, ...fallback].slice(0, 12)
}

export function shuffleKeepingCurrent(queue: Track[], currentIndex: number) {
  if (queue.length <= 1) return queue

  const current = queue[currentIndex] ?? queue[0]
  const rest = queue.filter((_, index) => index !== currentIndex)

  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }

  return [current, ...rest]
}
