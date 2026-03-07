"use client";

import Link from "next/link";
import { Plus, MessageSquare } from "lucide-react";

const questionSets = [
  {
    id: "1",
    title: "フロントエンド基礎",
    description: "React, TypeScript, CSSに関する基礎的な質問セットです。ジュニア〜ミドルレベルの候補者に適しています。",
    questionCount: 8,
    usageCount: 24,
    createdAt: "2026-02-15",
  },
  {
    id: "2",
    title: "バックエンド実務",
    description: "Node.js, データベース設計, API設計に関する実務レベルの質問です。3年以上の実務経験者を想定しています。",
    questionCount: 10,
    usageCount: 18,
    createdAt: "2026-02-20",
  },
  {
    id: "3",
    title: "PM総合評価",
    description: "プロダクトマネジメントの基礎から応用まで。戦略立案・チームマネジメント・データ分析の能力を評価します。",
    questionCount: 6,
    usageCount: 12,
    createdAt: "2026-03-01",
  },
];

export default function QuestionSetsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">質問セット</h1>
        <Link
          href="/dashboard/question-sets/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新規作成
        </Link>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 gap-4">
        {questionSets.map((qs) => (
          <Link
            key={qs.id}
            href={`/dashboard/question-sets/${qs.id}`}
            className="group rounded-lg border border-border bg-surface p-5 hover:border-accent/30 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light">
                <MessageSquare className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold group-hover:text-accent transition-colors">{qs.title}</h3>
                <p className="mt-1 text-xs text-text-sub leading-relaxed line-clamp-2">{qs.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                  <span className="rounded-full bg-accent-light px-2 py-0.5 font-medium text-accent">
                    {qs.questionCount}問
                  </span>
                  <span>使用回数: {qs.usageCount}回</span>
                  <span>作成日: {qs.createdAt}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
