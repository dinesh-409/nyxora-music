import { CirclePlus, Clock3, Disc3, ListMusic, MinusCircle, Share2, UserRound, X } from 'lucide-react'
import type { Track } from '../../types/music'
import { usePlayerStore } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'

interface SongOptionsMenuProps {
  track: Track | null
  open: boolean
  onClose: () => void
}

export function SongOptionsMenu({ track, open, onClose }: SongOptionsMenuProps) {
  const addTrackToQueue = usePlayerStore((state) => state.addTrackToQueue)
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen)

  if (!open || !track) return null

  async function shareTrack() {
    if (!track) return
    const text = `${track.title} - ${track.artist}`
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
      }
    } catch {
      // cancelled
    } finally {
      onClose()
    }
  }

  function addQueue() {
    if (!track) return

    addTrackToQueue(track)
    window.dispatchEvent(
      new CustomEvent('nyxora-toast', {
        detail: `${track.title} added to queue`,
      }),
    )
    onClose()
  }

  function goQueue() {
    setQueueOpen(true)
    window.dispatchEvent(new CustomEvent('nyxora-open-queue'))
    onClose()
  }

  function placeholder(message: string) {
    window.dispatchEvent(new CustomEvent('nyxora-toast', { detail: message }))
    onClose()
  }

  const items = [
    { icon: Share2, label: 'Share', action: shareTrack },
    { icon: CirclePlus, label: 'Add to playlist', action: () => placeholder('Playlist saving coming next') },
    { icon: ListMusic, label: 'Add to Queue', action: addQueue },
    { icon: ListMusic, label: 'Go to Queue', action: goQueue },
    { icon: Disc3, label: 'Go to album', action: () => placeholder('Album page coming next') },
    { icon: UserRound, label: 'Go to artist', action: () => placeholder('Artist page coming next') },
    { divider: true, icon: MinusCircle, label: 'Exclude track from your taste profile', action: () => placeholder('Excluded from taste profile locally') },
    { icon: Clock3, label: 'Sleep timer', action: () => { window.dispatchEvent(new CustomEvent('nyxora-open-sleep-timer')); onClose() } },
  ]

  return (
    <div className="fixed inset-0 z-[95] bg-black/55 text-white backdrop-blur-sm">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close menu" />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[2rem] border border-white/10 bg-[#181818] p-4 shadow-2xl">
        <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
          <SafeImage
            src={track.thumbnail}
            alt={track.title}
            className="h-14 w-14 rounded-xl object-cover"
            loading="eager"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black">{track.title}</p>
            <p className="truncate text-sm text-white/55">{track.artist}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-1">
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={`${item.label}-${index}`}>
                {item.divider && <div className="my-2 h-px bg-white/10" />}
                <button
                  onClick={item.action}
                  className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left active:bg-white/10"
                >
                  <Icon size={24} className="text-white/65" />
                  <span className="text-[15px] font-semibold">{item.label}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
