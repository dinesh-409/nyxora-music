import { useEffect, useMemo, useState } from 'react'
import type { Track } from '../types/music'

const STORAGE_KEY = 'nyxora-liked-tracks'

function getTrackLikeKey(track?: Track | null) {
  if (!track) return ''
  return `${track.id || ''}-${track.videoId || ''}-${track.title || ''}-${track.artist || ''}`.toLowerCase()
}

function readLikedKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function writeLikedKeys(keys: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(keys))))
}

export function useLikedTrack(track?: Track | null) {
  const likeKey = useMemo(() => getTrackLikeKey(track), [track])
  const [likedKeys, setLikedKeys] = useState<string[]>(() => readLikedKeys())

  useEffect(() => {
    function syncLikedState() {
      setLikedKeys(readLikedKeys())
    }

    window.addEventListener('nyxora-liked-changed', syncLikedState)
    window.addEventListener('storage', syncLikedState)

    return () => {
      window.removeEventListener('nyxora-liked-changed', syncLikedState)
      window.removeEventListener('storage', syncLikedState)
    }
  }, [])

  const liked = Boolean(likeKey && likedKeys.includes(likeKey))

  function toggleLiked() {
    if (!track || !likeKey) return

    const currentKeys = readLikedKeys()
    const alreadyLiked = currentKeys.includes(likeKey)

    const nextKeys = alreadyLiked
      ? currentKeys.filter((key) => key !== likeKey)
      : [...currentKeys, likeKey]

    writeLikedKeys(nextKeys)
    setLikedKeys(nextKeys)

    window.dispatchEvent(new CustomEvent('nyxora-liked-changed'))

    window.dispatchEvent(
      new CustomEvent('nyxora-toast', {
        detail: alreadyLiked ? 'Removed from liked songs' : 'Added to liked songs',
      }),
    )
  }

  return { liked, toggleLiked }
}
