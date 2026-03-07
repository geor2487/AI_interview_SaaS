import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildInterviewSystemPrompt, generateInterviewResponse } from '@/lib/openai/chat'
import { textToSpeech } from '@/lib/openai/tts'
import type { Interview, Question } from '@/types/index'

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

    // Fetch question sets linked to this interview
    const { data: interviewQuestionSets } = await supabase
      .from('interview_question_sets')
      .select('question_set_id, order_index')
      .eq('interview_id', interview_id)
      .order('order_index')

    if (!interviewQuestionSets || interviewQuestionSets.length === 0) {
      return NextResponse.json(
        { error: 'No question sets found for this interview' },
        { status: 400 }
      )
    }

    // Fetch all questions from the question sets
    const questionSetIds = interviewQuestionSets.map((iqs) => iqs.question_set_id)
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .in('question_set_id', questionSetIds)
      .order('order_index')

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found' },
        { status: 400 }
      )
    }

    // Update interview status
    await supabase
      .from('interviews')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        current_question_index: 0,
      })
      .eq('id', interview_id)

    // Build system prompt and generate greeting
    const systemPrompt = buildInterviewSystemPrompt(questions)
    const greetingText =
      'こんにちは。本日はお時間をいただきありがとうございます。これから面接を始めさせていただきます。'

    const aiResponse = await generateInterviewResponse({
      systemPrompt,
      conversationHistory: [],
      candidateResponse: greetingText,
    })

    // Generate TTS
    const audioBuffer = await textToSpeech(aiResponse)
    const audioBase64 = audioBuffer.toString('base64')

    // Save AI transcript
    await supabase.from('transcripts').insert({
      interview_id,
      speaker: 'ai',
      content: aiResponse,
      timestamp_ms: Date.now(),
      question_id: questions[0]?.id ?? null,
    })

    return NextResponse.json({
      audio: audioBase64,
      text: aiResponse,
      questionIndex: 0,
      totalQuestions: questions.length,
    })
  } catch (error) {
    console.error('Interview start error:', error)
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    )
  }
}
