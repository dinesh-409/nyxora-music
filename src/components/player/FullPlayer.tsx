import { useState } from 'react'
import {
  ChevronDown,
  CirclePlus,
  Clock3,
  Disc3,
  Heart,
  ListMusic,
  MinusCircle,
  MoreVertical,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  UserRound,
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

function formatPlayingFrom(value: string) {
  if (!value) return 'NYXORA MUSIC'

  if (value.toLowerCase().startsWith('search:')) return 'PLAYING FROM SEARCH'
  return 'PLAYING FROM'
}

function formatPlayingFromLine(value: string, currentTitle: string) {
  if (!value) return 'Nyxora Music'

  if (value.toLowerCase().startsWith('search:')) {
    const query = value.replace(/^search:/i, '').trim() || currentTitle
    return `"${query}" in Search`
  }

  return value
}

interface PlayerMenuProps {
  onClose: () => void
}

function PlayerMenu({ onClose }: PlayerMenuProps) {
  const menuItems = [
    { icon: Share2, label: 'Share' },
    { icon: CirclePlus, label: 'Add to playlist' },
    { icon: ListMusic, label: 'Add to Queue' },
    { icon: ListMusic, label: 'Go to Queue' },
    { icon: Disc3, label: 'Go to album' },
    { icon: UserRound, label: 'Go to artist' },
    { divider: true, icon: MinusCircle, label: 'Exclude track from your taste profile' },
    { icon: Clock3, label: 'Sleep timer' },
  ]

  return (
    <>
      <button
        aria-label="Close player menu"
        onClick={onClose}
        className="fixed inset-0 z-[55] cursor-default bg-black/20"
      />

      <div className="absolute right-4 top-16 z-[60] w-[min(315px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-[#171719]/95 p-3 shadow-2xl backdrop-blur-2xl">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon

            return (
              <div key={`${item.label}-${index}`}>
                {item.divider && <div className="my-2 h-px bg-white/10" />}

                <button
                  onClick={onClose}
                  className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left text-white/90 active:bg-white/10"
                >
                  <Icon size={24} className="shrink-0 text-white/65" />
                  <span className="text-[15px] font-semibold leading-tight">{item.label}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function FullPlayer() {
  const [menuOpen, setMenuOpen] = useState(false)

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
      <div className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-[#050507] px-4 pb-8 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#0e5f76_0%,transparent_34%),linear-gradient(180deg,rgba(27,84,94,0.38)_0%,#050507_54%,#050507_100%)]" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <button
              onClick={() => setFullPlayerOpen(false)}
              className="rounded-full p-2 text-white active:bg-white/10"
            >
              <ChevronDown size={31} strokeWidth={2.6} />
            </button>

            <div className="min-w-0 flex-1 px-3 pt-1 text-center">
              <p className="text-[12px] font-bold uppercase tracking-wide text-white/80">
                {formatPlayingFrom(playingFromTitle)}
              </p>
              <p className="mt-1 truncate text-[15px] font-black text-white">
                {formatPlayingFromLine(playingFromTitle, currentTrack.title)}
              </p>
            </div>

            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-full p-2 text-white active:bg-white/10"
              aria-label="Open player menu"
            >
              <MoreVertical size={27} strokeWidth={2.7} />
            </button>
          </div>

          {menuOpen && <PlayerMenu onClose={() => setMenuOpen(false)} />}

          <div className="pt-10">
            <div className="mx-auto aspect-square w-full max-w-[335px] overflow-hidden rounded-2xl bg-white/5 shadow-2xl">
              <SafeImage
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <CurrentLyricsPreview />

          <div className="mt-7 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="line-clamp-2 text-3xl font-black leading-tight">
                {currentTrack.title}
              </h1>
              <p className="mt-1 truncate text-xl font-semibold text-white/55">
                {isLoading ? 'Loading...' : currentTrack.artist}
              </p>
            </div>

            <button className="mt-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white text-white active:scale-95">
              <Heart size={30} />
            </button>
          </div>

          <div className="mt-8">
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
              className="nyxora-player-range w-full"
              style={{
                background: `linear-gradient(to right, #ffffff ${progress}%, rgba(255,255,255,0.35) ${progress}%)`,
              }}
            />

            <div className="mt-2 flex justify-between text-sm font-semibold text-white/55">
              <span>{formatTime(safeCurrentTime)}</span>
              <span>{formatTime(safeDuration)}</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${
                shuffleMode !== 'off' ? 'text-emerald-400' : 'text-white'
              }`}
            >
              <Shuffle size={26} />
            </button>

            <button
              onClick={() => seekRelative(-10)}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-white"
              aria-label="Back 10 seconds"
            >
              <RotateCcw size={29} />
              <span className="absolute text-[10px] font-black">10</span>
            </button>

            <button
              onClick={previousTrack}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white"
            >
              <SkipBack size={34} fill="white" />
            </button>

            <button
              onClick={() => setPlaying(!isPlaying)}
              className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white text-black shadow-xl active:scale-95"
            >
              {isPlaying ? <Pause size={34} fill="black" /> : <Play size={34} fill="black" />}
            </button>

            <button
              onClick={nextTrack}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white"
            >
              <SkipForward size={34} fill="white" />
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-white"
              aria-label="Forward 10 seconds"
            >
              <RotateCw size={29} />
              <span className="absolute text-[10px] font-black">10</span>
            </button>

            <button
              onClick={toggleRepeat}
              className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${
                repeatMode !== 'off' ? 'text-emerald-400' : 'text-white'
              }`}
            >
              <Repeat size={26} />
            </button>
          </div>

          <div className="mt-7 flex items-center justify-between px-2 text-white">
            <button className="flex h-12 w-12 items-center justify-center rounded-full active:bg-white/10">
              <Disc3 size={26} />
            </button>

            <div className="flex items-center gap-6">
              <button className="flex h-12 w-12 items-center justify-center rounded-full active:bg-white/10">
                <Share2 size={26} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full active:bg-white/10">
                <ListMusic size={29} />
              </button>
            </div>
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
    </div>
  )
}
