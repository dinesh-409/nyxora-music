import type { Track } from '../types/music'
import { searchFallbackCatalog } from './fallback-catalog'

const CACHE_PREFIX = 'nyxora-search-cache-v1'
const CACHE_TTL = 1000 * 60 * 60 * 12

interface CachedSearch {
  query: string
  savedAt: number
  tracks: Track[]
}

function key(query: string) {
  return `${CACHE_PREFIX}:${query.trim().toLowerCase()}`
}

export function saveSearchCache(query: string, tracks: Track[]) {
  const clean = query.trim()
  if (!clean || !tracks.length) return

  const payload: CachedSearch = {
    query: clean,
    savedAt: Date.now(),
    tracks,
  }

  try {
    localStorage.setItem(key(clean), JSON.stringify(payload))
  } catch {
    // ignore storage errors
  }
}

export function getSearchCache(query: string): Track[] {
  const clean = query.trim()
  if (!clean) return []

  try {
    const raw = localStorage.getItem(key(clean))
    if (!raw) return []

    const parsed = JSON.parse(raw) as CachedSearch
    if (!parsed?.tracks?.length) return []

    const expired = Date.now() - parsed.savedAt > CACHE_TTL
    if (expired) return []

    return parsed.tracks
  } catch {
    return []
  }
}

export function getCachedOrFallback(query: string): Track[] {
  const cached = getSearchCache(query)
  if (cached.length) return cached

  return searchFallbackCatalog(query)
}
