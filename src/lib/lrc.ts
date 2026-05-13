import type { LyricsLine } from '../types/music'

function parseTimestamp(value: string): number | null {
  const match = value.match(/(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?/)
  if (!match) return null

  const minutes = Number(match[1])
  const seconds = Number(match[2])
  const ms = Number((match[3] ?? '0').padEnd(3, '0'))

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null

  return minutes * 60 + seconds + ms / 1000
}

export function parseLrc(lrc: string): LyricsLine[] {
  if (!lrc.trim()) return []

  return lrc
    .split('\n')
    .flatMap((line) => {
      const timestamps = [...line.matchAll(/\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]/g)]
      const text = line.replace(/\[[^\]]+\]/g, '').trim()

      if (!timestamps.length || !text) return []

      return timestamps
        .map((item) => {
          const time = parseTimestamp(item[1])
          if (time === null) return null
          return { time, text }
        })
        .filter((item): item is LyricsLine => item !== null)
    })
    .sort((a, b) => a.time - b.time)
}

export function getActiveLyricIndex(lines: LyricsLine[], currentTime: number): number {
  if (!lines.length) return -1

  let activeIndex = -1

  for (let index = 0; index < lines.length; index += 1) {
    if (currentTime >= lines[index].time) {
      activeIndex = index
    } else {
      break
    }
  }

  return activeIndex
}
