import { Home, Library, Search, Settings, User } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="safe-bottom fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-white/10 bg-[#07070a]/95 px-3 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1 text-[11px] font-semibold">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center gap-1 rounded-2xl px-2 py-1 ${
                active ? 'text-emerald-400' : 'text-white/55'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 rounded-2xl bg-emerald-400/10"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={21} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
