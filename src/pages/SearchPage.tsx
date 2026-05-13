import { useEffect, useMemo, useState } from 'react'
import { Loader2, Music2, Play, Search, Trash2, X } from 'lucide-react'
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

const browsingCards = ['Music', 'Podcasts', 'Live Events', 'Home of I-Pop']

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

  const liveSuggestions = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return searchHistory.slice(0, 6)

    return [
      clean,
      `${clean} song`,
      `${clean} official`,
      `${clean} slowed`,
      `${clean} tamil`,
    ].filter((item, index, arr) => item && arr.indexOf(item) === index)
  }, [query, searchHistory])

  useEffect(() => {
    const clean = query.trim()

    if (clean.length < 2) {
      setSongs([])
      setPlaylists([])
      setError(null)
      return
    }

    const timer = window.setTimeout(() => {
      runSearch(clean, false)
    }, 450)

    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab])

  async function runSearch(searchText = query, saveHistory = true) {
    const clean = searchText.trim()
    if (!clean) return

    setLoading(true)
    setError(null)
    if (saveHistory) addSearchQuery(clean)

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
    addSearchQuery(query.trim() || track.title)
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

  function chooseSuggestion(item: string) {
    setQuery(item)
    addSearchQuery(item)
    runSearch(item)
  }

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-500 text-2xl">
          🤍
        </div>
        <h1 className="text-4xl font-black">Search</h1>
      </div>

      <form
        className="mt-8 flex items-center gap-3 rounded-xl bg-white px-4 py-4 text-black"
        onSubmit={(event) => {
          event.preventDefault()
          runSearch(query, true)
        }}
      >
        <Search size={28} className="text-black" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What do you want to listen to?"
          className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-black/65"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')}>
            <X size={22} />
          </button>
        )}
        {loading && <Loader2 size={20} className="animate-spin text-emerald-500" />}
      </form>

      {!hasYouTubeKey && (
        <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          <p className="font-bold">YouTube API key not configured</p>
          <p className="mt-1 text-yellow-100/75">
            Add VITE_YOUTUBE_API_KEY in .env to enable real YouTube search.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {!query.trim() && (
        <>
          <section className="mt-8">
            <h2 className="text-3xl font-black">Start browsing</h2>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {browsingCards.map((item, index) => (
                <button
                  key={item}
                  onClick={() => chooseSuggestion(item)}
                  className={`h-28 rounded-xl p-4 text-left text-2xl font-black ${
                    index === 0
                      ? 'bg-pink-600'
                      : index === 1
                        ? 'bg-emerald-700'
                        : index === 2
                          ? 'bg-purple-700'
                          : 'bg-blue-900'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Recents</h2>
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
              <div className="mt-4 space-y-4">
                {searchHistory.slice(0, 8).map((item) => (
                  <button
                    key={item}
                    onClick={() => chooseSuggestion(item)}
                    className="flex w-full items-center gap-4 text-left"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
                      <Search size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-bold">{item}</p>
                      <p className="text-sm text-white/50">Recent search</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {query.trim() && (
        <>
          <section className="mt-6 space-y-4">
            {liveSuggestions.slice(0, 5).map((item) => (
              <button
                key={item}
                onClick={() => chooseSuggestion(item)}
                className="flex w-full items-center gap-5 text-left"
              >
                <Search size={24} />
                <span className="text-xl text-white/80">{item}</span>
              </button>
            ))}
          </section>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
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
        </>
      )}

      {activeTab === 'songs' && query.trim() && (
        <section className="mt-6">
          {loading && songs.length === 0 ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/10" />
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="rounded-3xl bg-white/5 p-6 text-center">
              <Music2 className="mx-auto text-white/40" size={38} />
              <p className="mt-3 text-sm text-white/50">Live results will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => playSong(track, index)}
                  className="flex w-full items-center gap-4 text-left active:scale-[0.99]"
                >
                  <SafeImage
                    src={track.thumbnail}
                    alt={track.title}
                    className="h-16 w-16 rounded-lg object-cover"
                    loading="eager"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xl font-bold text-white">{track.title}</p>
                    <p className="truncate text-base text-white/55">
                      Song • {track.artist}
                    </p>
                  </div>
                  <Play size={22} className="text-white/75" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'playlists' && query.trim() && (
        <section className="mt-6">
          {loading && playlists.length === 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-square animate-pulse rounded-3xl bg-white/10" />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="rounded-3xl bg-white/5 p-6 text-center">
              <Music2 className="mx-auto text-white/40" size={38} />
              <p className="mt-3 text-sm text-white/50">Playlist results will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
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
                    loading="eager"
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
