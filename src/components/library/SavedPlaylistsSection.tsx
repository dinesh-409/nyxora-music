import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { SafeImage } from '../common/SafeImage'
import {
  getSavedPlaylists,
  removePlaylistFromLibrary,
  type SavedPlaylist,
} from '../../lib/library-playlists'

export function SavedPlaylistsSection() {
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>(() => getSavedPlaylists())

  useEffect(() => {
    const syncPlaylists = () => setPlaylists(getSavedPlaylists())

    syncPlaylists()
    window.addEventListener('nyxora-library-playlists-changed', syncPlaylists)
    window.addEventListener('storage', syncPlaylists)

    return () => {
      window.removeEventListener('nyxora-library-playlists-changed', syncPlaylists)
      window.removeEventListener('storage', syncPlaylists)
    }
  }, [])

  if (!playlists.length) {
    return null
  }

  return (
    <section className="mt-7">
      <h2 className="text-2xl font-black text-white">Saved playlists</h2>

      <div className="mt-4 space-y-4">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="flex items-center gap-4">
            <SafeImage
              src={playlist.thumbnail || '/logo.png'}
              alt={playlist.title}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
              loading="eager"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-bold text-white">{playlist.title}</p>
              <p className="mt-1 truncate text-sm text-white/55">
                Playlist{playlist.channelName ? ` • ${playlist.channelName}` : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                removePlaylistFromLibrary(playlist)
                window.dispatchEvent(
                  new CustomEvent('nyxora-toast', {
                    detail: 'Removed from your library',
                  }),
                )
              }}
              className="rounded-full p-2 text-white/60 active:bg-white/10"
              aria-label="Remove playlist"
            >
              <Trash2 size={21} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
