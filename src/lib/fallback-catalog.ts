import type { Track } from '../types/music'

export const FALLBACK_TRACKS: Track[] = [
  {
    id: 'JGwWNGJdvx8',
    videoId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    channelName: 'Ed Sheeran',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    publishedAt: '2017-01-30T00:00:00Z',
    duration: 233,
    source: 'youtube',
  },
  {
    id: 'fHI8X4OXluQ',
    videoId: 'fHI8X4OXluQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    channelName: 'The Weeknd',
    thumbnail: 'https://i.ytimg.com/vi/fHI8X4OXluQ/hqdefault.jpg',
    publishedAt: '2020-01-21T00:00:00Z',
    duration: 263,
    source: 'youtube',
  },
  {
    id: 'eVli-tstM5E',
    videoId: 'eVli-tstM5E',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    channelName: 'Sabrina Carpenter',
    thumbnail: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg',
    publishedAt: '2024-04-12T00:00:00Z',
    duration: 175,
    source: 'youtube',
  },
  {
    id: '2Vv-BfVoq4g',
    videoId: '2Vv-BfVoq4g',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    channelName: 'Ed Sheeran',
    thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
    publishedAt: '2017-11-09T00:00:00Z',
    duration: 263,
    source: 'youtube',
  },
  {
    id: '7wtfhZwyrcc',
    videoId: '7wtfhZwyrcc',
    title: 'Believer',
    artist: 'Imagine Dragons',
    channelName: 'Imagine Dragons',
    thumbnail: 'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg',
    publishedAt: '2017-03-07T00:00:00Z',
    duration: 204,
    source: 'youtube',
  },
  {
    id: 'pAgnJDJN4VA',
    videoId: 'pAgnJDJN4VA',
    title: 'Back In Black',
    artist: 'AC/DC',
    channelName: 'AC/DC',
    thumbnail: 'https://i.ytimg.com/vi/pAgnJDJN4VA/hqdefault.jpg',
    publishedAt: '2009-11-07T00:00:00Z',
    duration: 255,
    source: 'youtube',
  },
  {
    id: 'hTWKbfoikeg',
    videoId: 'hTWKbfoikeg',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    channelName: 'Nirvana',
    thumbnail: 'https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg',
    publishedAt: '2009-06-16T00:00:00Z',
    duration: 278,
    source: 'youtube',
  },
  {
    id: 'kJQP7kiw5Fk',
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi',
    channelName: 'Luis Fonsi',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    publishedAt: '2017-01-12T00:00:00Z',
    duration: 282,
    source: 'youtube',
  },
]

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchFallbackCatalog(query: string): Track[] {
  const clean = normalize(query)

  if (!clean) return FALLBACK_TRACKS.slice(0, 8)

  const words = clean.split(' ').filter(Boolean)

  return FALLBACK_TRACKS
    .map((track) => {
      const title = normalize(track.title)
      const artist = normalize(track.artist)
      const joined = `${title} ${artist}`

      let score = 0

      if (title === clean) score += 100
      if (joined.includes(clean)) score += 70
      if (title.includes(clean)) score += 60
      if (artist.includes(clean)) score += 40

      for (const word of words) {
        if (title.includes(word)) score += 15
        if (artist.includes(word)) score += 10
      }

      return { track, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.track)
}
