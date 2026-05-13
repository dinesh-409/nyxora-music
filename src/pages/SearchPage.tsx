import { Search } from 'lucide-react'
import { usePlayerStore } from '../store/player-store'

export function SearchPage() {
  const searchHistory = usePlayerStore((state) => state.searchHistory)

  return (
    <div className="px-4 pt-5">
      <h1 className="text-3xl font-black">Search</h1>
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
        <Search size={20} className="text-white/50" />
        <input
          placeholder="What do you want to listen to?"
          className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
        />
      </div>

      <section className="mt-7">
        <h2 className="text-lg font-bold">Recent searches</h2>
        {searchHistory.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Your searches will appear here.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {searchHistory.map((item) => (
              <div key={item} className="rounded-xl bg-white/10 px-4 py-3 text-sm">
                {item}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
