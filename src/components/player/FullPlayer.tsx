import {
  ChevronDown,
  Heart,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { SafeImage } from '../common/SafeImage'
import { usePlayerStore } from '../../store/player-store'
import { LyricsPanel } from './LyricsPanel'
import { CurrentLyricsPreview } from './CurrentLyricsPreview'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function FullPlayer() {
  const {
    currentTrack,
    playingFromTitle,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    repeatMode,
    shuffleMode,
    setPlaying,
    seekTo,
    nextTrack,
    previousTrack,
    toggleRepeat,
    toggleShuffle,
    setFullPlayerOpen,
  } = usePlayerStore()

  if (!currentTrack) {
    return (
      <div className="fixed inset-0 z-50 bg-[#050507] text-white">
        <div className="mx-auto min-h-screen w-full max-w-md px-4 pt-5">
          <button
            onClick={() => setFullPlayerOpen(false)}
            className="rounded-full bg-white/10 p-2"
          >
            <ChevronDown size={24} />
          </button>

          <div className="pt-16 text-center">
            <SafeImage
              src="/logo.png"
              alt="Nyxora Music"
              className="mx-auto h-48 w-48 rounded-3xl object-cover"
            />
            <h1 className="mt-6 text-2xl font-black">Nothing playing</h1>
            <p className="mt-2 text-sm text-white/55">
              Search or open a playlist to start listening.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const safeDuration = duration || currentTrack.duration || 0
  const safeCurrentTime = Math.min(currentTime, safeDuration || currentTime)
  const progress = safeDuration > 0 ? Math.min(100, (safeCurrentTime / safeDuration) * 100) : 0

  function seekRelative(amount: number) {
    seekTo(Math.max(0, safeCurrentTime + amount), 'player-control')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050507] text-white">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#050507] px-4 pb-8 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setFullPlayerOpen(false)}
            className="rounded-full bg-white/10 p-2"
          >
            <ChevronDown size={23} />
          </button>

          <div className="min-w-0 flex-1 px-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
              Playing from
            </p>
            <p className="truncate text-xs font-bold text-white/85">
              {playingFromTitle || 'Nyxora Music'}
            </p>
          </div>

          <button className="rounded-full bg-white/10 p-2">
            <MoreHorizontal size={23} />
          </button>
        </div>

        <div className="pt-7">
          <div className="mx-auto aspect-square w-full max-w-[310px] overflow-hidden rounded-[1.8rem] bg-white/5 shadow-2xl">
            <SafeImage
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <CurrentLyricsPreview />

        <div className="mt-6 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="line-clamp-2 text-xl font-black leading-snug">
              {currentTrack.title}
            </h1>
            <p className="mt-2 truncate text-sm text-white/60">
              {isLoading ? 'Loading...' : currentTrack.artist}
            </p>
          </div>

          <button className="rounded-full bg-white/10 p-3 text-white/75">
            <Heart size={21} />
          </button>
        </div>

        <div className="mt-5">
          <input
            type="range"
            min={0}
            max={safeDuration || 0}
            value={safeCurrentTime}
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              event.stopPropagation()
              seekTo(Number(event.target.value), 'seekbar')
            }}
            className="w-full accent-emerald-500"
            style={{
              background: `linear-gradient(to right, #1DB954 ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
            }}
          />

          <div className="mt-1 flex justify-between text-xs text-white/50">
            <span>{formatTime(safeCurrentTime)}</span>
            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-5 items-center gap-3">
          <button
            onClick={toggleShuffle}
            className={`mx-auto rounded-full p-3 ${
              shuffleMode !== 'off' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-white/70'
            }`}
          >
            <Shuffle size={20} />
          </button>

          <button onClick={previousTrack} className="mx-auto rounded-full bg-white/10 p-3">
            <SkipBack size={22} />
          </button>

          <button
            onClick={() => setPlaying(!isPlaying)}
            className="mx-auto rounded-full bg-white p-5 text-black shadow-xl"
          >
            {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" />}
          </button>

          <button onClick={nextTrack} className="mx-auto rounded-full bg-white/10 p-3">
            <SkipForward size={22} />
          </button>

          <button
            onClick={toggleRepeat}
            className={`mx-auto rounded-full p-3 ${
              repeatMode !== 'off' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-white/70'
            }`}
          >
            <Repeat size={20} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <button
            onClick={() => seekRelative(-10)}
            className="rounded-2xl bg-white/10 py-3 text-sm font-bold"
          >
            -10s
          </button>

          <button
            onClick={() => seekRelative(10)}
            className="rounded-2xl bg-white/10 py-3 text-sm font-bold"
          >
            +10s
          </button>

          <button className="flex items-center justify-center rounded-2xl bg-white/10 py-3">
            <Settings size={18} />
          </button>

          <button className="flex items-center justify-center rounded-2xl bg-white/10 py-3">
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="mt-7">
          <LyricsPanel />
        </div>

        <div className="mt-4 rounded-3xl bg-white/5 p-4">
          <p className="text-sm font-bold">Playback notice</p>
          <p className="mt-1 text-xs text-white/55">
            Background playback may be limited by YouTube or browser restrictions.
          </p>
        </div>
      </div>
    </div>
  )
}
