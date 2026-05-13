import { useEffect, useMemo, useRef } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { getActiveLyricIndex } from '../../lib/lrc'
import { useLyricsStore } from '../../store/lyrics-store'
import { usePlayerStore } from '../../store/player-store'

export function LyricsPanel() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  const autoScrollBlockUntilRef = useRef(0)

  const {
    currentTrack,
    currentTime,
    seekSource,
    seekTo,
    lyricsOffset,
    adjustLyricsOffset,
    resetLyricsOffset,
  } = usePlayerStore()

  const { lyrics, loading, loadLyrics } = useLyricsStore()

  useEffect(() => {
    loadLyrics(currentTrack)
  }, [currentTrack?.id, loadLyrics])

  const adjustedTime = currentTime + lyricsOffset

  const activeIndex = useMemo(() => {
    if (!lyrics?.lines?.length) return -1
    return getActiveLyricIndex(lyrics.lines, adjustedTime)
  }, [lyrics, adjustedTime])

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

    // Keep current line slightly above middle so next 1-2 lines are visible.
    const top = line.offsetTop - container.clientHeight * 0.32

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

  const currentLine = activeIndex >= 0 ? lyrics.lines[activeIndex] : null
  const nextLine = activeIndex >= 0 ? lyrics.lines[activeIndex + 1] : null

  return (
    <div className="rounded-3xl bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">Lyrics</p>
          <p className="mt-1 text-xs text-white/45">
            Current + next line stays visible
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustLyricsOffset(-0.5)}
            className="rounded-full bg-white/10 p-2"
            title="Lyrics earlier"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={resetLyricsOffset}
            className="rounded-full bg-white/10 px-2 py-2 text-[11px] font-bold"
            title="Reset lyrics offset"
          >
            {lyricsOffset === 0 ? '0.0s' : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}
          </button>
          <button
            onClick={() => adjustLyricsOffset(0.5)}
            className="rounded-full bg-white/10 p-2"
            title="Lyrics later"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={resetLyricsOffset}
            className="rounded-full bg-white/10 p-2"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {currentLine && (
        <div className="mt-4 rounded-2xl bg-black/20 p-4 text-center">
          <p className="line-clamp-2 text-lg font-black text-emerald-400">
            {currentLine.text}
          </p>
          <p className="mt-2 line-clamp-2 text-sm font-bold text-white/55">
            {nextLine?.text ?? ' '}
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        className="mt-4 max-h-96 overflow-y-auto rounded-2xl bg-black/20 p-4"
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-5 pb-28 pt-8">
          {lyrics.lines.map((line, index) => {
            const active = index === activeIndex
            const next = index === activeIndex + 1

            return (
              <button
                key={`${line.time}-${index}`}
                ref={(node) => {
                  lineRefs.current[index] = node
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  seekTo(Math.max(0, line.time - lyricsOffset), 'lyrics')
                }}
                className={`block w-full text-left transition ${
                  active
                    ? 'text-xl font-black text-emerald-400'
                    : next
                      ? 'text-lg font-bold text-white/75'
                      : 'text-base font-bold text-white/35'
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
