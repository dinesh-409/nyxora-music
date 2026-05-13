import type { Track } from '../types/music'

export function getTrackRenderKey(track?: Track | null, loadKey?: number) {
  if (!track) return 'empty-track'
  return [
    track.id || 'id',
    track.videoId || 'video',
    track.title || 'title',
    track.thumbnail || 'thumb',
    loadKey ?? 0,
  ].join('-')
}

export function getFreshImageUrl(url?: string, key?: string | number) {
  if (!url) return ''
  if (url.startsWith('data:')) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}nyxora=${encodeURIComponent(String(key ?? Date.now()))}`
}
