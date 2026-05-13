import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { SafeImage } from '../common/SafeImage'
import { usePlayerStore } from '../../store/player-store'

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
  } = usePlayerStore()

  if (!currentTrack) {
    return (
      <div className="px-4 pt-8 text-center">
        <SafeImage
          src="/logo.png"
          alt="Nyxora Music"
          className="mx-auto h-48 w-48 rounded-3xl object-cover"
        />
        <h1 className="mt-6 text-2xl font-black">Nothing playing</h1>
        <p className="mt-2 text-sm text-white/55">Search or open a playlist to start listening.</p>
      </div>
    )
  }

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  return (
    <div className="px-4 pt-6">
      <SafeImage
        src={currentTrack.thumbnail}
        alt={currentTrack.title}
        className="mx-auto aspect-square w-full max-w-[320px] rounded-[2rem] object-cover shadow-2xl"
      />

      <div className="mt-7">
        <h1 className="line-clamp-2 text-2xl font-black">{currentTrack.title}</h1>
        <p className="mt-2 truncate text-white/60">{currentTrack.artist}</p>
      </div>

      <div className="mt-6">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={Math.min(currentTime, duration || currentTime)}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
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
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button
          onClick={toggleShuffle}
          className={shuffleMode !== 'off' ? 'text-emerald-400' : 'text-white/60'}
        >
          <Shuffle size={24} />
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

        <button
          onClick={toggleRepeat}
          className={repeatMode !== 'off' ? 'text-emerald-400' : 'text-white/60'}
        >
          <Repeat size={24} />
        </button>
      </div>

      <div className="mt-8 rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-bold">Playback notice</p>
        <p className="mt-1 text-xs text-white/55">
          Background playback may be limited by YouTube or browser restrictions.
        </p>
      </div>
    </div>
  )
}
