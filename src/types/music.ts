export type RepeatMode = 'off' | 'all' | 'one'
export type ShuffleMode = 'off' | 'standard' | 'fewer-repeats' | 'no-repeats'
export type SeekSource = 'seekbar' | 'lyrics' | 'player-control'

export interface Track {
  id: string
  videoId?: string
  title: string
  artist: string
  album?: string
  source?: 'youtube' | 'spotify-import' | 'generated' | 'local'
  thumbnail?: string | null
  duration?: number
  language?: string
  channelName?: string
  publishedAt?: string
}

export interface PlaylistItem extends Track {
  position?: number
}

export interface GeneratedPlaylist {
  id: string
  playlistKey: string
  title: string
  description?: string
  coverImage?: string | null
  playlistType: string
  language?: string
  mood?: string
  genre?: string
  generatedReason?: string
  songs: PlaylistItem[]
}

export interface LyricsLine {
  time: number
  text: string
}
