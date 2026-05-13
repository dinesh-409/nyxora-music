import { Settings } from 'lucide-react'
import { useSettingsStore } from '../store/settings-store'

export function SettingsPage() {
  const appLanguage = useSettingsStore((state) => state.appLanguage)
  const theme = useSettingsStore((state) => state.theme)

  return (
    <div className="px-4 pt-5">
      <h1 className="text-3xl font-black">Settings</h1>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
        <Settings size={20} className="text-white/50" />
        <input
          placeholder="Search settings"
          className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
        />
      </div>

      <div className="mt-6 space-y-3">
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-sm text-white/50">App language</p>
          <p className="font-bold">{appLanguage}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-sm text-white/50">Theme</p>
          <p className="font-bold capitalize">{theme}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="font-bold">YouTube Playback Notice</p>
          <p className="mt-1 text-sm text-white/55">
            Background playback may be limited by YouTube or browser restrictions.
          </p>
        </div>
      </div>
    </div>
  )
}
