import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildInterviewSystemPrompt, generateInterviewResponse } from '@/lib/openai/chat'
import { textToSpeech } from '@/lib/openai/tts'
import type { Transcript, Question } from '@/types/index'

export async function POST(request: Request) {
  try {
    const { interview_id } = await request.json()

    if (!interview_id) {
      return NextResponse.json(
        { error: 'interview_id is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(c) {
            c.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Fetch interview
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interview_id)
      .single()

    if (interviewError || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    // Fetch questions
    const { data: interviewQuestionSets } = await supabase
      .from('interview_question_sets')
      .select('question_set_id')
      .eq('interview_id', interview_id)
      .order('order_index')

    const questionSetIds = (interviewQuestionSets ?? []).map(
      (iqs) => iqs.question_set_id
    )
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .in('question_set_id', questionSetIds)
      .order('order_index')

    const allQuestions = (questions ?? []) as Question[]

    // Fetch existing transcripts
    const { data: transcripts } = await supabase
      .from('transcripts')
      .select('*')
      .eq('interview_id', interview_id)
      .order('timestamp_ms')

    const conversationHistory = ((transcripts ?? []) as Transcript[]).map(
      (t) => ({
        role: (t.speaker === 'ai' ? 'assistant' : 'user') as
          | 'assistant'
          | 'user',
        content: t.content,
      })
    )

    // Generate resume message
    const systemPrompt = buildInterviewSystemPrompt(allQuestions)
    const resumeMessage = '面接を再開します。次の質問に移ります。'

    const aiResponse = await generateInterviewResponse({
      systemPrompt,
      conversationHistory,
      candidateResponse: resumeMessage,
    })

    // Generate TTS
    const audioBuffer = await textToSpeech(aiResponse)
    const audioBase64 = audioBuffer.toString('base64')

    // Save AI transcript
    const currentQuestionIndex = interview.current_question_index ?? 0
    await supabase.from('transcripts').insert({
      interview_id,
      speaker: 'ai',
      content: aiResponse,
      timestamp_ms: Date.now(),
      question_id: allQuestions[currentQuestionIndex]?.id ?? null,
    })

    return NextResponse.json({
      audio: audioBase64,
      text: aiResponse,
      questionIndex: currentQuestionIndex,
      totalQuestions: allQuestions.length,
    })
  } catch (error) {
    console.error('Interview resume error:', error)
    return NextResponse.json(
      { error: 'Failed to resume interview' },
      { status: 500 }
    )
  }
}
