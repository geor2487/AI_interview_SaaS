import { openai } from './client'
import type { Question } from '@/types/index'

interface GenerateInterviewResponseParams {
  systemPrompt: string
  conversationHistory: Array<{ role: 'assistant' | 'user'; content: string }>
  candidateResponse: string
}

export async function generateInterviewResponse(
  params: GenerateInterviewResponseParams
): Promise<string> {
  const { systemPrompt, conversationHistory, candidateResponse } = params

  const messages: Array<{ role: 'system' | 'assistant' | 'user'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: candidateResponse },
  ]

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
  })

  return completion.choices[0]?.message?.content ?? ''
}

export function buildInterviewSystemPrompt(
  questions: Array<Pick<Question, 'content' | 'evaluation_criteria'>>
): string {
  const questionList = questions
    .map(
      (q, i) =>
        `質問${i + 1}: ${q.content}\n  評価基準: ${q.evaluation_criteria}`
    )
    .join('\n')

  return `あなたはプロの面接官です。以下のルールに従って面接を進めてください。

ルール:
- 会話は必ず日本語のみで行ってください。候補者の発言が他言語であっても日本語で応答してください
- 候補者に対して丁寧かつプロフェッショナルに対応してください
- 各質問について候補者の回答を深掘りしてください
- 候補者の回答が不十分な場合はフォローアップの質問をしてください
- 全ての質問が完了したら、面接の終了を宣言してください
- 面接終了時は必ず「以上で面接を終了いたします。」というフレーズを含めてください
- 自然な会話の流れを大切にしてください

質問リスト:
${questionList}

上記の質問を順番に聞いていき、全ての質問が完了したら面接を終了してください。`
}
