import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { evaluateInterview } from '@/lib/openai/evaluate'
import { sendEmail } from '@/lib/email/client'
import { completionEmail } from '@/lib/email/templates'
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

    // Use admin client to bypass RLS (candidates are not org members)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    // Send completion email to candidate
    try {
      const { data: interview } = await supabase
        .from('interviews')
        .select('candidate_id, organization_id')
        .eq('id', interview_id)
        .single()

      if (interview) {
        const [{ data: candidate }, { data: org }] = await Promise.all([
          supabase.from('candidates').select('name, email').eq('id', interview.candidate_id).single(),
          supabase.from('organizations').select('name').eq('id', interview.organization_id).single(),
        ])

        if (candidate?.email) {
          const { subject, body: emailBody } = completionEmail({
            candidate_name: candidate.name,
            company_name: org?.name ?? '企業',
          })
          await sendEmail({ to: candidate.email, subject, text: emailBody })
        }
      }
    } catch (emailErr) {
      console.error('[Evaluate] Completion email failed:', emailErr)
    }

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
