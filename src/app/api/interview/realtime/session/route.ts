import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildInterviewSystemPrompt } from '@/lib/openai/chat'
import type { Question } from '@/types/index'

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
            try {
              c.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
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

    const typedQuestions = questions as Question[]

    // Build system prompt
    const systemPrompt = buildInterviewSystemPrompt(typedQuestions)

    // Create ephemeral token via OpenAI Realtime Sessions API
    const realtimeRes = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        instructions: systemPrompt,
        input_audio_transcription: {
          model: 'gpt-4o-mini-transcription',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.8,
          silence_duration_ms: 1200,
        },
      }),
    })

    if (!realtimeRes.ok) {
      const errorText = await realtimeRes.text()
      console.error('Realtime session creation failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to create realtime session' },
        { status: 500 }
      )
    }

    const realtimeData = await realtimeRes.json()
    const ephemeralToken = realtimeData.client_secret?.value

    if (!ephemeralToken) {
      console.error('No ephemeral token in response:', realtimeData)
      return NextResponse.json(
        { error: 'Failed to obtain ephemeral token' },
        { status: 500 }
      )
    }

    // Update interview status
    await supabase
      .from('interviews')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', interview_id)

    return NextResponse.json({
      token: ephemeralToken,
      questions: typedQuestions,
      totalQuestions: typedQuestions.length,
    })
  } catch (error) {
    console.error('Realtime session error:', error)
    return NextResponse.json(
      { error: 'Failed to create realtime session' },
      { status: 500 }
    )
  }
}
