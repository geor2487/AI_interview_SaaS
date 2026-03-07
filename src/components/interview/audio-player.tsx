'use client'

import { useRef, useEffect, useState } from 'react'

interface AudioPlayerProps {
  audioBase64: string
  onPlaybackComplete: () => void
  autoPlay?: boolean
}

export function AudioPlayer({
  audioBase64,
  onPlaybackComplete,
  autoPlay = true,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!audioBase64) return

    const byteCharacters = atob(audioBase64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'audio/mp3' })
    const url = URL.createObjectURL(blob)

    const audio = new Audio(url)
    audioRef.current = audio

    audio.onplay = () => setIsPlaying(true)
    audio.onended = () => {
      setIsPlaying(false)
      onPlaybackComplete()
      URL.revokeObjectURL(url)
    }
    audio.onerror = () => {
      setIsPlaying(false)
      onPlaybackComplete()
      URL.revokeObjectURL(url)
    }

    if (autoPlay) {
      audio.play().catch((err) => {
        console.error('Audio playback failed:', err)
        onPlaybackComplete()
      })
    }

    return () => {
      audio.pause()
      URL.revokeObjectURL(url)
    }
  }, [audioBase64, autoPlay, onPlaybackComplete])

  return (
    <div className="flex items-center gap-2">
      {isPlaying && (
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <span className="inline-block w-1 h-3 bg-blue-500 animate-pulse" />
            <span className="inline-block w-1 h-4 bg-blue-500 animate-pulse delay-75" />
            <span className="inline-block w-1 h-2 bg-blue-500 animate-pulse delay-150" />
            <span className="inline-block w-1 h-5 bg-blue-500 animate-pulse delay-75" />
            <span className="inline-block w-1 h-3 bg-blue-500 animate-pulse" />
          </div>
          <span className="text-sm text-blue-600 font-medium">再生中...</span>
        </div>
      )}
    </div>
  )
}
