import type { Track } from '../types/music'
import { getTrackLikeKey } from './liked-tracks'

const RECENT_TRACKS_KEY = 'nyxora-recent-tracks'

export function readRecentTracks() {
  try {
    const raw = localStorage.getItem(RECENT_TRACKS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

export function writeRecentTracks(tracks: Track[]) {
  localStorage.setItem(RECENT_TRACKS_KEY, JSON.stringify(tracks.slice(0, 25)))
}

export function saveRecentTrack(track: Track) {
  const key = getTrackLikeKey(track)
  const existing = readRecentTracks().filter((item: Track) => getTrackLikeKey(item) !== key)
  const next = [track, ...existing].slice(0, 25)
  writeRecentTracks(next)
  return next
}

export function removeRecentTrack(track: Track) {
  const key = getTrackLikeKey(track)
  const next = readRecentTracks().filter((item: Track) => getTrackLikeKey(item) !== key)
  writeRecentTracks(next)
  return next
}
