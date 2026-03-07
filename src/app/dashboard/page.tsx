"use client";

import { Calendar, TrendingUp, Users, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "進行中の面接", value: "12", change: "+3", icon: Clock, color: "text-accent" },
  { label: "今月の候補者", value: "48", change: "+8", icon: Users, color: "text-blue-600" },
  { label: "完了した面接", value: "156", change: "+12", icon: CheckCircle2, color: "text-green" },
  { label: "平均スコア", value: "78.5", change: "+2.3", icon: TrendingUp, color: "text-yellow" },
];

const todaySchedule = [
  { time: "10:00", name: "佐藤 花子", position: "フロントエンドエンジニア" },
  { time: "13:30", name: "鈴木 一郎", position: "バックエンドエンジニア" },
  { time: "16:00", name: "田中 美咲", position: "プロダクトマネージャー" },
];

const recentEvaluations = [
  { name: "高橋 健太", score: 92, label: "優秀" },
  { name: "渡辺 さくら", score: 78, label: "良好" },
  { name: "伊藤 大輔", score: 65, label: "標準" },
];

const recentInterviews = [
  { candidate: "佐藤 花子", questionSet: "フロントエンド基礎", status: "completed" as const, score: 85, date: "2026-03-07" },
  { candidate: "鈴木 一郎", questionSet: "バックエンド実務", status: "evaluated" as const, score: 72, date: "2026-03-06" },
  { candidate: "田中 美咲", questionSet: "PM総合", status: "in_progress" as const, score: null, date: "2026-03-07" },
  { candidate: "高橋 健太", questionSet: "フロントエンド応用", status: "evaluated" as const, score: 92, date: "2026-03-05" },
  { candidate: "渡辺 さくら", questionSet: "バックエンド基礎", status: "completed" as const, score: 78, date: "2026-03-04" },
];

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "予定", className: "bg-yellow-bg text-yellow" },
  in_progress: { label: "進行中", className: "bg-accent-light text-accent-text" },
  completed: { label: "完了", className: "bg-green-bg text-green" },
  evaluated: { label: "評価済", className: "bg-accent-light text-accent" },
};

function scoreBadgeClass(score: number) {
  if (score >= 85) return "bg-green-bg text-green";
  if (score >= 70) return "bg-accent-light text-accent";
  return "bg-yellow-bg text-yellow";
}

export default function DashboardPage() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-accent to-purple-500 p-6 text-white">
        <h1 className="text-xl font-bold">おはようございます、山田さん</h1>
        <p className="mt-1 text-sm text-white/80">{dateStr} - 本日の面接予定は3件です</p>
      </div>

      {/* 2x2 Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pipeline数値 */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-sub mb-4">パイプライン</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("h-4 w-4", s.color)} />
                    <span className="text-xs text-text-muted">{s.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold">{s.value}</span>
                    <span className="text-xs text-green">{s.change}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 本日の予定 */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-sub mb-4 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            本日の予定
          </h2>
          <div className="space-y-3">
            {todaySchedule.map((s) => (
              <div key={s.time} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-xs font-medium text-accent">{s.time}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-text-muted">{s.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近の評価 */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-sub mb-4">最近の評価</h2>
          <div className="space-y-3">
            {recentEvaluations.map((e) => (
              <div key={e.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light text-[10px] font-bold text-accent">
                    {e.name[0]}
                  </div>
                  <span className="text-sm font-medium">{e.name}</span>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", scoreBadgeClass(e.score))}>
                  {e.score}点 - {e.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* スコア推移 */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-sub mb-4 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            スコア推移
          </h2>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-sub text-sm text-text-muted">
            グラフエリア
          </div>
        </div>
      </div>

      {/* Recent interviews table */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">最近の面接</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-sub text-left text-xs text-text-muted">
              <th className="px-5 py-2.5 font-medium">候補者</th>
              <th className="px-5 py-2.5 font-medium">質問セット</th>
              <th className="px-5 py-2.5 font-medium">ステータス</th>
              <th className="px-5 py-2.5 font-medium">スコア</th>
              <th className="px-5 py-2.5 font-medium">日時</th>
            </tr>
          </thead>
          <tbody>
            {recentInterviews.map((i, idx) => {
              const st = statusMap[i.status];
              return (
                <tr key={idx} className="border-b border-border-sub last:border-0 hover:bg-background transition-colors">
                  <td className="px-5 py-3 font-medium">{i.candidate}</td>
                  <td className="px-5 py-3 text-text-sub">{i.questionSet}</td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", st.className)}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">{i.score !== null ? `${i.score}点` : "-"}</td>
                  <td className="px-5 py-3 text-text-muted">{i.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
