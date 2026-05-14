import { Pause, Play } from 'lucide-react'
import { usePlayerStore } from '../../store/player-store'
import type { Track } from '../../types/music'

type Props = {
  playlistId: string
  playlistTitle: string
  tracks: Track[]
  size?: 'normal' | 'large'
}

function getTrackKey(track?: Track | null) {
  if (!track) return ''
  return (
    track.videoId ||
    track.id ||
    `${track.title || ''}-${track.artist || ''}`.toLowerCase().trim()
  )
}

function isSameTrack(a?: Track | null, b?: Track | null) {
  const aKey = getTrackKey(a)
  const bKey = getTrackKey(b)

  if (!aKey || !bKey) return false
  return aKey === bKey
}

export function PlaylistUniversalPlayButton({
  playlistId,
  playlistTitle,
  tracks,
  size = 'large',
}: Props) {
  const {
    currentTrack,
    isPlaying,
    setPlaying,
    setQueue,
  } = usePlayerStore()

  const currentTrackIndex = tracks.findIndex((track) => isSameTrack(track, currentTrack))
  const isCurrentPlaylistSong = currentTrackIndex !== -1
  const showPause = isCurrentPlaylistSong && isPlaying

  function handleClick() {
    if (!tracks.length) {
      window.dispatchEvent(
        new CustomEvent('nyxora-toast', {
          detail: 'No songs available in this playlist',
        }),
      )
      return
    }

    if (isCurrentPlaylistSong) {
      setPlaying(!isPlaying)
      return
    }

    setQueue(tracks, 0, playlistId || playlistTitle)
    setPlaying(true)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center justify-center rounded-full bg-emerald-400 text-black shadow-xl active:scale-95 ${
        size === 'large' ? 'h-16 w-16' : 'h-14 w-14'
      }`}
      aria-label={showPause ? 'Pause playlist' : 'Play playlist'}
    >
      {showPause ? (
        <Pause size={size === 'large' ? 31 : 25} fill="black" />
      ) : (
        <Play size={size === 'large' ? 31 : 25} fill="black" className="ml-1" />
      )}
    </button>
  )
}
