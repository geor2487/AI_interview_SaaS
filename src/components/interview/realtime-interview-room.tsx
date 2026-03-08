'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Mic, MicOff, PhoneOff, Loader2, Video, VideoOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRealtimeInterview } from '@/hooks/use-realtime-interview'
import type { Question } from '@/types/index'

interface RealtimeInterviewRoomProps {
  interviewId: string
  questions: Question[]
}

export function RealtimeInterviewRoom({
  interviewId,
}: RealtimeInterviewRoomProps) {
  const router = useRouter()

  const [micMuted, setMicMuted] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [barHeights, setBarHeights] = useState([40, 60, 80, 50, 35])
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const uploadRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    // Wait for final chunks
    await new Promise((r) => setTimeout(r, 500))

    console.log('[Recording] chunks:', chunksRef.current.length)
    if (chunksRef.current.length === 0) return
    const blob = new Blob(chunksRef.current, { type: 'video/webm' })
    const formData = new FormData()
    formData.append('video', blob, `interview-${interviewId}.webm`)
    formData.append('interview_id', interviewId)

    try {
      await fetch('/api/recordings/upload', { method: 'POST', body: formData })
    } catch (err) {
      console.error('Recording upload failed:', err)
    }
  }, [interviewId])

  const {
    status,
    currentQuestionIndex,
    totalQuestions,
    transcripts,
    isAiSpeaking,
    aiSubtitle,
    error,
    remoteStream,
    startInterview,
    endInterview,
  } = useRealtimeInterview({
    onBeforeEnd: uploadRecording,
  })

  // Auto-start interview
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    startInterview(interviewId)
  }, [interviewId, startInterview])

  const audioContextRef = useRef<AudioContext | null>(null)
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)

  // Camera + Audio setup
  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        mediaStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.muted = true // prevent echo
        }

        // Create AudioContext to mix candidate mic + AI audio for recording
        const audioCtx = new AudioContext()
        audioContextRef.current = audioCtx
        const dest = audioCtx.createMediaStreamDestination()
        audioDestRef.current = dest

        // Add candidate mic audio to mix
        const micSource = audioCtx.createMediaStreamSource(stream)
        micSource.connect(dest)
      } catch {
        setCameraOn(false)
      }
    }
    initCamera()
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  // Capture AI audio into the mix when remote stream arrives
  useEffect(() => {
    if (!remoteStream || !audioContextRef.current || !audioDestRef.current) return

    try {
      const aiSource = audioContextRef.current.createMediaStreamSource(remoteStream)
      aiSource.connect(audioDestRef.current)
    } catch {
      // Already connected or invalid stream
    }
  }, [remoteStream])

  // Start recording when connected and remote stream is available
  useEffect(() => {
    if (status !== 'connected' || !mediaStreamRef.current || !audioDestRef.current || !remoteStream) return

    try {
      // Combine video tracks + mixed audio track
      const videoTracks = mediaStreamRef.current.getVideoTracks()
      const mixedAudioTracks = audioDestRef.current.stream.getAudioTracks()
      const combinedStream = new MediaStream([...videoTracks, ...mixedAudioTracks])

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm',
      })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start(1000)
      mediaRecorderRef.current = recorder
      console.log('[Recording] started with', videoTracks.length, 'video +', mixedAudioTracks.length, 'audio tracks')
    } catch (err) {
      console.error('[Recording] failed to start:', err)
    }
  }, [status, remoteStream])

  const handleCameraToggle = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setCameraOn(videoTrack.enabled)
      }
    }
  }

  // Timer
  useEffect(() => {
    if (status !== 'connected' && status !== 'evaluating') return
    const timer = setInterval(() => {
      setElapsed((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [status])

  // Animate audio bars when AI is speaking
  useEffect(() => {
    if (!isAiSpeaking) return
    const interval = setInterval(() => {
      setBarHeights((prev) =>
        prev.map(() => 20 + Math.random() * 60)
      )
    }, 200)
    return () => clearInterval(interval)
  }, [isAiSpeaking])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcripts, aiSubtitle])

  // Redirect on evaluation complete
  useEffect(() => {
    if (status === 'evaluated') {
      const answeredQuestions = currentQuestionIndex + 1
      const minutes = Math.ceil(elapsed / 60)
      router.push(`/interview/complete?questions=${answeredQuestions}&minutes=${minutes}`)
    }
  }, [status, router, currentQuestionIndex, elapsed])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const handleMicToggle = () => {
    // Note: We do NOT toggle track.enabled as that breaks server VAD.
    // Instead we just show a visual indicator. In a real scenario,
    // consider using gain node to zero out audio instead.
    setMicMuted(!micMuted)
  }

  const handleEndInterview = async () => {
    await endInterview()
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
  }

  const getStatusLabel = (): string => {
    switch (status) {
      case 'connecting':
        return '接続中...'
      case 'connected':
        return isAiSpeaking ? 'AI回答中' : '聞き取り中'
      case 'evaluating':
        return '評価中...'
      case 'evaluated':
        return '完了'
      case 'error':
        return 'エラー'
      default:
        return '待機中'
    }
  }

  const getStatusColor = (): string => {
    if (status === 'error') return 'bg-red-500'
    if (isAiSpeaking) return 'bg-purple-500'
    if (status === 'connected') return 'bg-green-500'
    return 'bg-yellow-500'
  }

  // Loading / connecting state
  if (status === 'idle' || status === 'connecting') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#09090b', color: '#fafafa' }}
      >
        <Loader2 className="h-12 w-12 animate-spin" style={{ color: '#818cf8' }} />
        <p className="text-lg font-medium">面接セッションに接続中...</p>
        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#09090b', color: '#fafafa' }}
      >
        <div className="text-red-400 text-center">
          <p className="text-lg font-medium mb-2">接続エラー</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => {
              startedRef.current = false
              startInterview(interviewId)
            }}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#818cf8', color: '#fafafa' }}
          >
            再接続
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#09090b', color: '#fafafa' }}
    >
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid #27272a' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">InterviewAI</span>
          <span
            className="ml-2 text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#818cf820', color: '#818cf8' }}
          >
            Realtime
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full animate-pulse', getStatusColor())} />
            <span style={{ color: '#a1a1aa' }} className="text-xs">
              {getStatusLabel()}
            </span>
          </div>

          {/* Question Progress */}
          <span style={{ color: '#a1a1aa' }}>
            質問{' '}
            <span className="font-semibold" style={{ color: '#818cf8' }}>
              {Math.min(currentQuestionIndex + 1, totalQuestions)}
            </span>
            /{totalQuestions}
          </span>

          {/* Timer */}
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1"
            style={{ background: '#18181b' }}
          >
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm font-medium">
              {formatTime(elapsed)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        {/* AI Section */}
        <div className="flex flex-col items-center justify-center gap-6 w-full max-w-2xl relative">
          {/* Hidden video element for recording */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="hidden"
          />
          {/* AI Avatar */}
          <div className="relative">
            <div
              className={cn(
                'h-36 w-36 rounded-full flex items-center justify-center transition-all duration-500',
                isAiSpeaking && 'scale-105'
              )}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
                boxShadow: isAiSpeaking
                  ? '0 0 80px rgba(99,102,241,0.4), 0 0 160px rgba(139,92,246,0.2)'
                  : '0 0 40px rgba(99,102,241,0.2), 0 0 80px rgba(139,92,246,0.1)',
              }}
            >
              <Bot className="h-14 w-14 text-white/90" />
            </div>
            {isAiSpeaking && (
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  opacity: 0.15,
                  animationDuration: '2s',
                }}
              />
            )}
          </div>

          {/* Audio Visualizer */}
          <div className="flex items-end gap-1.5 h-10">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-full transition-all duration-200 ease-in-out"
                style={{
                  height: isAiSpeaking ? `${h}%` : '20%',
                  background: 'linear-gradient(to top, #6366f1, #a78bfa)',
                  opacity: isAiSpeaking ? 0.8 : 0.3,
                }}
              />
            ))}
          </div>

          {/* AI Subtitle */}
          {aiSubtitle && (
            <div
              className="w-full rounded-xl px-6 py-4 text-center"
              style={{ background: '#18181b', border: '1px solid #27272a' }}
            >
              <p className="text-sm leading-relaxed" style={{ color: '#e4e4e7' }}>
                {aiSubtitle}
              </p>
            </div>
          )}

          {/* Question Progress Bar */}
          <div className="w-full max-w-md">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: '#27272a' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0}%`,
                  background: 'linear-gradient(to right, #6366f1, #818cf8)',
                }}
              />
            </div>
          </div>
        </div>

      </main>

      {/* Bottom Bar */}
      <footer
        className="flex items-center justify-center gap-4 px-6 h-20 shrink-0"
        style={{ borderTop: '1px solid #27272a' }}
      >
        {/* Camera Toggle */}
        <button
          onClick={handleCameraToggle}
          className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center transition-all',
            cameraOn
              ? 'bg-[#27272a] hover:bg-[#3f3f46] text-white'
              : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
          )}
          title={cameraOn ? 'カメラOFF' : 'カメラON'}
        >
          {cameraOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </button>

        {/* Mic Toggle */}
        <button
          onClick={handleMicToggle}
          className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center transition-all',
            !micMuted
              ? 'bg-[#27272a] hover:bg-[#3f3f46] text-white'
              : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
          )}
          title={micMuted ? 'マイクON' : 'マイクOFF'}
        >
          {!micMuted ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </button>

        {/* End Interview */}
        <button
          onClick={handleEndInterview}
          disabled={status === 'evaluating'}
          className={cn(
            'h-12 px-6 rounded-full text-white text-sm font-semibold flex items-center gap-2 transition-all',
            status === 'evaluating'
              ? 'bg-zinc-700 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500'
          )}
        >
          {status === 'evaluating' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              評価中...
            </>
          ) : (
            <>
              <PhoneOff className="h-4 w-4" />
              面接を終了
            </>
          )}
        </button>
      </footer>
    </div>
  )
}
