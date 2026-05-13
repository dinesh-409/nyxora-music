import { useEffect, useMemo, useRef } from 'react'
import { Expand, Minus, Plus, RotateCcw, Share2 } from 'lucide-react'
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

    const top = line.offsetTop - container.clientHeight * 0.18

    container.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    })
  }, [activeIndex, lyrics?.lines?.length])

  if (!currentTrack) {
    return (
      <div className="rounded-[1.7rem] bg-white/8 p-5">
        <p className="text-2xl font-black">Lyrics</p>
        <p className="mt-4 text-base text-white/55">Play a song to view lyrics.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-[1.7rem] bg-white/8 p-5">
        <p className="text-2xl font-black">Lyrics</p>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-7 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
      </div>
    )
  }

  if (!lyrics || lyrics.source === 'missing') {
    return (
      <div className="rounded-[1.7rem] bg-white/8 p-5">
        <p className="text-2xl font-black">Lyrics</p>
        <p className="mt-4 text-base text-white/55">
          {lyrics?.message ?? 'Lyrics not available for this song'}
        </p>
      </div>
    )
  }

  if (!lyrics.synced && lyrics.plainLyrics) {
    return (
      <div className="rounded-[1.7rem] bg-[#0c6172]/70 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black">Lyrics</p>
          <button className="rounded-full bg-black/20 p-3">
            <Expand size={19} />
          </button>
        </div>

        <div className="mt-6 max-h-96 overflow-y-auto whitespace-pre-line text-2xl font-black leading-snug text-white">
          {lyrics.plainLyrics}
        </div>
      </div>
    )
  }

  const currentLine = activeIndex >= 0 ? lyrics.lines[activeIndex] : null

  return (
    <div className="rounded-[1.7rem] bg-[#0c6172]/70 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-2xl font-black">Lyrics</p>

        <div className="flex items-center gap-2">
          <button className="rounded-full bg-black/25 p-3">
            <Share2 size={18} />
          </button>
          <button className="rounded-full bg-black/25 p-3">
            <Expand size={18} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs font-black text-white/70">
        <button onClick={() => adjustLyricsOffset(-0.5)} className="rounded-full bg-black/20 p-2">
          <Minus size={13} />
        </button>
        <button onClick={resetLyricsOffset} className="rounded-full bg-black/20 px-3 py-2">
          {lyricsOffset === 0 ? '0.0s' : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}
        </button>
        <button onClick={() => adjustLyricsOffset(0.5)} className="rounded-full bg-black/20 p-2">
          <Plus size={13} />
        </button>
        <button onClick={resetLyricsOffset} className="rounded-full bg-black/20 p-2">
          <RotateCcw size={13} />
        </button>
      </div>

      {currentLine && (
        <p className="mb-5 text-3xl font-black leading-tight text-white">
          {currentLine.text}
        </p>
      )}

      <div
        ref={containerRef}
        className="max-h-[310px] overflow-y-auto pr-1"
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-5 pb-24">
          {lyrics.lines.map((line, index) => {
            const active = index === activeIndex
            const next = index === activeIndex + 1 || index === activeIndex + 2

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
                    ? 'hidden'
                    : next
                      ? 'text-2xl font-black leading-tight text-cyan-300'
                      : 'text-xl font-black leading-tight text-cyan-300/55'
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
