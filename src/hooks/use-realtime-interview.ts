'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Question } from '@/types/index'

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'completed' | 'evaluating' | 'evaluated' | 'error'

interface TranscriptEntry {
  speaker: 'ai' | 'candidate'
  content: string
  timestamp_ms: number
}

interface UseRealtimeInterviewReturn {
  status: RealtimeStatus
  currentQuestionIndex: number
  totalQuestions: number
  transcripts: TranscriptEntry[]
  isAiSpeaking: boolean
  aiSubtitle: string
  error: string | null
  questions: Question[]
  startInterview: (interviewId: string) => Promise<void>
  endInterview: () => Promise<void>
}

export function useRealtimeInterview(): UseRealtimeInterviewReturn {
  const [status, setStatus] = useState<RealtimeStatus>('idle')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [aiSubtitle, setAiSubtitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const interviewIdRef = useRef<string | null>(null)
  const transcriptsRef = useRef<TranscriptEntry[]>([])
  const aiSubtitleRef = useRef('')
  const questionIndexRef = useRef(0)

  // Keep transcriptsRef in sync
  useEffect(() => {
    transcriptsRef.current = transcripts
  }, [transcripts])

  const cleanup = useCallback(() => {
    if (dcRef.current) {
      try { dcRef.current.close() } catch {}
      dcRef.current = null
    }
    if (pcRef.current) {
      try { pcRef.current.close() } catch {}
      pcRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => { cleanup() }
  }, [cleanup])

  const startInterview = useCallback(async (interviewId: string) => {
    try {
      setStatus('connecting')
      setError(null)
      interviewIdRef.current = interviewId

      // 1. Get ephemeral token from our API
      const sessionRes = await fetch('/api/interview/realtime/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id: interviewId }),
      })

      if (!sessionRes.ok) {
        const data = await sessionRes.json()
        throw new Error(data.error || 'Failed to create realtime session')
      }

      const sessionData = await sessionRes.json()
      const { token, questions: qs, totalQuestions: total } = sessionData

      setQuestions(qs)
      setTotalQuestions(total)

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // 3. Set up audio output - listen for remote audio track
      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0]
      }

      // 4. Get local audio and add track
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // 5. Create data channel for events
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.onopen = () => {
        setStatus('connected')
        // Trigger AI to start speaking (initial greeting)
        dc.send(JSON.stringify({
          type: 'response.create',
        }))
      }

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          handleRealtimeEvent(msg)
        } catch (e) {
          console.error('Failed to parse realtime event:', e)
        }
      }

      dc.onerror = (event) => {
        console.error('Data channel error:', event)
        setError('Data channel error')
        setStatus('error')
      }

      dc.onclose = () => {
        console.log('Data channel closed')
      }

      // 6. Create offer and connect to Realtime API
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const realtimeRes = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      )

      if (!realtimeRes.ok) {
        throw new Error('Failed to connect to Realtime API')
      }

      const answerSdp = await realtimeRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

    } catch (err) {
      console.error('Start interview error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start interview')
      setStatus('error')
      cleanup()
    }
  }, [cleanup])

  const handleRealtimeEvent = useCallback((msg: Record<string, unknown>) => {
    const type = msg.type as string

    switch (type) {
      // Candidate speech transcription completed
      case 'conversation.item.input_audio_transcription.completed': {
        const transcript = msg.transcript as string
        if (transcript && transcript.trim()) {
          const entry: TranscriptEntry = {
            speaker: 'candidate',
            content: transcript.trim(),
            timestamp_ms: Date.now(),
          }
          setTranscripts((prev) => [...prev, entry])
        }
        break
      }

      // AI audio transcript streaming (delta)
      case 'response.audio_transcript.delta': {
        const delta = msg.delta as string
        if (delta) {
          aiSubtitleRef.current += delta
          setAiSubtitle(aiSubtitleRef.current)
        }
        break
      }

      // AI audio transcript completed
      case 'response.audio_transcript.done': {
        const transcript = msg.transcript as string
        if (transcript && transcript.trim()) {
          const entry: TranscriptEntry = {
            speaker: 'ai',
            content: transcript.trim(),
            timestamp_ms: Date.now(),
          }
          setTranscripts((prev) => [...prev, entry])

          // Track question progression heuristically
          questionIndexRef.current = Math.min(
            questionIndexRef.current + 1,
            (totalQuestions || 1) - 1
          )
          setCurrentQuestionIndex(questionIndexRef.current)
        }
        // Reset subtitle
        aiSubtitleRef.current = ''
        setAiSubtitle('')
        break
      }

      // AI started speaking
      case 'output_audio_buffer.speech_started': {
        setIsAiSpeaking(true)
        break
      }

      // AI stopped speaking
      case 'output_audio_buffer.speech_stopped': {
        setIsAiSpeaking(false)
        break
      }

      // Response started
      case 'response.created': {
        setIsAiSpeaking(true)
        aiSubtitleRef.current = ''
        setAiSubtitle('')
        break
      }

      // Response done - AI finished a full response
      case 'response.done': {
        setIsAiSpeaking(false)

        // Check if interview is complete by looking at last AI transcript
        const lastTranscript = aiSubtitleRef.current ||
          transcriptsRef.current
            .filter((t) => t.speaker === 'ai')
            .pop()?.content || ''

        if (
          lastTranscript.includes('以上で面接を終了いたします') ||
          lastTranscript.includes('お疲れ様でした')
        ) {
          // Auto-end after AI finishes final statement
          setTimeout(() => {
            endInterviewInternal()
          }, 2000)
        }
        break
      }

      case 'error': {
        const errorMsg = (msg.error as Record<string, unknown>)?.message as string || 'Realtime API error'
        console.error('Realtime API error:', msg.error)
        setError(errorMsg)
        break
      }

      default:
        // Ignore other events
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalQuestions])

  const endInterviewInternal = useCallback(async () => {
    const interviewId = interviewIdRef.current
    if (!interviewId) return

    cleanup()

    try {
      setStatus('evaluating')

      // Save transcripts
      const currentTranscripts = transcriptsRef.current
      if (currentTranscripts.length > 0) {
        const saveRes = await fetch('/api/interview/realtime/save-transcripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interview_id: interviewId,
            transcripts: currentTranscripts,
          }),
        })
        if (!saveRes.ok) {
          const data = await saveRes.json()
          throw new Error(data.error || 'Failed to save transcripts')
        }
      }

      // Trigger evaluation
      const evalRes = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id: interviewId }),
      })

      if (!evalRes.ok) {
        const data = await evalRes.json()
        throw new Error(data.error || 'Failed to evaluate interview')
      }

      setStatus('evaluated')
    } catch (err) {
      console.error('End interview error:', err)
      setError(err instanceof Error ? err.message : 'Failed to end interview')
      setStatus('error')
    }
  }, [cleanup])

  const endInterview = useCallback(async () => {
    await endInterviewInternal()
  }, [endInterviewInternal])

  return {
    status,
    currentQuestionIndex,
    totalQuestions,
    transcripts,
    isAiSpeaking,
    aiSubtitle,
    error,
    questions,
    startInterview,
    endInterview,
  }
}
