import { Pause, Play, SkipForward } from 'lucide-react'
import { usePlayerStore } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    setPlaying,
    nextTrack,
    setFullPlayerOpen,
  } = usePlayerStore()

  if (!currentTrack) {
    return (
      <div className="fixed bottom-20 left-1/2 z-30 w-[calc(100%-24px)] max-w-md -translate-x-1/2">
        <button
          onClick={() => setFullPlayerOpen(true)}
          className="nyxora-glass flex w-full items-center gap-3 rounded-2xl p-3 text-left"
        >
          <SafeImage
            src="/logo.png"
            alt="Nyxora Music"
            className="h-12 w-12 rounded-xl object-cover"
            loading="eager"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">No song playing</p>
            <p className="truncate text-xs text-white/55">Tap a song to start</p>
          </div>
          <div className="rounded-full bg-white/10 p-2 text-white/60">
            <Play size={18} />
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-30 w-[calc(100%-24px)] max-w-md -translate-x-1/2">
      <button
        onClick={() => setFullPlayerOpen(true)}
        className="nyxora-glass flex w-full items-center gap-3 rounded-2xl p-3 text-left"
      >
        <SafeImage
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="h-12 w-12 rounded-xl object-cover"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{currentTrack.title}</p>
          <p className="truncate text-xs text-white/55">
            {isLoading ? 'Loading...' : currentTrack.artist}
          </p>
        </div>

        <button
          onClick={(event) => {
            event.stopPropagation()
            setPlaying(!isPlaying)
          }}
          className="rounded-full bg-white p-2 text-black"
        >
          {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
        </button>

        <button
          onClick={(event) => {
            event.stopPropagation()
            nextTrack()
          }}
          className="rounded-full bg-white/10 p-2 text-white"
        >
          <SkipForward size={18} />
        </button>
      </button>
    </div>
  )
}
