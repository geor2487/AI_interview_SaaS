import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface TranscriptEntry {
  speaker: 'ai' | 'candidate'
  content: string
  timestamp_ms: number
}

export async function POST(request: Request) {
  try {
    const { interview_id, transcripts } = (await request.json()) as {
      interview_id: string
      transcripts: TranscriptEntry[]
    }

    if (!interview_id) {
      return NextResponse.json(
        { error: 'interview_id is required' },
        { status: 400 }
      )
    }

    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json(
        { error: 'transcripts are required' },
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

    // Bulk insert transcripts
    const rows = transcripts.map((t) => ({
      interview_id,
      speaker: t.speaker,
      content: t.content,
      timestamp_ms: t.timestamp_ms,
      question_id: null,
    }))

    const { error: insertError } = await supabase
      .from('transcripts')
      .insert(rows)

    if (insertError) {
      console.error('Transcript insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save transcripts' },
        { status: 500 }
      )
    }

    // Update interview status to completed
    await supabase
      .from('interviews')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', interview_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save transcripts error:', error)
    return NextResponse.json(
      { error: 'Failed to save transcripts' },
      { status: 500 }
    )
  }
}
