"use client";

import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const candidateOptions = [
  { id: "1", name: "佐藤 花子" },
  { id: "2", name: "鈴木 一郎" },
  { id: "3", name: "田中 美咲" },
  { id: "4", name: "高橋 健太" },
  { id: "5", name: "渡辺 さくら" },
];

const questionSetOptions = [
  { id: "1", title: "フロントエンド基礎", questionCount: 8 },
  { id: "2", title: "バックエンド実務", questionCount: 10 },
  { id: "3", title: "PM総合評価", questionCount: 6 },
];

export default function NewInterviewPage() {
  const [inviteMethod, setInviteMethod] = useState<"email" | "link">("email");

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/dashboard/interviews" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors">
        <ArrowLeft className="h-4 w-4" />
        面接一覧に戻る
      </Link>

      <h1 className="text-xl font-bold">新規面接作成</h1>

      <div className="rounded-lg border border-border bg-surface p-6 space-y-6">
        {/* 候補者選択 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">候補者選択</label>
          <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition">
            <option value="">候補者を選択...</option>
            {candidateOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 質問セット選択 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">質問セット選択</label>
          <div className="space-y-2">
            {questionSetOptions.map((qs, idx) => (
              <label
                key={qs.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-background cursor-pointer transition-colors"
              >
                <input type="checkbox" className="h-4 w-4 rounded border-border text-accent focus:ring-accent" />
                <div className="flex items-center gap-2 flex-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium">{qs.title}</span>
                </div>
                <span className="text-xs text-text-muted">{qs.questionCount}問</span>
              </label>
            ))}
          </div>
        </div>

        {/* 面接日時 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">面接日時</label>
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
          />
        </div>

        {/* 招待方法 */}
        <div>
          <label className="block text-sm font-medium mb-2">招待方法</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="invite"
                checked={inviteMethod === "email"}
                onChange={() => setInviteMethod("email")}
                className="h-4 w-4 text-accent focus:ring-accent"
              />
              <span className="text-sm">メール送信</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="invite"
                checked={inviteMethod === "link"}
                onChange={() => setInviteMethod("link")}
                className="h-4 w-4 text-accent focus:ring-accent"
              />
              <span className="text-sm">リンクコピー</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
          <Send className="h-4 w-4" />
          面接を作成
        </button>
      </div>
    </div>
  );
}
