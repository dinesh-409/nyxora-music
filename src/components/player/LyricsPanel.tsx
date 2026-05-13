import { useEffect, useMemo, useState } from 'react'
import { Expand, Minus, Plus, RotateCcw, Share2, X } from 'lucide-react'
import { getActiveLyricIndex } from '../../lib/lrc'
import { useLyricsStore } from '../../store/lyrics-store'
import { usePlayerStore } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'

function LyricsDynamicBackground() {
  const currentTrack = usePlayerStore((state) => state.currentTrack)

  return (
    <div className="pointer-events-none absolute inset-0">
      <SafeImage
        src={currentTrack?.thumbnail}
        alt=""
        className="h-full w-full scale-125 object-cover opacity-60 blur-3xl"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/45 to-black/85" />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}

function LyricsOffsetControls() {
  const lyricsOffset = usePlayerStore((state) => state.lyricsOffset)
  const adjustLyricsOffset = usePlayerStore((state) => state.adjustLyricsOffset)
  const resetLyricsOffset = usePlayerStore((state) => state.resetLyricsOffset)

  return (
    <div className="flex items-center gap-2 text-xs font-black text-white/75">
      <button
        onClick={() => adjustLyricsOffset(-0.25)}
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
          : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(2)}s`}
      </button>

      <button
        onClick={() => adjustLyricsOffset(0.25)}
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
  )
}

function FiveLineLyrics({ expanded = false }: { expanded?: boolean }) {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const lyricsOffset = usePlayerStore((state) => state.lyricsOffset)
  const seekTo = usePlayerStore((state) => state.seekTo)

  const { lyrics, loading, loadLyrics } = useLyricsStore()

  useEffect(() => {
    loadLyrics(currentTrack)
  }, [currentTrack?.id, loadLyrics])

  const adjustedTime = currentTime + lyricsOffset

  const activeIndex = useMemo(() => {
    if (!lyrics?.lines?.length) return -1
    return getActiveLyricIndex(lyrics.lines, adjustedTime)
  }, [lyrics, adjustedTime])

  const fiveLines = useMemo(() => {
    if (!lyrics?.lines?.length || activeIndex < 0) return []

    const result = []

    for (let i = activeIndex - 2; i <= activeIndex + 2; i += 1) {
      result.push({
        line: lyrics.lines[i] ?? null,
        index: i,
        relative: i - activeIndex,
      })
    }

    return result
  }, [lyrics, activeIndex])

  if (!currentTrack) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-white/10 p-5">
        <LyricsDynamicBackground />
        <div className="relative z-10">
          <p className="text-2xl font-black">Lyrics</p>
          <p className="mt-4 text-base text-white/60">Play a song to view lyrics.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-white/10 p-5">
        <LyricsDynamicBackground />
        <div className="relative z-10">
          <p className="text-2xl font-black">Lyrics</p>
          <div className="mt-8 space-y-5">
            <div className="mx-auto h-6 w-3/4 animate-pulse rounded-full bg-white/15" />
            <div className="mx-auto h-7 w-4/5 animate-pulse rounded-full bg-white/15" />
            <div className="mx-auto h-10 w-full animate-pulse rounded-full bg-white/25" />
            <div className="mx-auto h-7 w-4/5 animate-pulse rounded-full bg-white/15" />
            <div className="mx-auto h-6 w-3/4 animate-pulse rounded-full bg-white/15" />
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
            New songs may get synced lyrics later from LRCLIB.
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
          <p className="text-2xl font-black">Lyrics</p>
          <div className={`${expanded ? 'max-h-[76vh]' : 'max-h-[360px]'} mt-6 overflow-y-auto whitespace-pre-line pr-1 text-2xl font-black leading-snug text-white`}>
            {lyrics.plainLyrics}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-[2rem] bg-white/10 p-5 shadow-2xl ${expanded ? 'min-h-[78vh]' : ''}`}>
      <LyricsDynamicBackground />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-white">Lyrics</p>
            <p className="mt-1 text-xs font-bold text-white/45">
              Center line is synced
            </p>
          </div>

          {!expanded && (
            <div className="flex items-center gap-2">
              <button className="rounded-full bg-black/25 p-3 backdrop-blur-xl">
                <Share2 size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <LyricsOffsetControls />
        </div>

        <div
          className={`${expanded ? 'mt-16 min-h-[55vh]' : 'mt-10 min-h-[330px]'} flex flex-col items-center justify-center gap-6 text-center`}
        >
          {fiveLines.map(({ line, index, relative }) => {
            if (!line) {
              return <div key={`empty-${index}`} className="min-h-8" />
            }

            const isActive = relative === 0
            const isNear = Math.abs(relative) === 1

            return (
              <button
                key={`${line.time}-${index}`}
                onClick={() => seekTo(Math.max(0, line.time - lyricsOffset), 'lyrics')}
                className={`w-full transition-all duration-300 ${
                  isActive
                    ? 'scale-100 opacity-100'
                    : isNear
                      ? 'scale-95 opacity-75'
                      : 'scale-90 opacity-42'
                }`}
              >
                <p
                  className={`mx-auto max-w-[95%] ${
                    isActive
                      ? expanded
                        ? 'text-4xl font-black leading-tight text-white drop-shadow-xl'
                        : 'text-3xl font-black leading-tight text-white drop-shadow-xl'
                      : isNear
                        ? expanded
                          ? 'text-3xl font-black leading-tight text-cyan-100'
                          : 'text-2xl font-black leading-tight text-cyan-100'
                        : expanded
                          ? 'text-2xl font-black leading-tight text-white/45'
                          : 'text-xl font-black leading-tight text-white/40'
                  }`}
                >
                  {line.text}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function LyricsPanel() {
  const [expanded, setExpanded] = useState(false)

  if (expanded) {
    return (
      <div className="fixed inset-0 z-[80] overflow-hidden bg-[#050507] p-4 text-white">
        <div className="relative mx-auto flex h-full w-full max-w-md flex-col">
          <LyricsDynamicBackground />

          <div className="relative z-10 mb-4 flex items-center justify-between">
            <p className="text-xl font-black">Full Lyrics</p>
            <button
              onClick={() => setExpanded(false)}
              className="rounded-full bg-white/10 p-3"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative z-10 flex-1">
            <FiveLineLyrics expanded />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <FiveLineLyrics />
      <button
        onClick={() => setExpanded(true)}
        className="absolute right-5 top-5 z-20 rounded-full bg-black/25 p-3 backdrop-blur-xl"
      >
        <Expand size={18} />
      </button>
    </div>
  )
}
