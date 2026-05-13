import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Track } from '../../types/music'
import { isTrackLiked, toggleTrackLiked } from '../../lib/liked-tracks'

type TrackLikeButtonProps = {
  track: Track
  className?: string
  size?: number
}

export function TrackLikeButton({ track, className = '', size = 24 }: TrackLikeButtonProps) {
  const [liked, setLiked] = useState(() => isTrackLiked(track))

  useEffect(() => {
    function syncLikedState() {
      setLiked(isTrackLiked(track))
    }

    syncLikedState()
    window.addEventListener('nyxora-liked-changed', syncLikedState)
    window.addEventListener('storage', syncLikedState)

    return () => {
      window.removeEventListener('nyxora-liked-changed', syncLikedState)
      window.removeEventListener('storage', syncLikedState)
    }
  }, [track])

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        toggleTrackLiked(track)
        setLiked(isTrackLiked(track))
      }}
      className={`rounded-full p-2 active:bg-white/10 ${
        liked ? 'text-emerald-400' : 'text-white/70'
      } ${className}`}
      aria-label={liked ? 'Remove from liked songs' : 'Add to liked songs'}
    >
      <Heart size={size} fill={liked ? 'currentColor' : 'none'} />
    </button>
  )
}
