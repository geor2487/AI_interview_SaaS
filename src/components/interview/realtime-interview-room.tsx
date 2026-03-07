'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Mic, MicOff, PhoneOff, Loader2 } from 'lucide-react'
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
  const {
    status,
    currentQuestionIndex,
    totalQuestions,
    transcripts,
    isAiSpeaking,
    aiSubtitle,
    error,
    startInterview,
    endInterview,
  } = useRealtimeInterview()

  const [micMuted, setMicMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [barHeights, setBarHeights] = useState([40, 60, 80, 50, 35])
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  // Auto-start interview
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    startInterview(interviewId)
  }, [interviewId, startInterview])

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
      router.push('/interview/complete')
    }
  }, [status, router])

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
      <main className="flex-1 flex items-stretch p-6 gap-6 overflow-hidden">
        {/* Left: AI Section */}
        <div className="flex-[3] flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto">
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

        {/* Right: Transcript */}
        <div
          className="flex-[2] flex flex-col rounded-xl overflow-hidden max-w-md"
          style={{ background: '#18181b', border: '1px solid #27272a' }}
        >
          <div
            className="px-4 py-3 text-xs font-medium shrink-0"
            style={{ borderBottom: '1px solid #27272a', color: '#818cf8' }}
          >
            会話ログ
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcripts.map((t, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  t.speaker === 'candidate' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    t.speaker === 'candidate'
                      ? 'bg-indigo-600/20 text-indigo-200'
                      : 'bg-zinc-800 text-zinc-300'
                  )}
                >
                  <div className="text-[10px] font-medium mb-1" style={{ color: '#71717a' }}>
                    {t.speaker === 'ai' ? 'AI面接官' : '候補者'}
                  </div>
                  {t.content}
                </div>
              </div>
            ))}
            {/* Show live AI subtitle in transcript */}
            {aiSubtitle && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-zinc-800 text-zinc-400">
                  <div className="text-[10px] font-medium mb-1" style={{ color: '#71717a' }}>
                    AI面接官
                  </div>
                  {aiSubtitle}
                  <span className="inline-block w-1 h-3 bg-zinc-400 animate-pulse ml-0.5" />
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <footer
        className="flex items-center justify-center gap-4 px-6 h-20 shrink-0"
        style={{ borderTop: '1px solid #27272a' }}
      >
        {/* Mic Toggle (visual only - see note in handler) */}
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
