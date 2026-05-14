export type SavedPlaylist = {
  id: string
  title: string
  thumbnail?: string
  channelName?: string
}

const STORAGE_KEY = 'nyxora-library-playlists'

function normalizePlaylist(playlist: SavedPlaylist): SavedPlaylist {
  return {
    id: playlist.id,
    title: playlist.title,
    thumbnail: playlist.thumbnail,
    channelName: playlist.channelName,
  }
}

export function getSavedPlaylists(): SavedPlaylist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item) => item?.id && item?.title)
  } catch {
    return []
  }
}

export function isPlaylistSaved(playlist: SavedPlaylist): boolean {
  return getSavedPlaylists().some((item) => item.id === playlist.id)
}

export function savePlaylistToLibrary(playlist: SavedPlaylist): SavedPlaylist[] {
  const normalized = normalizePlaylist(playlist)
  const current = getSavedPlaylists()
  const exists = current.some((item) => item.id === normalized.id)

  const next = exists
    ? current
    : [normalized, ...current].slice(0, 100)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('nyxora-library-playlists-changed'))

  return next
}

export function removePlaylistFromLibrary(playlist: SavedPlaylist): SavedPlaylist[] {
  const next = getSavedPlaylists().filter((item) => item.id !== playlist.id)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('nyxora-library-playlists-changed'))

  return next
}

export function togglePlaylistSaved(playlist: SavedPlaylist): boolean {
  if (isPlaylistSaved(playlist)) {
    removePlaylistFromLibrary(playlist)
    window.dispatchEvent(
      new CustomEvent('nyxora-toast', {
        detail: 'Removed from your library',
      }),
    )
    return false
  }

  savePlaylistToLibrary(playlist)
  window.dispatchEvent(
    new CustomEvent('nyxora-toast', {
      detail: 'Added to your library',
    }),
  )
  return true
}
