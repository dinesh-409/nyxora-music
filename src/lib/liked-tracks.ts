import type { Track } from '../types/music'

export const LIKED_TRACKS_KEY = 'nyxora-liked-tracks'

export function getTrackLikeKey(track?: Track | null) {
  if (!track) return ''
  return `${track.id || ''}-${track.videoId || ''}-${track.title || ''}-${track.artist || ''}`.toLowerCase()
}

export function readLikedTrackKeys() {
  try {
    const raw = localStorage.getItem(LIKED_TRACKS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

export function writeLikedTrackKeys(keys: string[]) {
  localStorage.setItem(LIKED_TRACKS_KEY, JSON.stringify(Array.from(new Set(keys))))
  window.dispatchEvent(new CustomEvent('nyxora-liked-changed'))
}

export function isTrackLiked(track?: Track | null) {
  const key = getTrackLikeKey(track)
  return Boolean(key && readLikedTrackKeys().includes(key))
}

export function addTrackToLikedSongs(track?: Track | null) {
  const key = getTrackLikeKey(track)
  if (!track || !key) return

  const keys = readLikedTrackKeys()

  if (!keys.includes(key)) {
    writeLikedTrackKeys([...keys, key])
  }

  window.dispatchEvent(
    new CustomEvent('nyxora-toast', {
      detail: 'Added to liked songs',
    }),
  )
}

export function removeTrackFromLikedSongs(track?: Track | null) {
  const key = getTrackLikeKey(track)
  if (!key) return

  writeLikedTrackKeys(readLikedTrackKeys().filter((item) => item !== key))

  window.dispatchEvent(
    new CustomEvent('nyxora-toast', {
      detail: 'Removed from liked songs',
    }),
  )
}

export function toggleTrackLiked(track?: Track | null) {
  if (isTrackLiked(track)) {
    removeTrackFromLikedSongs(track)
  } else {
    addTrackToLikedSongs(track)
  }
}
