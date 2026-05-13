import { ChevronDown, ListMusic, Play, Trash2, X } from 'lucide-react'
import { usePlayerStore } from '../../store/player-store'
import { SafeImage } from '../common/SafeImage'

export function QueuePanel() {
  const {
    queue,
    currentIndex,
    currentTrack,
    isQueueOpen,
    setQueueOpen,
    playQueueIndex,
    clearQueue,
    removeQueueItem,
  } = usePlayerStore()

  if (!isQueueOpen) return null

  return (
    <div className="fixed inset-0 z-[85] bg-[#050507] text-white">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <button
            onClick={() => setQueueOpen(false)}
            className="rounded-full bg-white/10 p-2"
          >
            <ChevronDown size={24} />
          </button>

          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Nyxora Music
            </p>
            <h1 className="text-lg font-black">Queue</h1>
          </div>

          <button
            onClick={() => setQueueOpen(false)}
            className="rounded-full bg-white/10 p-2"
          >
            <X size={22} />
          </button>
        </header>

        {currentTrack && (
          <section className="border-b border-white/10 px-4 py-4">
            <p className="mb-3 text-sm font-bold text-emerald-400">Now playing</p>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
              <SafeImage
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="h-14 w-14 rounded-xl object-cover"
                loading="eager"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black">{currentTrack.title}</p>
                <p className="truncate text-sm text-white/55">{currentTrack.artist}</p>
              </div>
              <Play size={20} className="text-emerald-400" fill="currentColor" />
            </div>
          </section>
        )}

        <section className="flex min-h-0 flex-1 flex-col px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-black">Next in queue</p>

            {queue.length > 1 && (
              <button
                onClick={clearQueue}
                className="flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-2 text-xs font-black text-red-100"
              >
                <Trash2 size={14} />
                Clear
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="rounded-full bg-white/10 p-5">
                <ListMusic size={42} />
              </div>
              <h2 className="mt-5 text-xl font-black">Queue is empty</h2>
              <p className="mt-2 text-sm text-white/50">
                Search and play a song to build your queue.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-8">
              {queue.map((track, index) => {
                const active = index === currentIndex

                return (
                  <div
                    key={`${track.id}-${index}`}
                    className={`flex items-center gap-3 rounded-2xl p-2 ${
                      active ? 'bg-emerald-500/15' : 'bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => playQueueIndex(index)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <SafeImage
                        src={track.thumbnail}
                        alt={track.title}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        loading="eager"
                      />

                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-black ${active ? 'text-emerald-400' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <p className="truncate text-xs text-white/55">{track.artist}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => removeQueueItem(index)}
                      className="rounded-full p-2 text-white/45 active:bg-white/10"
                      aria-label="Remove from queue"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
