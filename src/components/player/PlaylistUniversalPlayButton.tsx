import { Pause, Play } from 'lucide-react'
import { usePlayerStore } from '../../store/player-store'
import type { Track } from '../../types/music'

type Props = {
  playlistId: string
  playlistTitle: string
  tracks: Track[]
  size?: 'normal' | 'large'
}

function sameTrack(a?: Track | null, b?: Track | null) {
  if (!a || !b) return false
  return (
    (a.videoId && b.videoId && a.videoId === b.videoId) ||
    (a.id && b.id && a.id === b.id) ||
    `${a.title}-${a.artist}` === `${b.title}-${b.artist}`
  )
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
    activeContextId,
    activeContextTitle,
  } = usePlayerStore()

  const currentSongInsideThisPlaylist = tracks.some((track) => sameTrack(track, currentTrack))

  const isThisPlaylistActive =
    currentSongInsideThisPlaylist &&
    (activeContextId === playlistId ||
      activeContextTitle === playlistTitle ||
      activeContextId === playlistTitle)

  const showPause = isThisPlaylistActive && isPlaying

  function handleClick() {
    if (!tracks.length) {
      window.dispatchEvent(
        new CustomEvent('nyxora-toast', {
          detail: 'No songs available in this playlist',
        }),
      )
      return
    }

    if (isThisPlaylistActive) {
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
        size === 'large' ? 'h-20 w-20' : 'h-14 w-14'
      }`}
      aria-label={showPause ? 'Pause playlist' : 'Play playlist'}
    >
      {showPause ? (
        <Pause size={size === 'large' ? 38 : 26} fill="black" />
      ) : (
        <Play size={size === 'large' ? 38 : 26} fill="black" className="ml-1" />
      )}
    </button>
  )
}
