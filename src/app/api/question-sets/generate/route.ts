import { NextResponse, type NextRequest } from "next/server";
import { openai } from "@/lib/openai/client";

export async function POST(request: NextRequest) {
  const { position, level, count } = await request.json();

  if (!position || !count) {
    return NextResponse.json(
      { error: "職種と質問数は必須です。" },
      { status: 400 }
    );
  }

  const levelLabel =
    level === "junior"
      ? "ジュニア（1-2年目）"
      : level === "senior"
        ? "シニア（5年以上）"
        : "ミドル（3-5年）";

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `あなたはAI面接の質問セットを作成する専門家です。
与えられた職種・レベルに応じた面接質問と評価基準をJSON形式で生成してください。

出力フォーマット:
{
  "title": "質問セットのタイトル",
  "description": "質問セットの説明（1-2文）",
  "questions": [
    {
      "content": "質問文",
      "evaluation_criteria": "この質問で評価するポイント（具体的に）"
    }
  ]
}`,
      },
      {
        role: "user",
        content: `職種: ${position}\nレベル: ${levelLabel}\n質問数: ${count}問\n\n上記の条件で面接質問セットを生成してください。`,
      },
    ],
  });

  const content = res.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "AIからの応答がありませんでした。" },
      { status: 500 }
    );
  }

  const data = JSON.parse(content);
  return NextResponse.json(data);
}
