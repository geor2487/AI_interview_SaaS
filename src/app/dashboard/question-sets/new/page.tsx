"use client";

import { ArrowLeft, Plus, Save } from "lucide-react";
import Link from "next/link";

export default function NewQuestionSetPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <Link href="/dashboard/question-sets" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors">
        <ArrowLeft className="h-4 w-4" />
        質問セット一覧に戻る
      </Link>

      <h1 className="text-xl font-bold">新規質問セット作成</h1>

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
                  placeholder="例: フロントエンド基礎"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">説明</label>
                <textarea
                  placeholder="質問セットの説明を入力..."
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

        {/* Right: Questions (empty state) */}
        <div className="col-span-3 space-y-3">
          <h2 className="text-sm font-semibold">質問一覧 (0問)</h2>

          <div className="rounded-lg border-2 border-dashed border-border bg-surface p-8 text-center">
            <p className="text-sm text-text-muted mb-3">まだ質問がありません</p>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
              <Plus className="h-4 w-4" />
              最初の質問を追加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
