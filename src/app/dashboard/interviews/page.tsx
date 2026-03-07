"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterviewStatus } from "@/types";

interface MockInterview {
  id: string;
  candidateName: string;
  candidateInitial: string;
  questionSet: string;
  status: InterviewStatus;
  score: number | null;
  scheduledAt: string;
}

const interviews: MockInterview[] = [
  { id: "1", candidateName: "佐藤 花子", candidateInitial: "佐", questionSet: "フロントエンド基礎", status: "completed", score: 85, scheduledAt: "2026-03-07 10:00" },
  { id: "2", candidateName: "鈴木 一郎", candidateInitial: "鈴", questionSet: "バックエンド実務", status: "pending", score: null, scheduledAt: "2026-03-08 13:30" },
  { id: "3", candidateName: "田中 美咲", candidateInitial: "田", questionSet: "PM総合評価", status: "in_progress", score: null, scheduledAt: "2026-03-07 16:00" },
  { id: "4", candidateName: "高橋 健太", candidateInitial: "高", questionSet: "フロントエンド応用", status: "evaluated", score: 92, scheduledAt: "2026-03-05 11:00" },
  { id: "5", candidateName: "渡辺 さくら", candidateInitial: "渡", questionSet: "バックエンド基礎", status: "evaluated", score: 78, scheduledAt: "2026-03-04 14:00" },
];

const tabs: { label: string; value: InterviewStatus | "all" }[] = [
  { label: "全て", value: "all" },
  { label: "予定", value: "pending" },
  { label: "進行中", value: "in_progress" },
  { label: "完了", value: "completed" },
  { label: "評価済", value: "evaluated" },
];

const statusBadge: Record<InterviewStatus, { label: string; className: string }> = {
  pending: { label: "予定", className: "bg-yellow-bg text-yellow" },
  in_progress: { label: "進行中", className: "bg-accent-light text-accent-text" },
  completed: { label: "完了", className: "bg-green-bg text-green" },
  evaluated: { label: "評価済", className: "bg-accent-light text-accent" },
};

export default function InterviewsPage() {
  const [activeTab, setActiveTab] = useState<InterviewStatus | "all">("all");

  const filtered = interviews.filter((iv) => activeTab === "all" || iv.status === activeTab);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">面接一覧</h1>
        <Link
          href="/dashboard/interviews/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新規作成
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.value
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-sub"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-sub text-left text-xs text-text-muted">
              <th className="px-5 py-3 font-medium">候補者</th>
              <th className="px-5 py-3 font-medium">質問セット</th>
              <th className="px-5 py-3 font-medium">ステータス</th>
              <th className="px-5 py-3 font-medium">スコア</th>
              <th className="px-5 py-3 font-medium">予定日時</th>
              <th className="px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((iv) => {
              const badge = statusBadge[iv.status];
              return (
                <tr key={iv.id} className="border-b border-border-sub last:border-0 hover:bg-background transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-[10px] font-bold text-white">
                        {iv.candidateInitial}
                      </div>
                      <span className="font-medium">{iv.candidateName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-text-sub">{iv.questionSet}</td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", badge.className)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">{iv.score !== null ? `${iv.score}点` : "-"}</td>
                  <td className="px-5 py-3 text-text-muted">{iv.scheduledAt}</td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/interviews/${iv.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-sub hover:bg-accent-light hover:text-accent hover:border-accent/30 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      詳細
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
