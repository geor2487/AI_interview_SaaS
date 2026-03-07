import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { transcribeAudio } from '@/lib/openai/whisper'
import { buildInterviewSystemPrompt, generateInterviewResponse } from '@/lib/openai/chat'
import { textToSpeech } from '@/lib/openai/tts'
import type { Transcript, Question } from '@/types/index'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const interviewId = formData.get('interview_id') as string | null

    if (!audioFile || !interviewId) {
      return NextResponse.json(
        { error: 'audio and interview_id are required' },
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

    // 1. Transcribe audio via Whisper
    const audioArrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(audioArrayBuffer)
    const candidateText = await transcribeAudio(audioBuffer)

    // Fetch interview
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
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
      .eq('interview_id', interviewId)
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
    const currentQuestionIndex = interview.current_question_index ?? 0
    const currentQuestion = allQuestions[currentQuestionIndex]

    // 2. Save candidate transcript
    await supabase.from('transcripts').insert({
      interview_id: interviewId,
      speaker: 'candidate',
      content: candidateText,
      timestamp_ms: Date.now(),
      question_id: currentQuestion?.id ?? null,
    })

    // 3. Fetch conversation history
    const { data: transcripts } = await supabase
      .from('transcripts')
      .select('*')
      .eq('interview_id', interviewId)
      .order('timestamp_ms')

    const conversationHistory = ((transcripts ?? []) as Transcript[]).map(
      (t) => ({
        role: (t.speaker === 'ai' ? 'assistant' : 'user') as
          | 'assistant'
          | 'user',
        content: t.content,
      })
    )

    // 4. Generate AI response
    const systemPrompt = buildInterviewSystemPrompt(allQuestions)
    const aiResponseText = await generateInterviewResponse({
      systemPrompt,
      conversationHistory,
      candidateResponse: candidateText,
    })

    // 5. Generate TTS
    const audioResponseBuffer = await textToSpeech(aiResponseText)
    const audioBase64 = audioResponseBuffer.toString('base64')

    // 6. Check if interview is complete
    const isComplete = aiResponseText.includes('以上で面接を終了いたします')

    // Determine next question index
    let nextQuestionIndex = currentQuestionIndex
    // Simple heuristic: if AI moved to the next question, increment index
    if (currentQuestion && currentQuestionIndex < allQuestions.length - 1) {
      const nextQuestion = allQuestions[currentQuestionIndex + 1]
      if (nextQuestion && aiResponseText.includes(nextQuestion.content.slice(0, 20))) {
        nextQuestionIndex = currentQuestionIndex + 1
      }
    }

    // 7. Save AI transcript
    await supabase.from('transcripts').insert({
      interview_id: interviewId,
      speaker: 'ai',
      content: aiResponseText,
      timestamp_ms: Date.now(),
      question_id: allQuestions[nextQuestionIndex]?.id ?? null,
    })

    // 8. Update interview state
    if (isComplete) {
      await supabase
        .from('interviews')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_question_index: nextQuestionIndex,
        })
        .eq('id', interviewId)
    } else {
      await supabase
        .from('interviews')
        .update({ current_question_index: nextQuestionIndex })
        .eq('id', interviewId)
    }

    return NextResponse.json({
      audio: audioBase64,
      text: aiResponseText,
      candidateText,
      questionIndex: nextQuestionIndex,
      isComplete,
    })
  } catch (error) {
    console.error('Interview respond error:', error)
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    )
  }
}
