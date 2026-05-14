import type { YouTubePlaylistSummary } from './youtube.functions'

const fallbackPlaylists: YouTubePlaylistSummary[] = [
  {
    id: 'local-english-hits',
    title: 'Top English Songs',
    thumbnail: '/logo.png',
    channelName: 'Nyxora Music',
  description: 'Local fallback playlist',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'local-ed-sheeran-mix',
    title: 'Ed Sheeran Mix',
    thumbnail: '/logo.png',
    channelName: 'Nyxora Music',
  description: 'Local fallback playlist',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'local-party-hits',
    title: 'Party Hits',
    thumbnail: '/logo.png',
    channelName: 'Nyxora Music',
  description: 'Local fallback playlist',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'local-tamil-hits',
    title: 'Tamil Trending Hits',
    thumbnail: '/logo.png',
    channelName: 'Nyxora Music',
  description: 'Local fallback playlist',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'local-love-songs',
    title: 'Love Songs Mix',
    thumbnail: '/logo.png',
    channelName: 'Nyxora Music',
  description: 'Local fallback playlist',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'local-workout',
    title: 'Workout Energy Mix',
    thumbnail: '/logo.png',
    channelName: 'Nyxora Music',
  description: 'Local fallback playlist',
    publishedAt: new Date().toISOString(),
  },
]

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 tamil love party workout ed sheeran]/gi, ' ').trim()
}

export function getLocalPlaylistFallback(query: string): YouTubePlaylistSummary[] {
  const clean = normalize(query)

  if (!clean) return fallbackPlaylists.slice(0, 4)

  const matched = fallbackPlaylists.filter((playlist) =>
    normalize(playlist.title).includes(clean) ||
    clean.split(/\s+/).some((word) => normalize(playlist.title).includes(word)),
  )

  return (matched.length ? matched : fallbackPlaylists).slice(0, 5)
}
