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
      <div className="mt-5 rounded-3xl bg-white/5 p-4">
        <div className="h-5 animate-pulse rounded-full bg-white/10" />
        <div className="mt-3 h-4 animate-pulse rounded-full bg-white/10" />
      </div>
    )
  }

  if (!lyrics?.synced || !lyrics.lines.length || activeIndex < 0) {
    return (
      <div className="mt-5 rounded-3xl bg-white/5 p-4 text-center">
        <p className="text-sm font-bold text-white/80">Lyrics preview</p>
        <p className="mt-1 text-xs text-white/45">
          Synced lyrics not available for this song.
        </p>
      </div>
    )
  }

  const currentLine = lyrics.lines[activeIndex]
  const nextLine = lyrics.lines[activeIndex + 1]

  return (
    <div className="mt-5 rounded-3xl bg-white/5 p-4 text-center">
      <p className="line-clamp-2 text-lg font-black leading-snug text-emerald-400">
        {currentLine.text}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-white/55">
        {nextLine?.text ?? ' '}
      </p>
    </div>
  )
}
