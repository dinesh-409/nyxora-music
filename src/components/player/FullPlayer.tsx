import { useEffect, useState } from 'react'
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
  X,
} from 'lucide-react'
import { SafeImage } from '../common/SafeImage'
import { usePlayerStore } from '../../store/player-store'
import { LyricsPanel } from './LyricsPanel'
import { CurrentLyricsPreview } from './CurrentLyricsPreview'
import { openQueuePanel } from '../../lib/open-queue'

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
  onShare: () => void
  onAddToQueue: () => void
  onSleepTimer: () => void
  onGoToQueue: () => void
  onAddToPlaylist: () => void
  onGoToArtist: () => void
  onGoToAlbum: () => void
  onExclude: () => void
}

function PlayerMenu({
  onClose,
  onShare,
  onAddToQueue,
  onSleepTimer,
  onGoToQueue,
  onAddToPlaylist,
  onGoToArtist,
  onGoToAlbum,
  onExclude,
}: PlayerMenuProps) {
  const items = [
    { icon: Share2, label: 'Share', action: onShare },
    { icon: CirclePlus, label: 'Add to playlist', action: onAddToPlaylist },
    { icon: ListMusic, label: 'Add to Queue', action: onAddToQueue },
    { icon: ListMusic, label: 'Go to Queue', action: onGoToQueue },
    { icon: Disc3, label: 'Go to album', action: onGoToAlbum },
    { icon: UserRound, label: 'Go to artist', action: onGoToArtist },
    { divider: true, icon: MinusCircle, label: 'Exclude track from your taste profile', action: onExclude },
    { icon: Clock3, label: 'Sleep timer', action: onSleepTimer },
  ]

  return (
    <>
      <button
        aria-label="Close player menu"
        onClick={onClose}
        className="fixed inset-0 z-[55] cursor-default bg-black/25"
      />

      <div className="absolute right-4 top-16 z-[60] w-[min(315px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-[#171719]/95 p-3 shadow-2xl backdrop-blur-2xl">
        <div className="space-y-1">
          {items.map((item, index) => {
            const Icon = item.icon

            return (
              <div key={`${item.label}-${index}`}>
                {item.divider && <div className="my-2 h-px bg-white/10" />}

                <button
                  onClick={item.action}
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
  const [toast, setToast] = useState<string | null>(null)
  const [sleepOpen, setSleepOpen] = useState(false)

  const {
    currentTrack,
    playingFromTitle,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    repeatMode,
    shuffleMode,
    likedTrackIds,
    sleepTimerMinutes,
    setPlaying,
    seekTo,
    nextTrack,
    previousTrack,
    toggleRepeat,
toggleShuffle,
    setFullPlayerOpen,
    toggleLikeCurrentTrack,
    addCurrentTrackToQueue,
    setSleepTimer,
  } = usePlayerStore()

  const liked = currentTrack?.id ? likedTrackIds.includes(currentTrack.id) : false

  useEffect(() => {
    if (!sleepTimerMinutes) return

    const timer = window.setTimeout(() => {
      setPlaying(false)
      setSleepTimer(null)
    }, sleepTimerMinutes * 60 * 1000)

    return () => window.clearTimeout(timer)
  }, [sleepTimerMinutes, setPlaying, setSleepTimer])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1600)
    return () => window.clearTimeout(timer)
  }, [toast])

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
              loading="eager"
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

  const track = currentTrack

  const safeDuration = duration || track.duration || 0
  const safeCurrentTime = Math.min(currentTime, safeDuration || currentTime)
  const progress = safeDuration > 0 ? Math.min(100, (safeCurrentTime / safeDuration) * 100) : 0

  function seekRelative(amount: number) {
    seekTo(Math.max(0, safeCurrentTime + amount), 'player-control')
  }

  async function shareTrack() {
    const track = currentTrack
    if (!track) return

    const text = ` - `
    try {
      if (navigator.share) {
        await navigator.share({
          title: track.title,
          text,
          url: track.videoId ? `https://www.youtube.com/watch?v=${track.videoId}` : location.href,
        })
      } else {
        await navigator.clipboard.writeText(
          track.videoId ? `https://www.youtube.com/watch?v=${track.videoId}` : text,
        )
        setToast('Link copied')
      }
    } catch {
      // user cancelled share
    } finally {
      setMenuOpen(false)
    }
  }

  function addQueue() {
    addCurrentTrackToQueue()
    setToast('Added to queue')
    window.dispatchEvent(new CustomEvent('nyxora-toast', { detail: 'Added to queue' }))
    setMenuOpen(false)
  }

  function openQueue() {
    openQueuePanel()
    openQueuePanel()
    setMenuOpen(false)
  }

  function addToPlaylist() {
    setToast('Playlist saving needs login / playlist system')
    setMenuOpen(false)
  }

  function goToArtist() {
    setToast('Artist page coming next')
    setMenuOpen(false)
  }

  function goToAlbum() {
    setToast('Album page coming next')
    setMenuOpen(false)
  }

  function excludeFromTaste() {
    setToast('Excluded from taste profile locally')
    setMenuOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050507] text-white">
      <div className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-[#050507] px-4 pb-8 pt-4">
        <div className="pointer-events-none absolute inset-0">
          <SafeImage
            src={currentTrack.thumbnail}
            alt=""
            className="h-full w-full scale-125 object-cover opacity-35 blur-3xl"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#071214]/75 to-[#050507]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <button
              onClick={() => setFullPlayerOpen(false)}
              className="rounded-full p-2 text-white active:bg-white/10"
            >
              <ChevronDown size={31} strokeWidth={2.6} />
            </button>

            <div className="min-w-0 flex-1 px-3 pt-1 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-white/75">
                {formatPlayingFrom(playingFromTitle)}
              </p>
              <p className="mt-1 truncate text-[14px] font-black text-white">
                {formatPlayingFromLine(playingFromTitle, track.title)}
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

          {menuOpen && (
            <PlayerMenu
              onClose={() => setMenuOpen(false)}
              onShare={shareTrack}
              onAddToQueue={addQueue}
              onSleepTimer={() => {
                window.dispatchEvent(new CustomEvent('nyxora-open-sleep-timer'))
                setMenuOpen(false)
              }}
              onGoToQueue={openQueue}
              onAddToPlaylist={addToPlaylist}
              onGoToArtist={goToArtist}
              onGoToAlbum={goToAlbum}
              onExclude={excludeFromTaste}
            />
          )}

          {toast && (
            <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-black text-black shadow-xl">
              {toast}
            </div>
          )}

          <div className="pt-8">
            <div className="mx-auto aspect-square w-full max-w-[330px] overflow-hidden rounded-2xl bg-white/5 shadow-2xl">
              <SafeImage
                src={currentTrack.thumbnail}
                alt={track.title}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>

          <CurrentLyricsPreview />

          <div className="mt-7 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="line-clamp-2 text-3xl font-black leading-tight">
                {track.title}
              </h1>
              <p className="mt-1 truncate text-xl font-semibold text-white/55">
                {isLoading ? 'Loading...' : currentTrack.artist}
              </p>
            </div>

            <button
              onClick={toggleLikeCurrentTrack}
              className={`mt-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 active:scale-95 ${
                liked ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-white text-white'
              }`}
            >
              <Heart size={29} fill={liked ? 'black' : 'none'} />
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

          <div className="mt-6 flex items-center justify-between gap-1">
            <button
              onClick={toggleShuffle}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                shuffleMode !== 'off' ? 'text-emerald-400' : 'text-white'
              }`}
            >
              <Shuffle size={24} />
            </button>

            <button
              onClick={() => seekRelative(-10)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
            >
              <RotateCcw size={28} />
              <span className="absolute text-[10px] font-black">10</span>
            </button>

            <button
              onClick={previousTrack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
            >
              <SkipBack size={31} fill="white" />
            </button>

            <button
              onClick={() => setPlaying(!isPlaying)}
              className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full bg-white text-black shadow-xl active:scale-95"
            >
              {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" />}
            </button>

            <button
              onClick={nextTrack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
            >
              <SkipForward size={31} fill="white" />
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
            >
              <RotateCw size={28} />
              <span className="absolute text-[10px] font-black">10</span>
            </button>

            <button
              onClick={toggleRepeat}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                repeatMode !== 'off' ? 'text-emerald-400' : 'text-white'
              }`}
            >
              <Repeat size={24} />
            </button>
          </div>

          <div className="mt-7 flex items-center justify-between px-2 text-white">
            <button className="flex h-12 w-12 items-center justify-center rounded-full active:bg-white/10">
              <Disc3 size={26} />
            </button>

            <div className="flex items-center gap-6">
              <button
                onClick={shareTrack}
                className="flex h-12 w-12 items-center justify-center rounded-full active:bg-white/10"
              >
                <Share2 size={26} />
              </button>
              <button
                onClick={openQueuePanel}
                className="flex h-12 w-12 items-center justify-center rounded-full active:bg-white/10"
              >
                <ListMusic size={29} />
              </button>
            </div>
          </div>

          {sleepOpen && (
            <div className="mt-5 rounded-3xl bg-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="font-black">Sleep timer</p>
                <button onClick={() => setSleepOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setSleepTimer(mins)
                      setSleepOpen(false)
                      setToast(`Sleep timer ${mins} min`)
                    }}
                    className="rounded-2xl bg-white/10 py-3 text-sm font-black"
                  >
                    {mins}m
                  </button>
                ))}
              </div>
              {sleepTimerMinutes && (
                <button
                  onClick={() => {
                    setSleepTimer(null)
                    setToast('Sleep timer off')
                  }}
                  className="mt-3 w-full rounded-2xl bg-red-500/20 py-3 text-sm font-black text-red-100"
                >
                  Turn off timer
                </button>
              )}
            </div>
          )}

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
