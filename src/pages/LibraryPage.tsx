import { useEffect, useState } from 'react'
import {
  ArrowDownUp,
  Grid2X2,
  Heart,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { SafeImage } from '../components/common/SafeImage'
import { usePlayerStore } from '../store/player-store'
import { getLikedTracks } from '../lib/liked-tracks'
import {
  getSavedPlaylists,
  removePlaylistFromLibrary,
  type SavedPlaylist,
} from '../lib/library-playlists'
import type { Track } from '../types/music'

type LibraryItem =
  | {
      type: 'liked'
      id: string
      title: string
      subtitle: string
      image?: string
      count: number
    }
  | {
      type: 'playlist'
      id: string
      title: string
      subtitle: string
      image?: string
      playlist: SavedPlaylist
    }

export function LibraryPage() {
  const [likedSongs, setLikedSongs] = useState<Track[]>(() => getLikedTracks())
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>(() => getSavedPlaylists())
  const [activeFilter, setActiveFilter] = useState<'playlists' | 'artists' | 'downloaded'>('playlists')
  const { setQueue, setPlaying } = usePlayerStore()

  useEffect(() => {
    const syncLibrary = () => {
      setLikedSongs(getLikedTracks())
      setSavedPlaylists(getSavedPlaylists())
    }

    syncLibrary()
    window.addEventListener('nyxora-liked-changed', syncLibrary)
    window.addEventListener('nyxora-library-playlists-changed', syncLibrary)
    window.addEventListener('storage', syncLibrary)

    return () => {
      window.removeEventListener('nyxora-liked-changed', syncLibrary)
      window.removeEventListener('nyxora-library-playlists-changed', syncLibrary)
      window.removeEventListener('storage', syncLibrary)
    }
  }, [])

  const libraryItems: LibraryItem[] = [
    {
      type: 'liked',
      id: 'liked-songs',
      title: 'Liked Songs',
      subtitle: `${likedSongs.length} ${likedSongs.length === 1 ? 'song' : 'songs'}`,
      count: likedSongs.length,
    },
    ...savedPlaylists.map((playlist) => ({
      type: 'playlist' as const,
      id: playlist.id,
      title: playlist.title,
      subtitle: `Playlist${playlist.channelName ? ` • ${playlist.channelName}` : ''}`,
      image: playlist.thumbnail,
      playlist,
    })),
  ]

  function playLikedSongs() {
    if (!likedSongs.length) {
      window.dispatchEvent(
        new CustomEvent('nyxora-toast', {
          detail: 'Like songs to build your Liked Songs playlist',
        }),
      )
      return
    }

    setQueue(likedSongs, 0, 'Liked Songs')
    setPlaying(true)
  }

  function removeSavedPlaylist(playlist: SavedPlaylist) {
    removePlaylistFromLibrary(playlist)
    window.dispatchEvent(
      new CustomEvent('nyxora-toast', {
        detail: 'Removed from your library',
      }),
    )
  }

  function removeLikedSongsPlaylist() {
    window.dispatchEvent(
      new CustomEvent('nyxora-toast', {
        detail: 'Open Liked Songs and remove songs individually',
      }),
    )
  }

  function openItem(item: LibraryItem) {
    if (item.type === 'liked') {
      playLikedSongs()
      return
    }

    window.dispatchEvent(
      new CustomEvent('nyxora-toast', {
        detail: 'Playlist opening needs YouTube quota / playlist items',
      }),
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] px-4 pb-40 pt-6 text-white">
      <header className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <SafeImage
            src="/logo.png"
            alt="Profile"
            className="h-14 w-14 shrink-0 rounded-full object-cover"
            loading="eager"
          />
          <h1 className="truncate text-[34px] font-black leading-none">Your Library</h1>
        </div>

        <div className="flex items-center gap-5 text-white">
          <button
            type="button"
            className="rounded-full p-1 active:bg-white/10"
            aria-label="Search library"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('nyxora-toast', {
                  detail: 'Library search coming next',
                }),
              )
            }
          >
            <Search size={34} />
          </button>

          <button
            type="button"
            className="rounded-full p-1 active:bg-white/10"
            aria-label="Create playlist"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('nyxora-toast', {
                  detail: 'Create playlist coming next',
                }),
              )
            }
          >
            <Plus size={40} />
          </button>
        </div>
      </header>

      <div className="mt-7 flex gap-3 overflow-x-auto pb-1">
        {(['playlists', 'artists', 'downloaded'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`shrink-0 rounded-full px-5 py-3 text-lg ${
              activeFilter === filter ? 'bg-white/16 text-white' : 'bg-white/10 text-white/90'
            }`}
          >
            {filter === 'playlists' ? 'Playlists' : filter === 'artists' ? 'Artists' : 'Downloaded'}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-3 text-white"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('nyxora-toast', {
                detail: 'Sort options coming next',
              }),
            )
          }
        >
          <ArrowDownUp size={23} />
          <span className="text-xl font-bold">Recents</span>
        </button>

        <button
          type="button"
          className="rounded-full p-2 text-white active:bg-white/10"
          aria-label="Change view"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('nyxora-toast', {
                detail: 'Grid view coming next',
              }),
            )
          }
        >
          <Grid2X2 size={28} />
        </button>
      </div>

      <section className="mt-6 space-y-6">
        {libraryItems.map((item) => (
          <div key={`${item.type}-${item.id}`} className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => openItem(item)}
              className="flex min-w-0 flex-1 items-center gap-5 text-left active:scale-[0.99]"
            >
              {item.type === 'liked' ? (
                <div className="flex h-[118px] w-[118px] shrink-0 items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-400 to-emerald-200">
                  <Heart size={48} fill="white" className="text-white" />
                </div>
              ) : (
                <SafeImage
                  src={item.image || '/logo.png'}
                  alt={item.title}
                  className="h-[118px] w-[118px] shrink-0 object-cover"
                  loading="eager"
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[27px] font-semibold leading-tight text-white">
                  {item.title}
                </p>
                <p className="mt-3 truncate text-[20px] text-white/62">
                  {item.type === 'liked' ? '📌 Playlist • ❤' : item.subtitle}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (item.type === 'liked') {
                  removeLikedSongsPlaylist()
                } else {
                  removeSavedPlaylist(item.playlist)
                }
              }}
              className="rounded-full p-2 text-white/55 active:bg-white/10"
              aria-label={item.type === 'liked' ? 'Liked songs options' : 'Remove playlist'}
            >
              <Trash2 size={22} />
            </button>
          </div>
        ))}

        {libraryItems.length === 1 && likedSongs.length === 0 && savedPlaylists.length === 0 && (
          <div className="rounded-3xl bg-white/5 p-5 text-white/60">
            Like songs or save playlists to build your library.
          </div>
        )}
      </section>
    </div>
  )
}
