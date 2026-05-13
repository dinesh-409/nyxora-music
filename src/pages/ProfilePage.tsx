import { User } from 'lucide-react'

export function ProfilePage() {
  return (
    <div className="px-4 pt-5">
      <h1 className="text-3xl font-black">Profile</h1>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
          <User size={42} />
        </div>
        <h2 className="mt-4 text-xl font-bold">Guest Listener</h2>
        <p className="mt-2 text-sm text-white/55">
          Login later to save likes, follows, playlists and Spotify imports.
        </p>
      </div>
    </div>
  )
}
