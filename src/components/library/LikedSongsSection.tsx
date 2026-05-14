import { useEffect, useState } from 'react'
import { Heart, Play, Trash2 } from 'lucide-react'
import { SafeImage } from '../common/SafeImage'
import { usePlayerStore } from '../../store/player-store'
import {
  getLikedTracks,
  removeTrackFromLikedSongs,
} from '../../lib/liked-tracks'
import type { Track } from '../../types/music'

export function LikedSongsSection() {
  const [likedSongs, setLikedSongs] = useState<Track[]>(() => getLikedTracks())
  const { setQueue, setPlaying } = usePlayerStore()

  useEffect(() => {
    const syncLikedSongs = () => setLikedSongs(getLikedTracks())

    syncLikedSongs()
    window.addEventListener('nyxora-liked-changed', syncLikedSongs)
    window.addEventListener('storage', syncLikedSongs)

    return () => {
      window.removeEventListener('nyxora-liked-changed', syncLikedSongs)
      window.removeEventListener('storage', syncLikedSongs)
    }
  }, [])

  function playLikedSong(index: number) {
    setQueue(likedSongs, index, 'Liked Songs')
    setPlaying(true)
  }

  if (!likedSongs.length) {
    return (
      <section className="mt-7 rounded-3xl bg-white/5 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-emerald-400">
            <Heart size={30} fill="currentColor" className="text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-black text-white">Liked Songs</h2>
            <p className="mt-1 text-sm text-white/55">
              Songs you like will appear here.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Liked Songs</h2>
          <p className="mt-1 text-sm text-white/55">
            {likedSongs.length} liked {likedSongs.length === 1 ? 'song' : 'songs'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => playLikedSong(0)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-black active:scale-95"
          aria-label="Play liked songs"
        >
          <Play size={24} fill="black" />
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {likedSongs.map((track, index) => (
          <div key={`${track.id}-${track.videoId}-${index}`} className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => playLikedSong(index)}
              className="flex min-w-0 flex-1 items-center gap-4 text-left active:scale-[0.99]"
            >
              <SafeImage
                src={track.thumbnail}
                alt={track.title}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
                loading="eager"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold text-white">{track.title}</p>
                <p className="mt-1 truncate text-sm text-white/55">
                  Song • {track.artist}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                removeTrackFromLikedSongs(track)
                setLikedSongs(getLikedTracks())
                window.dispatchEvent(
                  new CustomEvent('nyxora-toast', {
                    detail: 'Removed from liked songs',
                  }),
                )
              }}
              className="rounded-full p-2 text-white/60 active:bg-white/10"
              aria-label="Remove liked song"
            >
              <Trash2 size={21} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
