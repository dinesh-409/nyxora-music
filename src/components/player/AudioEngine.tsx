import { useEffect, useRef } from 'react'
import YouTube, { type YouTubeEvent, type YouTubePlayer } from 'react-youtube'
import { usePlayerStore } from '../../store/player-store'

export function AudioEngine() {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const progressTimerRef = useRef<number | null>(null)

  const {
    currentTrack,
    isPlaying,
    setPlaying,
    setLoading,
    setCurrentTime,
    setDuration,
    nextTrack,
    repeatMode,
    incrementPlayCount,
    seekRequest,
  } = usePlayerStore()

  const videoId = currentTrack?.videoId

  useEffect(() => {
    const player = playerRef.current
    if (!player || !videoId) return

    try {
      if (isPlaying) {
        player.playVideo?.()
      } else {
        player.pauseVideo?.()
      }
    } catch (error) {
      console.warn('YouTube play/pause failed safely:', error)
    }
  }, [isPlaying, videoId])


  useEffect(() => {
    const player = playerRef.current
    if (!player || seekRequest === null || seekRequest === undefined) return

    try {
      player.seekTo?.(seekRequest, true)
      setCurrentTime(seekRequest, 'seekbar')
    } catch (error) {
      console.warn('YouTube seek failed safely:', error)
    }
  }, [seekRequest, setCurrentTime])

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current)
      }
    }
  }, [])

  function startProgressTimer() {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current)
    }

    progressTimerRef.current = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return

      try {
        const time = player.getCurrentTime?.()
        const duration = player.getDuration?.()

        if (typeof time === 'number' && Number.isFinite(time)) {
          setCurrentTime(time, 'player-control')
        }

        if (typeof duration === 'number' && Number.isFinite(duration)) {
          setDuration(duration)
        }
      } catch {
        // Keep player safe
      }
    }, 700)
  }

  function stopProgressTimer() {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }

  function handleReady(event: YouTubeEvent) {
    playerRef.current = event.target
    setLoading(false)

    try {
      const duration = event.target.getDuration?.()
      if (typeof duration === 'number' && Number.isFinite(duration)) {
        setDuration(duration)
      }

      if (isPlaying) {
        event.target.playVideo?.()
      }
    } catch (error) {
      console.warn('YouTube ready handling failed safely:', error)
    }
  }

  function handleStateChange(event: YouTubeEvent<number>) {
    const state = event.data

    // YouTube states:
    // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
    if (state === 1) {
      setLoading(false)
      setPlaying(true)
      startProgressTimer()

      if (currentTrack?.id) {
        incrementPlayCount(currentTrack.id)
      }
    }

    if (state === 2) {
      setPlaying(false)
      stopProgressTimer()
    }

    if (state === 3) {
      setLoading(true)
    }

    if (state === 0) {
      stopProgressTimer()

      if (repeatMode === 'one') {
        try {
          event.target.seekTo?.(0, true)
          event.target.playVideo?.()
        } catch {
          nextTrack()
        }
        return
      }

      nextTrack()
    }
  }

  function handleError() {
    console.warn('YouTube player error. Skipping safely.')
    setLoading(false)
    nextTrack()
  }

  if (!videoId) return null

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 h-0 w-0 overflow-hidden opacity-0">
      <YouTube
        key={videoId}
        videoId={videoId}
        opts={{
          width: '1',
          height: '1',
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
        }}
        onReady={handleReady}
        onStateChange={handleStateChange}
        onError={handleError}
      />
    </div>
  )
}
