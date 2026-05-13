import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MobileShell } from './components/layout/MobileShell'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'
import { LibraryPage } from './pages/LibraryPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { AudioEngine } from './components/player/AudioEngine'

const pageMap = {
  home: <HomePage />,
  search: <SearchPage />,
  library: <LibraryPage />,
  profile: <ProfilePage />,
  settings: <SettingsPage />,
}

function App() {
  const [activeTab, setActiveTab] = useState<keyof typeof pageMap>('home')

  return (
    <MobileShell activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as keyof typeof pageMap)}>
      <AudioEngine />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {pageMap[activeTab]}
        </motion.div>
      </AnimatePresence>
    </MobileShell>
  )
}

export default App
