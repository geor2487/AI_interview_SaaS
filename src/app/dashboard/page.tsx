"use client";

import { useEffect, useState } from "react";
import { Calendar, TrendingUp, Users, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import { ScoreChart } from "@/components/dashboard/score-chart";

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

interface DashboardStats {
  inProgress: number;
  candidatesThisMonth: number;
  completed: number;
  avgScore: number | null;
}

interface RecentInterview {
  id: string;
  status: string;
  created_at: string;
  candidate: { name: string } | null;
}

interface RecentEvaluation {
  ai_score: number | null;
  interview_id: string;
  created_at: string;
  interview: { candidate: { name: string } | null } | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const fullName = user?.user_metadata?.full_name ?? "ユーザー";
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  const [stats, setStats] = useState<DashboardStats>({
    inProgress: 0,
    candidatesThisMonth: 0,
    completed: 0,
    avgScore: null,
  });
  const [recentInterviews, setRecentInterviews] = useState<RecentInterview[]>([]);
  const [recentEvaluations, setRecentEvaluations] = useState<RecentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const supabase = createClient();

      const [interviewsRes, candidatesRes, evaluationsRes] = await Promise.all([
        supabase
          .from("interviews")
          .select("id, status, created_at, candidate:candidates(name)")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("candidates")
          .select("id, created_at")
          .eq("organization_id", orgId),
        supabase
          .from("evaluations")
          .select("ai_score, interview_id, created_at")
          .not("ai_score", "is", null)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const interviews = (interviewsRes.data ?? []) as unknown as RecentInterview[];
      const candidates = candidatesRes.data ?? [];
      const evaluations = evaluationsRes.data ?? [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const candidatesThisMonth = candidates.filter(
        (c) => c.created_at >= monthStart
      ).length;

      const allInterviews = interviews;
      const inProgress = allInterviews.filter((i) => i.status === "in_progress").length;
      const completed = allInterviews.filter(
        (i) => i.status === "completed" || i.status === "evaluated"
      ).length;

      const scores = evaluations
        .map((e) => e.ai_score)
        .filter((s): s is number => s !== null);
      const avgScore =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null;

      setStats({ inProgress, candidatesThisMonth, completed, avgScore });
      setRecentInterviews(interviews);
      setRecentEvaluations(evaluations as RecentEvaluation[]);
      setLoading(false);
    };

    fetchData();
  }, [orgId]);

  const statItems = [
    { label: "進行中の面接", value: String(stats.inProgress), icon: Clock, color: "text-accent" },
    { label: "今月の候補者", value: String(stats.candidatesThisMonth), icon: Users, color: "text-blue-600" },
    { label: "完了した面接", value: String(stats.completed), icon: CheckCircle2, color: "text-green" },
    { label: "平均スコア", value: stats.avgScore !== null ? String(stats.avgScore) : "-", icon: TrendingUp, color: "text-yellow" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-accent to-purple-500 p-6 text-white">
        <h1 className="text-xl font-bold">おはようございます、{fullName}さん</h1>
        <p className="mt-1 text-sm text-white/80">{dateStr}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-sub mb-4">パイプライン</h2>
          {loading ? (
            <p className="text-sm text-text-muted">データがありません</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {statItems.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("h-4 w-4", s.color)} />
                      <span className="text-xs text-text-muted">{s.label}</span>
                    </div>
                    <span className="text-2xl font-bold">{s.value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* スコア推移 */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-sub mb-4 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            スコア推移
          </h2>
          {recentEvaluations.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-sub text-sm text-text-muted">
              評価データがありません
            </div>
          ) : (
            <ScoreChart
              scores={[...recentEvaluations].reverse().map((ev) => ({
                score: ev.ai_score ?? 0,
                label: new Date(ev.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" }),
              }))}
            />
          )}
        </div>
      </div>

      {/* Recent interviews table */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">最近の面接</h2>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-text-muted">面接データがありません</div>
        ) : recentInterviews.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-text-muted">
            面接データがありません。「面接」メニューから新規作成してください。
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-sub text-left text-xs text-text-muted">
                <th className="px-5 py-2.5 font-medium">候補者</th>
                <th className="px-5 py-2.5 font-medium">ステータス</th>
                <th className="px-5 py-2.5 font-medium">日時</th>
              </tr>
            </thead>
            <tbody>
              {recentInterviews.map((i) => {
                const st = statusMap[i.status] ?? { label: i.status, className: "bg-gray-100 text-gray-600" };
                const candidateName = (i.candidate as unknown as { name: string } | null)?.name ?? "不明";
                return (
                  <tr key={i.id} className="border-b border-border-sub last:border-0 hover:bg-background transition-colors">
                    <td className="px-5 py-3 font-medium">{candidateName}</td>
                    <td className="px-5 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", st.className)}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {new Date(i.created_at).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
