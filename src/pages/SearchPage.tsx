import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowLeft,
  Play,
  Search,
  X,
} from 'lucide-react'
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
type SearchMode = 'home' | 'focused'

const browsingCards = [
  { title: 'Music', color: 'bg-pink-600' },
  { title: 'Podcasts', color: 'bg-emerald-700' },
  { title: 'Live Events', color: 'bg-purple-700' },
  { title: 'Home of I-Pop', color: 'bg-blue-900' },
]

const pickedCards = [
  {
    title: 'Your Party Starts Now',
    description: 'Rediscover your all-time listens here.',
  },
]

export function SearchPage() {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [mode, setMode] = useState<SearchMode>('home')
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
    removeSearchQuery,
    setQueue,
    setPlaying,
    currentTrack,
  } = usePlayerStore()

  const listeningLanguages = useSettingsStore((state) => state.listeningLanguages)
  const hasYouTubeKey = Boolean(import.meta.env.VITE_YOUTUBE_API_KEY)

  const liveSuggestions = useMemo(() => {
    const clean = query.trim()

    if (!clean) {
      return searchHistory.slice(0, 8)
    }

    const matchingHistory = searchHistory
      .filter((item) => item.toLowerCase().includes(clean.toLowerCase()))
      .slice(0, 4)

    return [clean, ...matchingHistory]
      .filter((item, index, arr) => item && arr.indexOf(item) === index)
  }, [query, searchHistory])

  useEffect(() => {
    if (mode !== 'focused') return

    const clean = query.trim()

    if (clean.length < 2) {
      setSongs([])
      setPlaylists([])
      setError(null)
      return
    }

    const timer = window.setTimeout(() => {
      runSearch(clean, false)
    }, 420)

    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab, mode])

  useEffect(() => {
    if (mode === 'focused') {
      window.setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [mode])

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

  function openFocusedSearch() {
    setMode('focused')
  }

  function backToHome() {
    setMode('home')
    setError(null)
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

  if (mode === 'focused') {
    return (
      <div className="min-h-screen bg-[#121212] px-4 pt-5 text-white">
        <div className="sticky top-0 z-20 -mx-4 bg-[#242424]/95 px-4 pb-4 pt-2 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={backToHome} className="rounded-full p-2 active:bg-white/10">
              <ArrowLeft size={32} />
            </button>

            <form
              className="flex min-w-0 flex-1 items-center gap-2 border-l-2 border-emerald-500 px-3 py-2"
              onSubmit={(event) => {
                event.preventDefault()
                runSearch(query, true)
              }}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="What do you want to listen to?"
                className="w-full bg-transparent text-2xl font-medium outline-none placeholder:text-white/45"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setSongs([])
                    setPlaylists([])
                  }}
                >
                  <X size={22} />
                </button>
              )}
            </form>
          </div>
        </div>

        {!hasYouTubeKey && (
          <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Add VITE_YOUTUBE_API_KEY in .env to enable real YouTube search.
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {!query.trim() ? (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black">Recents</h2>

              {searchHistory.length > 0 && (
                <button
                  onClick={clearSearchHistory}
                  className="text-sm font-bold text-white/50"
                >
                  Clear all
                </button>
              )}
            </div>

            {searchHistory.length === 0 ? (
              <p className="mt-4 text-white/50">Your recent searches will appear here.</p>
            ) : (
              <div className="mt-6 space-y-5">
                {searchHistory.slice(0, 10).map((item, index) => (
                  <button
                    key={`${item}-${index}`}
                    onClick={() => chooseSuggestion(item)}
                    className="flex w-full items-center gap-4 text-left"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Search size={25} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-2xl font-bold text-white">{item}</p>
                      <p className="mt-1 text-lg text-white/50">Recent search</p>
                    </div>

                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        removeSearchQuery(item)
                      }}
                      className="text-white/55"
                      aria-label="Remove recent search"
                    >
                      <X size={30} />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="mt-7 space-y-6">
              {liveSuggestions.slice(0, 3).map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  onClick={() => chooseSuggestion(item)}
                  className="flex w-full items-center gap-5 text-left"
                >
                  <Search size={29} className="text-white" />
                  <span className="min-w-0 flex-1 truncate text-2xl text-white/85">
                    {item}
                  </span>
                  {index > 1 && <ArrowDownLeft size={25} className="text-white/45" />}
                </button>
              ))}
            </section>

            <div className="mt-7 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
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

            {activeTab === 'songs' && (
              <section className="mt-6 pb-40">
                {loading && songs.length === 0 ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="h-20 animate-pulse rounded-xl bg-white/10" />
                    ))}
                  </div>
                ) : songs.length === 0 ? (
                  <p className="text-white/45">Live results will appear here.</p>
                ) : (
                  <div className="space-y-5">
                    {songs.map((track, index) => (
                      <button
                        key={track.id}
                        onClick={() => playSong(track, index)}
                        className="flex w-full items-center gap-4 text-left active:scale-[0.99]"
                      >
                        <SafeImage
                          src={track.thumbnail}
                          alt={track.title}
                          className="h-20 w-20 shrink-0 rounded-lg object-cover"
                          loading="eager"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-2xl font-bold text-white">
                            {track.title}
                          </p>
                          <p className="mt-1 truncate text-lg text-white/55">
                            Song • {track.artist}
                          </p>
                        </div>
                        <Play size={24} className="text-white/75" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'playlists' && (
              <section className="mt-6 pb-40">
                {loading && playlists.length === 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="aspect-square animate-pulse rounded-3xl bg-white/10" />
                    ))}
                  </div>
                ) : playlists.length === 0 ? (
                  <p className="text-white/45">Playlist results will appear here.</p>
                ) : (
                  <div className="space-y-5">
                    {playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => openPlaylist(playlist)}
                        className="flex w-full items-center gap-4 text-left"
                      >
                        <SafeImage
                          src={playlist.thumbnail}
                          alt={playlist.title}
                          className="h-20 w-20 shrink-0 rounded-lg object-cover"
                          loading="eager"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xl font-bold">{playlist.title}</p>
                          <p className="mt-1 truncate text-lg text-white/55">
                            Playlist • {playlist.channelName}
                          </p>
                          {playlistLoadingId === playlist.id && (
                            <p className="mt-1 text-sm text-emerald-400">Opening...</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] px-4 pt-6 text-white">
      <div className="flex items-center gap-4">
        <SafeImage
          src="/logo.png"
          alt="Profile"
          className="h-16 w-16 rounded-full object-cover"
          loading="eager"
        />
        <h1 className="text-5xl font-black">Search</h1>
      </div>

      <button
        onClick={openFocusedSearch}
        className="mt-8 flex w-full items-center gap-4 rounded-md bg-white px-4 py-5 text-left text-black"
      >
        <Search size={34} />
        <span className="text-2xl font-black text-black/70">
          What do you want to listen to?
        </span>
      </button>

      <section className="mt-9">
        <h2 className="text-3xl font-black">Start browsing</h2>
        <div className="mt-5 grid grid-cols-2 gap-4">
          {browsingCards.map((card) => (
            <button
              key={card.title}
              onClick={() => {
                setQuery(card.title)
                setMode('focused')
              }}
              className={`${card.color} h-32 overflow-hidden rounded-xl p-4 text-left text-2xl font-black`}
            >
              {card.title}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <h2 className="text-3xl font-black">Picked for you</h2>
        {pickedCards.map((card) => (
          <button
            key={card.title}
            onClick={() => {
              setQuery('party songs')
              setMode('focused')
            }}
            className="mt-5 w-full overflow-hidden rounded-2xl bg-white/10 p-6 text-left"
          >
            <div className="min-h-36 rounded-xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.35),transparent_45%),linear-gradient(135deg,#151515,#000)] p-5">
              <div className="pt-20">
                <p className="text-3xl font-black">{card.title}</p>
                <p className="mt-3 text-lg text-white">{card.description}</p>
              </div>
            </div>
          </button>
        ))}
      </section>

      <section className="mt-9 pb-40">
        <h2 className="text-3xl font-black">Discover something new</h2>
        <div className="mt-5 flex gap-4 overflow-x-auto pb-3">
          {['Tamil Hits', 'English Pop', 'Malayalam Mix', 'Hindi Love'].map((item) => (
            <button
              key={item}
              onClick={() => {
                setQuery(item)
                setMode('focused')
              }}
              className="h-40 w-36 shrink-0 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 p-4 text-left font-black"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {currentTrack && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 mx-auto h-0 max-w-md" />
      )}
    </div>
  )
}
