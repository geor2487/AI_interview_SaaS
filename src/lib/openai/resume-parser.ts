import { openai } from "./client";

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  location: string | null;
  desired_position: string | null;
  desired_salary: string | null;
  available_from: string | null;
  self_introduction: string | null;
  education: {
    institution: string;
    department: string;
    period_start: string;
    period_end: string | null;
    description: string;
  }[];
  careers: {
    company: string;
    title: string;
    period_start: string;
    period_end: string | null;
    description: string;
  }[];
  skills: {
    name: string;
    level: number;
  }[];
}

const SYSTEM_PROMPT = `あなたは履歴書・職務経歴書を解析して構造化データに変換するアシスタントです。
与えられたテキストから以下の情報をJSON形式で抽出してください。

フォーマット:
{
  "name": "氏名（文字列 or null）",
  "email": "メールアドレス（文字列 or null）",
  "phone": "電話番号（文字列 or null）",
  "date_of_birth": "生年月日（YYYY-MM-DD形式 or null）",
  "gender": "性別（male/female/other or null）",
  "location": "居住地（文字列 or null）",
  "desired_position": "希望職種（文字列 or null）",
  "desired_salary": "希望年収（文字列 or null）",
  "available_from": "入社可能時期（YYYY-MM-DD形式 or null）",
  "self_introduction": "自己PR・志望動機を要約（文字列 or null）",
  "education": [
    {
      "institution": "学校名",
      "department": "学部・学科",
      "period_start": "YYYY-MM-DD（日が不明なら01を使用）",
      "period_end": "YYYY-MM-DD or null（在学中はnull）",
      "description": "補足情報"
    }
  ],
  "careers": [
    {
      "company": "会社名",
      "title": "役職・ポジション",
      "period_start": "YYYY-MM-DD（日が不明なら01を使用）",
      "period_end": "YYYY-MM-DD or null（在職中はnull）",
      "description": "業務内容の要約"
    }
  ],
  "skills": [
    {
      "name": "スキル名",
      "level": 50
    }
  ]
}

ルール:
- 情報が見つからない場合はnullを返す
- 日付はYYYY-MM-DD形式。月日が不明な場合は01を使用（例: 2020年4月 → 2020-04-01）
- スキルのlevelは文脈から推定（経験年数が長い・上級 → 80-100、中級 → 50-70、初級 → 20-40）
- 職歴の業務内容は簡潔に要約する
- 必ずJSON形式のみを返す（説明文は不要）`;

export async function parseResumeText(text: string): Promise<ParsedResume> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `以下の履歴書・職務経歴書の内容を解析してJSON形式で返してください:\n\n${text}` },
    ],
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AIからの応答が空です");

  return JSON.parse(content) as ParsedResume;
}
