import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Track } from '../types/music'
import {
  getTrackLikeKey,
  isTrackLiked,
  toggleTrackLiked,
} from '../lib/liked-tracks'

export function useLikedTrack(track: Track | null | undefined) {
  const trackKey = useMemo(() => {
    return track ? getTrackLikeKey(track) : ''
  }, [track])

  const [liked, setLiked] = useState(() => (track ? isTrackLiked(track) : false))

  const syncLiked = useCallback(() => {
    setLiked(track ? isTrackLiked(track) : false)
  }, [track, trackKey])

  useEffect(() => {
    syncLiked()

    window.addEventListener('nyxora-liked-changed', syncLiked)
    window.addEventListener('storage', syncLiked)

    return () => {
      window.removeEventListener('nyxora-liked-changed', syncLiked)
      window.removeEventListener('storage', syncLiked)
    }
  }, [syncLiked])

  const toggleLiked = useCallback(() => {
    if (!track) return false

    const next = toggleTrackLiked(track, true)
    setLiked(next)

    return next
  }, [track, trackKey])

  return {
    liked,
    toggleLiked,
  }
}
