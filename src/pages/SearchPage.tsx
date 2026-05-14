import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowLeft, MoreVertical, Search, X } from 'lucide-react'
import { SafeImage } from '../components/common/SafeImage'
import {
  fetchYouTubePlaylistItems,
  searchYouTubePlaylists,
  searchYouTubeSongs,
  type YouTubePlaylistSummary,
} from '../lib/youtube.functions'
import { useSettingsStore } from '../store/settings-store'
import type { Track } from '../types/music'
import { getCachedOrFallback, saveSearchCache } from '../lib/search-cache'
import { SongOptionsMenu } from '../components/player/SongOptionsMenu'
import { usePlayerStore } from '../store/player-store'
import { TrackLikeButton } from '../components/player/TrackLikeButton'
import { readRecentTracks, removeRecentTrack, saveRecentTrack } from '../lib/recent-tracks'

type SearchTab = 'songs' | 'playlists'
type SearchMode = 'home' | 'focused'

const browsingCards = [
  { title: 'Music', color: 'bg-pink-600' },
  { title: 'Podcasts', color: 'bg-emerald-700' },
  { title: 'Live Events', color: 'bg-purple-700' },
  { title: 'Home of I-Pop', color: 'bg-blue-900' },
]


function normalizeSongKey(value: string) {
  return value
    .toLowerCase()
    .replace(/official music video/gi, '')
    .replace(/official video/gi, '')
    .replace(/official song/gi, '')
    .replace(/full video song/gi, '')
    .replace(/full song/gi, '')
    .replace(/lyrics?/gi, '')
    .replace(/audio/gi, '')
    .replace(/4k/gi, '')
    .replace(/hd/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSameSong(a: Track, b: Track) {
  const aTitle = normalizeSongKey(a.title)
  const bTitle = normalizeSongKey(b.title)
  const aArtist = normalizeSongKey(a.artist || a.channelName || '')
  const bArtist = normalizeSongKey(b.artist || b.channelName || '')
  return (
    aTitle === bTitle ||
    (aTitle.includes(bTitle) && bTitle.length > 4) ||
    (bTitle.includes(aTitle) && aTitle.length > 4)
  ) && (
    !aArtist ||
    !bArtist ||
    aArtist.includes(bArtist) ||
    bArtist.includes(aArtist)
  )
}

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
  const [optionsTrack, setOptionsTrack] = useState<Track | null>(null)
  const [recentTracks, setRecentTracks] = useState<Track[]>(() => readRecentTracks())

  const {
    searchHistory,
    addSearchQuery,
setQueue,
    setPlaying,
    currentTrack,
  } = usePlayerStore()

  const listeningLanguages = useSettingsStore((state) => state.listeningLanguages)
  const hasYouTubeKey = Boolean(import.meta.env.VITE_YOUTUBE_API_KEY)

  function cleanSuggestionTitle(value: string) {
    return value
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[Official.*?\]/gi, '')
      .replace(/Official Music Video/gi, '')
      .replace(/Official Video/gi, '')
      .replace(/Official Song/gi, '')
      .replace(/Full Video Song/gi, '')
      .replace(/Full Song/gi, '')
      .replace(/Lyrics?/gi, '')
      .replace(/Audio/gi, '')
      .replace(/4K/gi, '')
      .replace(/HD/gi, '')
      .replace(/\|.*$/g, '')
      .replace(/#\w+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const topSong = songs[0] ?? null

  const similarSongs = useMemo(() => {
    if (!topSong) return []

    return songs
      .filter((track) => track.id !== topSong.id)
      .filter((track) => !isSameSong(track, topSong))
      .slice(0, 12)
  }, [songs, topSong])

  const liveSuggestions = useMemo(() => {
    const clean = query.trim()

    if (!clean) {
      return searchHistory.slice(0, 8)
    }

    const matchingHistory = searchHistory
      .filter((item: string) => item.toLowerCase().includes(clean.toLowerCase()))
      .slice(0, 2)

    const resultSuggestions = [topSong, ...similarSongs]
      .filter(Boolean)
      .map((track) => cleanSuggestionTitle((track as Track).title))
      .filter((title) => title.length > 1)
      .filter((title) => title.toLowerCase() !== clean.toLowerCase())
      .slice(0, 6)

    return [clean, ...matchingHistory, ...resultSuggestions]
      .filter((item, index, arr) => {
        const key = item.toLowerCase()
        return item && arr.findIndex((x) => x.toLowerCase() === key) === index
      })
      .slice(0, 7)
  }, [query, searchHistory, topSong, similarSongs])

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
        saveSearchCache(clean, result)
      } else {
        const result = await searchYouTubePlaylists(clean)
        setPlaylists(result)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'

      if (activeTab === 'songs') {
        const fallback = getCachedOrFallback(clean)
        if (fallback.length) {
          setSongs(fallback)
          setError(`${message} Showing cached/local results.`)
        } else {
          setError(message)
        }
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  function closeMobileKeyboard() {
    inputRef.current?.blur()

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    window.setTimeout(() => {
      inputRef.current?.blur()
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }, 50)
  }

  function openFocusedSearch() {
    setMode('focused')
  }

  function backToHome() {
    setMode('home')
    setError(null)
  }


  function removeRecentTrackFromSearch(track: Track) {
    setRecentTracks(removeRecentTrack(track))
  }

  function playSong(track: Track, index: number) {
    const queue = songs.length ? songs : [track]
    setRecentTracks(saveRecentTrack(track))
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
                closeMobileKeyboard()
              runSearch(query, true)
              }}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
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

        {error && mode !== 'focused' && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            <p className="font-bold">{error}</p>
            {error.includes('403') || error.toLowerCase().includes('quota') || error.toLowerCase().includes('blocked') ? (
              <p className="mt-2 text-red-100/75">
                If this happens often, your YouTube API quota may be finished or your API key restriction does not allow this Codespaces URL.
              </p>
            ) : null}
          </div>
        )}

        {!query.trim() ? (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black">Recents</h2>

              {recentTracks.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem('nyxora-recent-tracks')
                    setRecentTracks([])
                  }}
                  className="text-sm font-bold text-white/50"
                >
                  Clear all
                </button>
              )}
            </div>

            {recentTracks.length === 0 ? (
              <p className="mt-4 text-white/50">Your recent songs will appear here.</p>
            ) : (
              <div className="mt-6 space-y-5 pb-36">
                {recentTracks.slice(0, 12).map((track: Track, index: number) => (
                  <div
                    key={`${track.id}-${track.videoId}-${index}`}
                    className="flex w-full items-center gap-4"
                  >
                    <button
                      onClick={() => {
                        const realIndex = songs.findIndex((item) => item.id === track.id)
                        playSong(track, realIndex >= 0 ? realIndex : 0)
                      }}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left active:scale-[0.99]"
                    >
                      <SafeImage
                        src={track.thumbnail}
                        alt={track.title}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        loading="eager"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[23px] font-semibold text-white">{track.title}</p>
                        <p className="mt-1 truncate text-lg text-white/55">
                          Song • {track.artist}
                        </p>
                      </div>
                    </button>

                    <TrackLikeButton track={track} size={25} />

                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        removeRecentTrackFromSearch(track)
                      }}
                      className="text-white/55 active:text-white"
                      aria-label="Remove recent song"
                    >
                      <X size={32} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="mt-7 space-y-6">
              {liveSuggestions.slice(0, 7).map((item: string, index: number) => (
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

            <div className="hidden">
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
                  <div className="space-y-4">
                    {topSong && (
                      <div>
                        
                        <button
                          onClick={() => playSong(topSong, songs.findIndex((item) => item.id === topSong.id))}
                          className="flex w-full items-center gap-4 rounded-none bg-transparent p-0 text-left active:scale-[0.99]"
                        >
                          <SafeImage
                            src={topSong.thumbnail}
                            alt={topSong.title}
                            className="h-16 w-16 shrink-0 rounded-lg object-cover"
                            loading="eager"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[23px] font-semibold text-white">
                              {topSong.title}
                            </p>
                            <p className="mt-1 truncate text-lg text-white/55">
                              Song • {topSong.artist}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                setOptionsTrack(topSong)
                              }}
                              className="rounded-full p-2 text-white/75 active:bg-white/10"
                              aria-label="Open song options"
                            >
                              <MoreVertical size={24} />
                            </button>
                            <TrackLikeButton track={topSong} size={28} />
                          </div>
                        </button>
                      </div>
                    )}

                    {similarSongs.length > 0 && (
                      <div>
                        
                        <div className="space-y-5">
                          {similarSongs.map((track) => {
                            const realIndex = songs.findIndex((item) => item.id === track.id)

                            return (
                              <button
                                key={track.id}
                                onClick={() => playSong(track, realIndex >= 0 ? realIndex : 0)}
                                className="flex w-full items-center gap-4 text-left active:scale-[0.99]"
                              >
                                <SafeImage
                                  src={track.thumbnail}
                                  alt={track.title}
                                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                                  loading="eager"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[23px] font-semibold text-white">
                                    {track.title}
                                  </p>
                                  <p className="mt-1 truncate text-lg text-white/55">
                                    Song • {track.artist}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      setOptionsTrack(track)
                                    }}
                                    className="rounded-full p-2 text-white/65 active:bg-white/10"
                                    aria-label="Open song options"
                                  >
                                    <MoreVertical size={22} />
                                  </button>
                                  <TrackLikeButton track={track} size={24} />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {query.trim() && playlists.length > 0 && (
              <section className="mt-6 pb-40">
                {false ? (
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
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
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
        <SongOptionsMenu
          track={optionsTrack}
          open={Boolean(optionsTrack)}
          onClose={() => setOptionsTrack(null)}
        />
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
