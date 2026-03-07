import { openai } from './client'
import type { Question } from '@/types/index'

interface EvaluateInterviewParams {
  transcripts: Array<{
    speaker: string
    content: string
    question_id?: string
  }>
  questions: Array<Pick<Question, 'id' | 'content' | 'evaluation_criteria'>>
}

interface QuestionEvaluation {
  question_id: string
  score: number
  comment: string
}

export interface EvaluationResult {
  overall_score: number
  overall_comment: string
  per_question: QuestionEvaluation[]
}

export async function evaluateInterview(
  params: EvaluateInterviewParams
): Promise<EvaluationResult> {
  const { transcripts, questions } = params

  const transcriptText = transcripts
    .map((t) => `[${t.speaker}]: ${t.content}`)
    .join('\n')

  const questionList = questions
    .map(
      (q, i) =>
        `質問${i + 1} (ID: ${q.id}): ${q.content}\n  評価基準: ${q.evaluation_criteria}`
    )
    .join('\n')

  const prompt = `あなたは面接評価の専門家です。以下の面接の書き起こしを評価してください。

質問リスト:
${questionList}

面接の書き起こし:
${transcriptText}

以下のJSON形式で評価を返してください:
{
  "overall_score": <1-5の整数>,
  "overall_comment": "<全体的な評価コメント>",
  "per_question": [
    {
      "question_id": "<質問ID>",
      "score": <1-5の整数>,
      "comment": "<その質問に対する評価コメント>"
    }
  ]
}

スコアの基準:
1: 不十分 - 質問に対して適切な回答ができていない
2: やや不十分 - 部分的な回答だが改善が必要
3: 普通 - 基本的な要件を満たしている
4: 良好 - 期待を上回る回答
5: 優秀 - 非常に優れた回答`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content ?? '{}'
  return JSON.parse(content) as EvaluationResult
}
