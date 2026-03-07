"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CandidateStatus } from "@/types";

interface MockCandidate {
  id: string;
  name: string;
  email: string;
  position: string;
  age: number;
  status: CandidateStatus;
  score: number | null;
  updatedAt: string;
}

const candidates: MockCandidate[] = [
  { id: "1", name: "佐藤 花子", email: "hanako@example.com", position: "フロントエンドエンジニア", age: 28, status: "interviewed", score: 85, updatedAt: "2026-03-07" },
  { id: "2", name: "鈴木 一郎", email: "ichiro@example.com", position: "バックエンドエンジニア", age: 32, status: "scheduled", score: null, updatedAt: "2026-03-06" },
  { id: "3", name: "田中 美咲", email: "misaki@example.com", position: "プロダクトマネージャー", age: 30, status: "evaluated", score: 92, updatedAt: "2026-03-05" },
  { id: "4", name: "高橋 健太", email: "kenta@example.com", position: "フロントエンドエンジニア", age: 26, status: "accepted", score: 88, updatedAt: "2026-03-04" },
  { id: "5", name: "渡辺 さくら", email: "sakura@example.com", position: "デザイナー", age: 24, status: "rejected", score: 45, updatedAt: "2026-03-03" },
];

const tabs: { label: string; value: CandidateStatus | "all" }[] = [
  { label: "全て", value: "all" },
  { label: "招待済", value: "invited" },
  { label: "予定済", value: "scheduled" },
  { label: "面接中", value: "interviewed" },
  { label: "評価済", value: "evaluated" },
  { label: "合格", value: "accepted" },
  { label: "不合格", value: "rejected" },
];

const statusBadge: Record<CandidateStatus, { label: string; className: string }> = {
  invited: { label: "招待済", className: "bg-gray-100 text-gray-600" },
  scheduled: { label: "予定済", className: "bg-yellow-bg text-yellow" },
  interviewed: { label: "面接済", className: "bg-accent-light text-accent" },
  evaluated: { label: "評価済", className: "bg-green-bg text-green" },
  rejected: { label: "不合格", className: "bg-red-bg text-red" },
  accepted: { label: "合格", className: "bg-green-bg text-green" },
};

export default function CandidatesPage() {
  const [activeTab, setActiveTab] = useState<CandidateStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = candidates.filter((c) => {
    if (activeTab !== "all" && c.status !== activeTab) return false;
    if (search && !c.name.includes(search) && !c.email.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">候補者一覧</h1>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          新規追加
        </button>
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="氏名・メールで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-sub text-left text-xs text-text-muted">
              <th className="px-5 py-3 font-medium">氏名 / メール</th>
              <th className="px-5 py-3 font-medium">ポジション</th>
              <th className="px-5 py-3 font-medium">年齢</th>
              <th className="px-5 py-3 font-medium">ステータス</th>
              <th className="px-5 py-3 font-medium">スコア</th>
              <th className="px-5 py-3 font-medium">最終更新</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const badge = statusBadge[c.status];
              return (
                <tr key={c.id} className="border-b border-border-sub last:border-0 hover:bg-background transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/candidates/${c.id}`} className="hover:text-accent transition-colors">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-text-muted">{c.email}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-sub">{c.position}</td>
                  <td className="px-5 py-3 text-text-sub">{c.age}歳</td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", badge.className)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">{c.score !== null ? `${c.score}点` : "-"}</td>
                  <td className="px-5 py-3 text-text-muted">{c.updatedAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
