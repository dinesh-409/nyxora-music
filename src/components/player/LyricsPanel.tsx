import { useEffect, useMemo, useRef, useState } from 'react'
import { Expand, Minus, Plus, RotateCcw, Share2, X } from 'lucide-react'
import { getActiveLyricIndex } from '../../lib/lrc'
import { useLyricsStore } from '../../store/lyrics-store'
import { usePlayerStore } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'

function LyricsContent({ expanded = false }: { expanded?: boolean }) {
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

    // Active line top side la irukkum. Next lines visible ah irukkum.
    const top = line.offsetTop - container.clientHeight * 0.14

    container.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    })
  }, [activeIndex, lyrics?.lines?.length])

  if (!currentTrack) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-white/10 p-5">
        <p className="text-2xl font-black">Lyrics</p>
        <p className="mt-4 text-base text-white/60">Play a song to view lyrics.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-white/10 p-5">
        <LyricsDynamicBackground />
        <div className="relative z-10">
          <p className="text-2xl font-black">Lyrics</p>
          <div className="mt-7 space-y-5">
            <div className="h-9 animate-pulse rounded-full bg-white/15" />
            <div className="h-7 w-4/5 animate-pulse rounded-full bg-white/10" />
            <div className="h-7 w-3/4 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  if (!lyrics || lyrics.source === 'missing') {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-white/10 p-5">
        <LyricsDynamicBackground />
        <div className="relative z-10">
          <p className="text-2xl font-black">Lyrics</p>
          <p className="mt-5 text-lg font-bold text-white/70">
            {lyrics?.message ?? 'Lyrics not available for this song'}
          </p>
          <p className="mt-2 text-sm text-white/45">
            New songs may get lyrics later from LRCLIB.
          </p>
        </div>
      </div>
    )
  }

  if (!lyrics.synced && lyrics.plainLyrics) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-white/10 p-5">
        <LyricsDynamicBackground />
        <div className="relative z-10">
          <LyricsHeader />
          <div
            className={`${expanded ? 'max-h-[78vh]' : 'max-h-[390px]'} mt-6 overflow-y-auto whitespace-pre-line pr-1 text-2xl font-black leading-snug text-white`}
          >
            {lyrics.plainLyrics}
          </div>
        </div>
      </div>
    )
  }

  const currentLine = activeIndex >= 0 ? lyrics.lines[activeIndex] : null
  const nextLine = activeIndex >= 0 ? lyrics.lines[activeIndex + 1] : null

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white/10 p-5 shadow-2xl">
      <LyricsDynamicBackground />

      <div className="relative z-10">
        <LyricsHeader />

        <div className="mt-5 flex items-center gap-2 text-xs font-black text-white/75">
          <button
            onClick={() => adjustLyricsOffset(-0.5)}
            className="rounded-full bg-black/25 p-2 backdrop-blur-xl"
            aria-label="Lyrics earlier"
          >
            <Minus size={13} />
          </button>

          <button
            onClick={resetLyricsOffset}
            className="rounded-full bg-black/25 px-3 py-2 backdrop-blur-xl"
          >
            {lyricsOffset === 0
              ? '0.0s'
              : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}
          </button>

          <button
            onClick={() => adjustLyricsOffset(0.5)}
            className="rounded-full bg-black/25 p-2 backdrop-blur-xl"
            aria-label="Lyrics later"
          >
            <Plus size={13} />
          </button>

          <button
            onClick={resetLyricsOffset}
            className="rounded-full bg-black/25 p-2 backdrop-blur-xl"
            aria-label="Reset lyrics offset"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {currentLine && (
          <button
            onClick={() => seekTo(Math.max(0, currentLine.time - lyricsOffset), 'lyrics')}
            className="mt-6 block w-full text-left"
          >
            <p className="text-3xl font-black leading-tight text-white drop-shadow-lg">
              {currentLine.text}
            </p>
            {nextLine && (
              <p className="mt-4 text-2xl font-black leading-tight text-cyan-200/95">
                {nextLine.text}
              </p>
            )}
          </button>
        )}

        <div
          ref={containerRef}
          className={`${expanded ? 'max-h-[62vh]' : 'max-h-[300px]'} mt-6 overflow-y-auto pr-1`}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="space-y-6 pb-28 pt-2">
            {lyrics.lines.map((line, index) => {
              const active = index === activeIndex
              const next = index === activeIndex + 1 || index === activeIndex + 2
              const future = index > activeIndex

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
                  className={`block w-full text-left transition duration-300 ${
                    active
                      ? 'text-3xl font-black leading-tight text-white'
                      : next
                        ? 'text-2xl font-black leading-tight text-cyan-200'
                        : future
                          ? 'text-xl font-black leading-tight text-cyan-100/55'
                          : 'text-xl font-black leading-tight text-white/30'
                  }`}
                >
                  {line.text}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function LyricsDynamicBackground() {
  const currentTrack = usePlayerStore((state) => state.currentTrack)

  return (
    <div className="pointer-events-none absolute inset-0">
      <SafeImage
        src={currentTrack?.thumbnail}
        alt=""
        className="h-full w-full scale-125 object-cover opacity-55 blur-3xl"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-black/35 to-black/70" />
      <div className="absolute inset-0 bg-cyan-900/25 mix-blend-overlay" />
    </div>
  )
}

function LyricsHeader() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <p className="text-2xl font-black text-white">Lyrics</p>

      <div className="flex items-center gap-2">
        <button className="rounded-full bg-black/25 p-3 backdrop-blur-xl">
          <Share2 size={18} />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-full bg-black/25 p-3 backdrop-blur-xl"
        >
          <Expand size={18} />
        </button>
      </div>
    </div>
  )
}

export function LyricsPanel() {
  const [expanded, setExpanded] = useState(false)

  if (expanded) {
    return (
      <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#050507] p-4 text-white">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xl font-black">Full Lyrics</p>
            <button
              onClick={() => setExpanded(false)}
              className="rounded-full bg-white/10 p-3"
            >
              <X size={20} />
            </button>
          </div>

          <LyricsContent expanded />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <LyricsContent />
        <button
          onClick={() => setExpanded(true)}
          className="absolute right-5 top-5 rounded-full bg-black/25 p-3 backdrop-blur-xl"
        >
          <Expand size={18} />
        </button>
      </div>
    </div>
  )
}
