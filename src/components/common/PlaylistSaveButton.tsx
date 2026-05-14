import { useEffect, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import {
  isPlaylistSaved,
  togglePlaylistSaved,
  type SavedPlaylist,
} from '../../lib/library-playlists'

type PlaylistSaveButtonProps = {
  playlist: SavedPlaylist
  size?: number
}

export function PlaylistSaveButton({ playlist, size = 26 }: PlaylistSaveButtonProps) {
  const [saved, setSaved] = useState(() => isPlaylistSaved(playlist))

  useEffect(() => {
    const syncSavedState = () => setSaved(isPlaylistSaved(playlist))

    syncSavedState()
    window.addEventListener('nyxora-library-playlists-changed', syncSavedState)
    window.addEventListener('storage', syncSavedState)

    return () => {
      window.removeEventListener('nyxora-library-playlists-changed', syncSavedState)
      window.removeEventListener('storage', syncSavedState)
    }
  }, [playlist])

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        setSaved(togglePlaylistSaved(playlist))
      }}
      className={`rounded-full p-2 active:bg-white/10 ${
        saved ? 'text-emerald-400' : 'text-white/65'
      }`}
      aria-label={saved ? 'Remove playlist from library' : 'Add playlist to library'}
    >
      {saved ? <Check size={size} strokeWidth={3} /> : <Plus size={size} />}
    </button>
  )
}
