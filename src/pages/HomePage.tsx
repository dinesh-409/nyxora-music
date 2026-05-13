import { motion } from 'framer-motion'
import { Music2, Play, Sparkles } from 'lucide-react'
import { usePlayerStore } from '../store/player-store'
import type { Track } from '../types/music'

const demoTracks: Track[] = [
  {
    id: 'demo-1',
    title: 'Nyxora Guest Pick',
    artist: 'Nyxora Music',
    thumbnail: '/logo.png',
    source: 'generated',
    language: 'Tamil',
  },
  {
    id: 'demo-2',
    title: 'Tamil Mix Starter',
    artist: 'Dynamic Feed',
    thumbnail: '/logo.png',
    source: 'generated',
    language: 'Tamil',
  },
  {
    id: 'demo-3',
    title: 'Night Vibes',
    artist: 'Made For You',
    thumbnail: '/logo.png',
    source: 'generated',
    language: 'English',
  },
]

const recentCards = ['Tamil Mix', 'Anirudh Hits', 'A.R. Rahman', 'Night Vibes']

const rails = [
  {
    title: 'Picked For You',
    items: ['Daily Mix 1', 'Tamil Love Hits', 'Coding Mix', 'New Releases'],
  },
  {
    title: 'Made For You',
    items: ['Your 2026 Mix', 'On Repeat', 'Malayalam Mix', 'Chill Mix'],
  },
  {
    title: 'Language Picks',
    items: ['Tamil Songs', 'Hindi Hits', 'English Pop', 'Telugu Melody'],
  },
]

export function HomePage() {
  const setQueue = usePlayerStore((state) => state.setQueue)
  const setPlaying = usePlayerStore((state) => state.setPlaying)

  const playGuestPicks = () => {
    setQueue(demoTracks, 0, 'Guest Picks')
    setPlaying(true)
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#050507]/80 px-4 py-4 backdrop-blur-xl">
        <div>
          <p className="text-xs font-medium text-emerald-400">Welcome to</p>
          <h1 className="text-2xl font-black tracking-tight">Nyxora Music</h1>
        </div>
      </header>

      <div className="px-4 pt-5">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="nyxora-glass rounded-3xl p-5 shadow-2xl"
        >
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-violet-500">
              <Music2 size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Start listening</h2>
              <p className="text-sm text-white/60">
                YouTube playback, lyrics, playlists and more will connect here.
              </p>
            </div>
          </div>

          <button
            onClick={playGuestPicks}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 font-bold text-black"
          >
            <Play size={18} fill="black" />
            Play Guest Picks
          </button>
        </motion.section>

        <section className="mt-6">
          <h3 className="mb-3 text-lg font-bold">Recently Played</h3>
          <div className="grid grid-cols-2 gap-3">
            {recentCards.map((item) => (
              <button
                key={item}
                className="flex items-center gap-3 rounded-2xl bg-white/10 p-2 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Music2 size={20} />
                </div>
                <span className="line-clamp-2 text-sm font-semibold">{item}</span>
              </button>
            ))}
          </div>
        </section>

        {rails.map((rail) => (
          <section key={rail.title} className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{rail.title}</h3>
              <Sparkles size={18} className="text-emerald-400" />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {rail.items.map((item) => (
                <button key={item} className="w-36 shrink-0 text-left">
                  <div className="mb-2 flex aspect-square items-center justify-center rounded-3xl bg-gradient-to-br from-white/15 to-white/5 shadow-xl">
                    <Music2 size={34} className="text-white/80" />
                  </div>
                  <p className="line-clamp-2 text-sm font-bold">{item}</p>
                  <p className="mt-1 text-xs text-white/50">Made for you</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
