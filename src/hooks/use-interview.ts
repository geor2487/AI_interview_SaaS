'use client'

import { useState, useCallback, useRef } from 'react'

type InterviewStatus =
  | 'idle'
  | 'starting'
  | 'in_progress'
  | 'recording'
  | 'processing'
  | 'playing'
  | 'completed'
  | 'evaluating'
  | 'evaluated'
  | 'error'

interface TranscriptEntry {
  speaker: 'ai' | 'candidate'
  content: string
}

interface UseInterviewReturn {
  status: InterviewStatus
  currentQuestion: string | null
  questionIndex: number
  totalQuestions: number
  isRecording: boolean
  isProcessing: boolean
  transcripts: TranscriptEntry[]
  error: string | null
  currentAudio: string | null
  startInterview: (interviewId: string) => Promise<void>
  sendResponse: (audioBlob: Blob) => Promise<void>
  endInterview: () => Promise<void>
  resumeInterview: (interviewId: string) => Promise<void>
  startRecording: () => void
  stopRecording: () => void
  onPlaybackComplete: () => void
}

export function useInterview(): UseInterviewReturn {
  const [status, setStatus] = useState<InterviewStatus>('idle')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)

  const interviewIdRef = useRef<string | null>(null)

  const isRecording = status === 'recording'
  const isProcessing = status === 'processing' || status === 'starting' || status === 'evaluating'

  const startInterview = useCallback(async (interviewId: string) => {
    try {
      setStatus('starting')
      setError(null)
      interviewIdRef.current = interviewId

      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id: interviewId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to start interview')
      }

      const data = await res.json()

      setTranscripts([{ speaker: 'ai', content: data.text }])
      setQuestionIndex(data.questionIndex)
      setTotalQuestions(data.totalQuestions)
      setCurrentAudio(data.audio)
      setStatus('playing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview')
      setStatus('error')
    }
  }, [])

  const resumeInterview = useCallback(async (interviewId: string) => {
    try {
      setStatus('starting')
      setError(null)
      interviewIdRef.current = interviewId

      const res = await fetch('/api/interview/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id: interviewId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to resume interview')
      }

      const data = await res.json()

      setTranscripts((prev) => [...prev, { speaker: 'ai', content: data.text }])
      setQuestionIndex(data.questionIndex)
      setTotalQuestions(data.totalQuestions)
      setCurrentAudio(data.audio)
      setStatus('playing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume interview')
      setStatus('error')
    }
  }, [])

  const startRecording = useCallback(() => {
    setStatus('recording')
  }, [])

  const stopRecording = useCallback(() => {
    if (status === 'recording') {
      setStatus('in_progress')
    }
  }, [status])

  const sendResponse = useCallback(async (audioBlob: Blob) => {
    try {
      setStatus('processing')
      setError(null)

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('interview_id', interviewIdRef.current!)

      const res = await fetch('/api/interview/respond', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to process response')
      }

      const data = await res.json()

      setTranscripts((prev) => [
        ...prev,
        { speaker: 'candidate', content: data.candidateText },
        { speaker: 'ai', content: data.text },
      ])
      setQuestionIndex(data.questionIndex)

      if (data.isComplete) {
        setCurrentAudio(data.audio)
        setStatus('playing')
        // After playback, status will be set to 'completed' via onPlaybackComplete
      } else {
        setCurrentAudio(data.audio)
        setStatus('playing')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process response')
      setStatus('error')
    }
  }, [])

  const onPlaybackComplete = useCallback(() => {
    setCurrentAudio(null)
    // Check if the last AI message indicates completion
    setTranscripts((prev) => {
      const lastAi = [...prev].reverse().find((t) => t.speaker === 'ai')
      if (lastAi?.content.includes('以上で面接を終了いたします')) {
        setStatus('completed')
      } else {
        setStatus('in_progress')
      }
      return prev
    })
  }, [])

  const endInterview = useCallback(async () => {
    if (!interviewIdRef.current) return

    try {
      setStatus('evaluating')
      setError(null)

      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id: interviewIdRef.current }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to evaluate interview')
      }

      setStatus('evaluated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate interview')
      setStatus('error')
    }
  }, [])

  return {
    status,
    currentQuestion,
    questionIndex,
    totalQuestions,
    isRecording,
    isProcessing,
    transcripts,
    error,
    currentAudio,
    startInterview,
    sendResponse,
    endInterview,
    resumeInterview,
    startRecording,
    stopRecording,
    onPlaybackComplete,
  }
}
