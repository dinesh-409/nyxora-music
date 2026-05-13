import { useEffect, useMemo } from 'react'
import { useLyricsStore } from '../../store/lyrics-store'
import { usePlayerStore } from '../../store/player-store'
import { getActiveLyricIndex } from '../../lib/lrc'

export function CurrentLyricsPreview() {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const lyricsOffset = usePlayerStore((state) => state.lyricsOffset)
  const { lyrics, loading, loadLyrics } = useLyricsStore()

  useEffect(() => {
    loadLyrics(currentTrack)
  }, [currentTrack?.id, loadLyrics])

  const adjustedTime = currentTime + lyricsOffset

  const activeIndex = useMemo(() => {
    if (!lyrics?.lines?.length) return -1
    return getActiveLyricIndex(lyrics.lines, adjustedTime)
  }, [lyrics, adjustedTime])

  if (!currentTrack) return null

  if (loading) {
    return (
      <div className="mt-8 text-center">
        <div className="mx-auto h-6 w-72 max-w-full animate-pulse rounded-full bg-white/10" />
        <div className="mx-auto mt-3 h-4 w-56 max-w-full animate-pulse rounded-full bg-white/10" />
      </div>
    )
  }

  if (!lyrics?.synced || !lyrics.lines.length || activeIndex < 0) {
    return (
      <div className="mt-8 text-center">
        <p className="line-clamp-2 text-xl font-black leading-snug text-white">
          {currentTrack.title}
        </p>
        <p className="mt-2 line-clamp-1 text-base font-semibold text-white/55">
          Synced lyrics not available
        </p>
      </div>
    )
  }

  const currentLine = lyrics.lines[activeIndex]
  const nextLine = lyrics.lines[activeIndex + 1]

  return (
    <div className="mt-8 text-center">
      <p className="line-clamp-2 text-xl font-black leading-snug text-white">
        {currentLine.text}
      </p>
      <p className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-white/60">
        {nextLine?.text ?? ' '}
      </p>
    </div>
  )
}
