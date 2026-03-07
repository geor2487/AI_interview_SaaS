"use client";

import { ArrowLeft, GripVertical, Pencil, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";

const questionSet = {
  id: "1",
  title: "フロントエンド基礎",
  description: "React, TypeScript, CSSに関する基礎的な質問セットです。ジュニア〜ミドルレベルの候補者に適しています。",
};

const questions = [
  { id: "q1", order: 1, content: "Reactのコンポーネントライフサイクルについて説明してください。", criteria: "useEffectの理解、マウント/アンマウントの概念、依存配列の説明ができるか" },
  { id: "q2", order: 2, content: "TypeScriptのジェネリクスを使った実装経験について教えてください。", criteria: "型安全性への理解、実務での活用例、型推論の概念を説明できるか" },
  { id: "q3", order: 3, content: "CSSのFlexboxとGridの使い分けについて、具体例を交えて説明してください。", criteria: "レイアウト設計の理解、適切な使い分け判断、レスポンシブ対応への配慮" },
  { id: "q4", order: 4, content: "パフォーマンス最適化のために行ったことを教えてください。", criteria: "メモ化、バンドルサイズ最適化、レンダリング最適化の知識" },
];

export default function QuestionSetDetailPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <Link href="/dashboard/question-sets" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors">
        <ArrowLeft className="h-4 w-4" />
        質問セット一覧に戻る
      </Link>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: Settings */}
        <div className="col-span-2">
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4 sticky top-6">
            <h2 className="text-sm font-semibold">基本設定</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">タイトル</label>
                <input
                  type="text"
                  defaultValue={questionSet.title}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">説明</label>
                <textarea
                  defaultValue={questionSet.description}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition resize-none"
                />
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
                <Save className="h-4 w-4" />
                保存
              </button>
            </div>
          </div>
        </div>

        {/* Right: Questions */}
        <div className="col-span-3 space-y-3">
          <h2 className="text-sm font-semibold">質問一覧 ({questions.length}問)</h2>
          {questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-border bg-surface p-4 group hover:border-accent/30 transition">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-1 pt-0.5">
                  <GripVertical className="h-4 w-4 text-text-muted cursor-grab" />
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                    {q.order}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-relaxed">{q.content}</p>
                  <div className="mt-2 rounded-md bg-background px-3 py-2">
                    <p className="text-xs text-text-muted">
                      <span className="font-medium text-text-sub">評価基準:</span> {q.criteria}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="rounded-md p-1.5 hover:bg-accent-light text-text-muted hover:text-accent transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button className="rounded-md p-1.5 hover:bg-red-bg text-text-muted hover:text-red transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-text-muted hover:border-accent hover:text-accent transition-colors">
            <Plus className="h-4 w-4" />
            質問を追加
          </button>
        </div>
      </div>
    </div>
  );
}
