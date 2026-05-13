export interface YouTubeSearchItem {
  id: {
    videoId?: string
    playlistId?: string
  }
  snippet: {
    title: string
    description: string
    channelTitle: string
    publishedAt: string
    thumbnails?: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
      standard?: { url: string }
      maxres?: { url: string }
    }
  }
}

export interface YouTubePlaylistItem {
  snippet: {
    title: string
    description: string
    channelTitle: string
    publishedAt: string
    position: number
    resourceId?: {
      videoId?: string
    }
    thumbnails?: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
      standard?: { url: string }
      maxres?: { url: string }
    }
  }
}
