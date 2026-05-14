import type { Track } from '../types/music'

const STORAGE_KEY = 'nyxora-liked-tracks'

export function getTrackLikeKey(track: Track) {
  return track.videoId || track.id || `${track.title}-${track.artist}`
}

function trackKey(track: Track) {
  return track.videoId || track.id || `${track.title}-${track.artist}`
}

function normalizeTrack(track: Track): Track {
  return {
    ...track,
    id: track.id || track.videoId || `${track.title}-${track.artist}`,
    videoId: track.videoId,
    title: track.title,
    artist: track.artist,
    thumbnail: track.thumbnail || '/logo.png',
  }
}

function notifyLikedChanged(message?: string) {
  window.dispatchEvent(new CustomEvent('nyxora-liked-changed'))

  if (message) {
    window.dispatchEvent(
      new CustomEvent('nyxora-toast', {
        detail: message,
      }),
    )
  }
}

export function getLikedTracks(): Track[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((track) => track?.title && (track?.id || track?.videoId))
  } catch {
    return []
  }
}

export function isTrackLiked(track: Track): boolean {
  const key = trackKey(track)

  return getLikedTracks().some((item) => trackKey(item) === key)
}

export function addTrackToLikedSongs(track: Track, showToast = true): Track[] {
  const normalized = normalizeTrack(track)
  const current = getLikedTracks()
  const key = trackKey(normalized)

  const exists = current.some((item) => trackKey(item) === key)
  const next = exists ? current : [normalized, ...current].slice(0, 500)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

  if (!exists) {
    notifyLikedChanged(showToast ? 'Added to liked songs' : undefined)
  } else {
    notifyLikedChanged()
  }

  return next
}

export function removeTrackFromLikedSongs(track: Track, showToast = true): Track[] {
  const key = trackKey(track)
  const next = getLikedTracks().filter((item) => trackKey(item) !== key)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notifyLikedChanged(showToast ? 'Removed from liked songs' : undefined)

  return next
}

export function toggleTrackLiked(track: Track, showToast = true): boolean {
  if (isTrackLiked(track)) {
    removeTrackFromLikedSongs(track, showToast)
    return false
  }

  addTrackToLikedSongs(track, showToast)
  return true
}

export function clearLikedTracks() {
  localStorage.removeItem(STORAGE_KEY)
  notifyLikedChanged()
}
