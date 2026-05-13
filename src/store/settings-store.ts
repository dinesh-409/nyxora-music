import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  appLanguage: string
  listeningLanguages: string[]
  theme: 'dark' | 'light' | 'system'
  accentColor: string
  reduceMotion: boolean
  autoplay: boolean
  crossfadeEnabled: boolean
  crossfadeSeconds: number
  shuffleMode: 'fewer-repeats' | 'standard-random' | 'no-repeats'
  volumeLevel: 'quiet' | 'low' | 'normal' | 'loud'
  dataSaverMode: 'always-on' | 'automatic' | 'always-off'
  lastSettingsSection: string | null
  settingsSearchQuery: string

  setAppLanguage: (language: string) => void
  setListeningLanguages: (languages: string[]) => void
  setSetting: <K extends keyof Omit<SettingsState, 'setAppLanguage' | 'setListeningLanguages' | 'setSetting'>>(key: K, value: SettingsState[K]) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appLanguage: 'English',
      listeningLanguages: [],
      theme: 'dark',
      accentColor: '#1DB954',
      reduceMotion: false,
      autoplay: true,
      crossfadeEnabled: false,
      crossfadeSeconds: 0,
      shuffleMode: 'standard-random',
      volumeLevel: 'normal',
      dataSaverMode: 'automatic',
      lastSettingsSection: null,
      settingsSearchQuery: '',

      setAppLanguage: (language) => set({ appLanguage: language }),
      setListeningLanguages: (languages) => set({ listeningLanguages: languages }),
      setSetting: (key, value) => set({ [key]: value } as Partial<SettingsState>),
    }),
    {
      name: 'nyxora-settings-store',
    },
  ),
)
