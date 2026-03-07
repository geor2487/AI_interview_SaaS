import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { evaluateInterview } from '@/lib/openai/evaluate'
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

    // Fetch all transcripts
    const { data: transcripts, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('interview_id', interview_id)
      .order('timestamp_ms')

    if (transcriptError || !transcripts || transcripts.length === 0) {
      return NextResponse.json(
        { error: 'No transcripts found' },
        { status: 400 }
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

    // Evaluate
    const result = await evaluateInterview({
      transcripts: (transcripts as Transcript[]).map((t) => ({
        speaker: t.speaker,
        content: t.content,
        question_id: t.question_id ?? undefined,
      })),
      questions: allQuestions.map((q) => ({
        id: q.id,
        content: q.content,
        evaluation_criteria: q.evaluation_criteria,
      })),
    })

    // Save overall evaluation
    await supabase.from('evaluations').insert({
      interview_id,
      question_id: null,
      ai_score: result.overall_score,
      ai_comment: result.overall_comment,
    })

    // Save per-question evaluations
    for (const qEval of result.per_question) {
      await supabase.from('evaluations').insert({
        interview_id,
        question_id: qEval.question_id,
        ai_score: qEval.score,
        ai_comment: qEval.comment,
      })
    }

    // Update interview status
    await supabase
      .from('interviews')
      .update({ status: 'evaluated' })
      .eq('id', interview_id)

    return NextResponse.json({
      evaluations: {
        overall: {
          score: result.overall_score,
          comment: result.overall_comment,
        },
        per_question: result.per_question,
      },
    })
  } catch (error) {
    console.error('Interview evaluate error:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate interview' },
      { status: 500 }
    )
  }
}
