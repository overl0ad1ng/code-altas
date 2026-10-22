"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"

export interface VideoState {
  playing: boolean
  time: number
  duration: number
  volume: number
  muted: boolean
  rate: number
  error: string | null
}

/** Native media events are the source of truth, including playback started outside the toolbar. */
export function useVideoPlayer(initialMuted = false) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<VideoState>({
    playing: false,
    time: 0,
    duration: 0,
    volume: 1,
    muted: initialMuted,
    rate: 1,
    error: null,
  })
  const [buffering, setBuffering] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [fullscreenSupported, setFullscreenSupported] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function sync() {
      setState({
        playing: !video!.paused && !video!.ended,
        time: video!.currentTime,
        duration: Number.isFinite(video!.duration) ? video!.duration : 0,
        volume: video!.volume,
        muted: video!.muted,
        rate: video!.playbackRate,
        error: video!.error
          ? "Unable to load this video. Check the source, network access, and video format."
          : null,
      })
    }

    function waiting() {
      setBuffering(!video!.paused)
    }

    function ready() {
      setBuffering(false)
    }

    function updateFullscreen() {
      setFullscreen(document.fullscreenElement === containerRef.current)
    }

    const events = [
      "loadedmetadata",
      "durationchange",
      "timeupdate",
      "play",
      "pause",
      "ended",
      "volumechange",
      "ratechange",
      "error",
      "emptied",
    ]

    for (const event of events) {
      video.addEventListener(event, sync)
    }

    for (const event of ["waiting", "seeking"]) {
       video.addEventListener(event, waiting)
    }

    for (const event of ["playing", "canplay", "pause", "ended", "error"]) {
       video.addEventListener(event, ready)
    }

    document.addEventListener("fullscreenchange", updateFullscreen)

    setFullscreenSupported(
      Boolean(
        document.fullscreenEnabled && containerRef.current?.requestFullscreen
      )
    )

    sync()
    return () => {
      for (const event of events) {
        video.removeEventListener(event, sync)
      }

      for (const event of ["waiting", "seeking"]) {
        video.removeEventListener(event, waiting)
      }

      for (const event of ["playing", "canplay", "pause", "ended", "error"]) {
        video.removeEventListener(event, ready)
      }

      document.removeEventListener("fullscreenchange", updateFullscreen)
      video.pause()
    }
  }, [])

  async function togglePlayback() {
    const video = videoRef.current
    if (!video) return

    setNotice(null)

    if (!video.paused) {
      video.pause()
      return
    }

    try {
      await video.play()
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      if (videoRef.current === video && video.isConnected) {
        setNotice("Playback could not start. Try again.")
      }
    }
  }

  function seek(time: number) {
    const video = videoRef.current

    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return
    }

    video.currentTime = Math.min(video.duration, Math.max(0, time))
  }

  function changeVolume(volume: number) {
    const video = videoRef.current

    if (!video) {
      return
    }

    video.volume = Math.min(1, Math.max(0, volume))

    if (volume > 0) {
      video.muted = false
    }
  }

  function toggleMute() {
    const video = videoRef.current

    if (!video) return

    if (video.muted || video.volume === 0) {
      video.muted = false

      if (video.volume === 0) {
        video.volume = 0.5
      }

    } else {
      video.muted = true
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen()
      } else {
        await containerRef.current?.requestFullscreen()
      }
    } catch {
      setNotice("Fullscreen could not open. You can continue watching here.")
    }
  }

  function changeRate(rate: number) {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      (event.target as HTMLElement).closest(
        "button, input, [role=combobox], [role=listbox], [role=slider]"
      )
    ) {
      return
    }

    const video = videoRef.current

    if (!video) return

    switch (event.key.toLowerCase()) {
      case " ":
      case "k":
        void togglePlayback()
        break
      case "arrowleft":
        seek(video.currentTime - 5)
        break
      case "arrowright":
        seek(video.currentTime + 5)
        break
      case "arrowup":
        changeVolume(video.volume + 0.05)
        break
      case "arrowdown":
        changeVolume(video.volume - 0.05)
        break
      case "m":
        toggleMute()
        break
      case "f":
        if (fullscreenSupported) void toggleFullscreen()
        break
      default:
        return
    }

    event.preventDefault()
  }

  return {
    videoRef,
    containerRef,
    state,
    buffering,
    notice,
    fullscreen,
    fullscreenSupported,
    togglePlayback,
    seek,
    changeVolume,
    toggleMute,
    toggleFullscreen,
    changeRate,
    onKeyDown,
  }
}

export function formatVideoTime(seconds: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor(total / 60) % 60
  const remainder = String(total % 60).padStart(2, "0")

  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}`
    : `${minutes}:${remainder}`
}
