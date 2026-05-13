import {
  ChevronDown,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
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

  const safeDuration = duration || 0
  const safeCurrentTime = Math.min(currentTime, safeDuration || currentTime)
  const progress = safeDuration > 0 ? Math.min(100, (safeCurrentTime / safeDuration) * 100) : 0

  function seekRelative(amount: number) {
    seekTo(Math.max(0, safeCurrentTime + amount), 'player-control')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050507] text-white">
      <div className="nyxora-gradient mx-auto min-h-screen w-full max-w-md px-4 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setFullPlayerOpen(false)}
            className="rounded-full bg-white/10 p-2"
          >
            <ChevronDown size={24} />
          </button>

          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Playing from
            </p>
            <p className="text-sm font-bold">Nyxora Music</p>
          </div>

          <div className="h-10 w-10" />
        </div>

        <div className="pt-8">
          <SafeImage
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="mx-auto aspect-square w-full max-w-[320px] rounded-[2rem] object-cover shadow-2xl"
          />
        </div>

        <CurrentLyricsPreview />

        <div className="mt-7">
          <h1 className="line-clamp-2 text-2xl font-black">{currentTrack.title}</h1>
          <p className="mt-2 truncate text-white/60">
            {isLoading ? 'Loading...' : currentTrack.artist}
          </p>
        </div>

        <div className="mt-6">
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

        <div className="mt-7 flex items-center justify-between">
          <button
            onClick={toggleShuffle}
            className={shuffleMode !== 'off' ? 'text-emerald-400' : 'text-white/60'}
          >
            <Shuffle size={24} />
          </button>

          <button onClick={() => seekRelative(-10)} className="rounded-full bg-white/10 p-3">
            <RotateCcw size={22} />
          </button>

          <button onClick={previousTrack} className="rounded-full bg-white/10 p-3">
            <SkipBack size={24} />
          </button>

          <button
            onClick={() => setPlaying(!isPlaying)}
            className="rounded-full bg-white p-5 text-black"
          >
            {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" />}
          </button>

          <button onClick={nextTrack} className="rounded-full bg-white/10 p-3">
            <SkipForward size={24} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-8">
          <button onClick={() => seekRelative(10)} className="rounded-full bg-white/10 p-3">
            <RotateCw size={22} />
          </button>

          <button
            onClick={toggleRepeat}
            className={`rounded-full bg-white/10 p-3 ${
              repeatMode !== 'off' ? 'text-emerald-400' : 'text-white/60'
            }`}
          >
            <Repeat size={22} />
          </button>
        </div>

        <div className="mt-8">
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
