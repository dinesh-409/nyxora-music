import { Library } from 'lucide-react'

export function LibraryPage() {
  return (
    <div className="px-4 pt-5">
      <h1 className="text-3xl font-black">Your Library</h1>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        <Library className="mx-auto text-emerald-400" size={42} />
        <h2 className="mt-4 text-lg font-bold">Library sync coming here</h2>
        <p className="mt-2 text-sm text-white/55">
          Liked tracks, saved playlists, Spotify imports and followed artists will appear here.
        </p>
      </div>
    </div>
  )
}
