import { useState } from 'react'
import { Loader2, Music2, Play, Search, Trash2 } from 'lucide-react'
import { SafeImage } from '../components/common/SafeImage'
import {
  fetchYouTubePlaylistItems,
  searchYouTubePlaylists,
  searchYouTubeSongs,
  type YouTubePlaylistSummary,
} from '../lib/youtube.functions'
import { usePlayerStore } from '../store/player-store'
import { useSettingsStore } from '../store/settings-store'
import type { Track } from '../types/music'

type SearchTab = 'songs' | 'playlists'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('songs')
  const [songs, setSongs] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<YouTubePlaylistSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [playlistLoadingId, setPlaylistLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    searchHistory,
    addSearchQuery,
    clearSearchHistory,
    setQueue,
    setPlaying,
  } = usePlayerStore()

  const listeningLanguages = useSettingsStore((state) => state.listeningLanguages)

  const hasYouTubeKey = Boolean(import.meta.env.VITE_YOUTUBE_API_KEY)

  async function runSearch(searchText = query) {
    const clean = searchText.trim()
    if (!clean) return

    setLoading(true)
    setError(null)
    addSearchQuery(clean)

    try {
      if (activeTab === 'songs') {
        const result = await searchYouTubeSongs(clean, listeningLanguages)
        setSongs(result)
      } else {
        const result = await searchYouTubePlaylists(clean)
        setPlaylists(result)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function playSong(track: Track, index: number) {
    const queue = songs.length ? songs : [track]
    setQueue(queue, index, `Search: ${query.trim() || track.title}`)
    setPlaying(true)
  }

  async function openPlaylist(playlist: YouTubePlaylistSummary) {
    setPlaylistLoadingId(playlist.id)
    setError(null)

    try {
      const tracks = await fetchYouTubePlaylistItems(playlist.id)
      if (!tracks.length) {
        setError('No playable songs found in this playlist.')
        return
      }

      setQueue(tracks, 0, playlist.title)
      setPlaying(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not open playlist'
      setError(message)
    } finally {
      setPlaylistLoadingId(null)
    }
  }

  async function searchFromHistory(item: string) {
    setQuery(item)
    await runSearch(item)
  }

  return (
    <div className="px-4 pt-5">
      <h1 className="text-3xl font-black">Search</h1>

      <form
        className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault()
          runSearch()
        }}
      >
        <Search size={20} className="text-white/50" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tamil songs, Anirudh, Malayalam hits..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
        />
        {loading && <Loader2 size={18} className="animate-spin text-emerald-400" />}
      </form>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
        <button
          onClick={() => setActiveTab('songs')}
          className={`rounded-xl py-2 text-sm font-bold ${
            activeTab === 'songs' ? 'bg-emerald-500 text-black' : 'text-white/60'
          }`}
        >
          Songs
        </button>
        <button
          onClick={() => setActiveTab('playlists')}
          className={`rounded-xl py-2 text-sm font-bold ${
            activeTab === 'playlists' ? 'bg-emerald-500 text-black' : 'text-white/60'
          }`}
        >
          Playlists
        </button>
      </div>

      {!hasYouTubeKey && (
        <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          <p className="font-bold">YouTube API key not configured</p>
          <p className="mt-1 text-yellow-100/75">
            Add VITE_YOUTUBE_API_KEY in .env to enable real YouTube search.
            App will stay safe without crashing.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {!query.trim() && (
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent searches</h2>
            {searchHistory.length > 0 && (
              <button
                onClick={clearSearchHistory}
                className="flex items-center gap-1 text-xs font-bold text-red-300"
              >
                <Trash2 size={14} />
                Clear
              </button>
            )}
          </div>

          {searchHistory.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">Your searches will appear here.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchHistory.map((item) => (
                <button
                  key={item}
                  onClick={() => searchFromHistory(item)}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'songs' && query.trim() && (
        <section className="mt-6">
          <h2 className="text-lg font-bold">Songs</h2>

          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/10" />
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-white/5 p-6 text-center">
              <Music2 className="mx-auto text-white/40" size={38} />
              <p className="mt-3 text-sm text-white/50">
                Search results will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {songs.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => playSong(track, index)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-2 text-left active:scale-[0.99]"
                >
                  <SafeImage
                    src={track.thumbnail}
                    alt={track.title}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{track.title}</p>
                    <p className="truncate text-xs text-white/50">
                      {track.artist} {track.language ? `• ${track.language}` : ''}
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-500 p-2 text-black">
                    <Play size={16} fill="black" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'playlists' && query.trim() && (
        <section className="mt-6">
          <h2 className="text-lg font-bold">Playlists</h2>

          {loading ? (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-square animate-pulse rounded-3xl bg-white/10" />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-white/5 p-6 text-center">
              <Music2 className="mx-auto text-white/40" size={38} />
              <p className="mt-3 text-sm text-white/50">
                Playlist results will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => openPlaylist(playlist)}
                  className="text-left active:scale-[0.99]"
                >
                  <SafeImage
                    src={playlist.thumbnail}
                    alt={playlist.title}
                    className="aspect-square w-full rounded-3xl object-cover"
                  />
                  <p className="mt-2 line-clamp-2 text-sm font-bold">{playlist.title}</p>
                  <p className="mt-1 truncate text-xs text-white/50">{playlist.channelName}</p>
                  {playlistLoadingId === playlist.id && (
                    <p className="mt-1 text-xs text-emerald-400">Opening...</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
