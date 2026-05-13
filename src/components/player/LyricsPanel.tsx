import { useEffect, useMemo, useRef, useState } from 'react'
import type { LyricsResult } from '../../lib/lyrics.functions'
import { fetchLyrics } from '../../lib/lyrics.functions'
import { getActiveLyricIndex } from '../../lib/lrc'
import { usePlayerStore } from '../../store/player-store'

export function LyricsPanel() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  const autoScrollBlockUntilRef = useRef(0)

  const { currentTrack, currentTime, seekSource, seekTo } = usePlayerStore()

  const [lyrics, setLyrics] = useState<LyricsResult | null>(null)
  const [loading, setLoading] = useState(false)

  const activeIndex = useMemo(() => {
    if (!lyrics?.lines?.length) return -1
    return getActiveLyricIndex(lyrics.lines, currentTime)
  }, [lyrics, currentTime])

  useEffect(() => {
    let cancelled = false

    async function loadLyrics() {
      if (!currentTrack) {
        setLyrics(null)
        return
      }

      setLoading(true)
      const result = await fetchLyrics(currentTrack)

      if (!cancelled) {
        setLyrics(result)
        setLoading(false)
      }
    }

    loadLyrics()

    return () => {
      cancelled = true
    }
  }, [currentTrack?.id])

  useEffect(() => {
    if (seekSource === 'seekbar') {
      autoScrollBlockUntilRef.current = Date.now() + 1000
    }
  }, [seekSource, currentTime])

  useEffect(() => {
    if (!lyrics?.lines?.length) return
    if (activeIndex < 0) return
    if (Date.now() < autoScrollBlockUntilRef.current) return

    const container = containerRef.current
    const line = lineRefs.current[activeIndex]

    if (!container || !line) return

    const top = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2

    container.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    })
  }, [activeIndex, lyrics?.lines?.length])

  if (!currentTrack) {
    return (
      <div className="rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-bold">Lyrics</p>
        <p className="mt-2 text-sm text-white/55">Play a song to view lyrics.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-bold">Lyrics</p>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-5 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
      </div>
    )
  }

  if (!lyrics || lyrics.source === 'missing') {
    return (
      <div className="rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-bold">Lyrics</p>
        <p className="mt-2 text-sm text-white/55">
          {lyrics?.message ?? 'Lyrics not available for this song'}
        </p>
      </div>
    )
  }

  if (!lyrics.synced && lyrics.plainLyrics) {
    return (
      <div className="rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-bold">Lyrics</p>
        <div className="mt-4 max-h-80 overflow-y-auto whitespace-pre-line rounded-2xl bg-black/20 p-4 text-sm leading-7 text-white/80">
          {lyrics.plainLyrics}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white/5 p-4">
      <p className="text-sm font-bold">Lyrics</p>

      {activeIndex >= 0 && lyrics.lines[activeIndex] && (
        <p className="mt-3 text-lg font-black text-emerald-400">
          {lyrics.lines[activeIndex].text}
        </p>
      )}

      <div
        ref={containerRef}
        className="mt-4 max-h-80 overflow-y-auto rounded-2xl bg-black/20 p-4"
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-4">
          {lyrics.lines.map((line, index) => {
            const active = index === activeIndex

            return (
              <button
                key={`${line.time}-${index}`}
                ref={(node) => {
                  lineRefs.current[index] = node
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  seekTo(line.time, 'lyrics')
                }}
                className={`block w-full text-left text-base font-bold transition ${
                  active ? 'text-emerald-400' : 'text-white/45'
                }`}
              >
                {line.text}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
