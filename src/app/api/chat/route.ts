import { NextRequest } from "next/server";
import { openai } from "@/lib/openai/client";

const SYSTEM_PROMPT = `あなたはInterviewAIの管理者向けAIアシスタントです。
採用活動、面接の進め方、候補者の評価、質問セットの作成などに関する質問に回答してください。
回答は簡潔で実用的なものにしてください。日本語で回答してください。`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ],
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content ?? "";

  return Response.json({ content });
}
