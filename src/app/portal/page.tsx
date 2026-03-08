"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video,
  Clock,
  ChevronRight,
  MessageSquare,
  Pencil,
  Building2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  formatDeadline,
  formatDeadlineDate,
  isDeadlineExpired,
  canStartInterview,
} from "@/lib/interview/deadline";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { InterviewStatus } from "@/types";

interface InterviewRow {
  id: string;
  status: InterviewStatus;
  deadline_at: string | null;
  created_at: string;
  organization_id: string;
  org_name?: string;
}

const statusConfig: Record<
  InterviewStatus,
  { label: string; color: string }
> = {
  pending: {
    label: "未受験",
    color: "bg-yellow-bg text-yellow border-yellow/20",
  },
  in_progress: {
    label: "進行中",
    color: "bg-accent-light text-accent-text border-accent/20",
  },
  completed: {
    label: "完了",
    color: "bg-green-bg text-green border-green/20",
  },
  evaluated: {
    label: "評価済",
    color: "bg-green-bg text-green border-green/20",
  },
};

export default function PortalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fullName = user?.user_metadata?.full_name ?? "ユーザー";

  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    (async () => {
      // 1. Get candidate record
      const { data: candidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!candidate) {
        setLoading(false);
        return;
      }

      // 2. Get interviews
      const { data: interviewRows } = await supabase
        .from("interviews")
        .select("id, status, deadline_at, created_at, organization_id")
        .eq("candidate_id", candidate.id)
        .order("created_at", { ascending: false });

      if (!interviewRows || interviewRows.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Get organization names
      const orgIds = [...new Set(interviewRows.map((i) => i.organization_id))];
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", orgIds);

      const orgMap = new Map(
        (orgs ?? []).map((o) => [o.id, o.name as string])
      );

      const mapped: InterviewRow[] = interviewRows.map((row) => ({
        ...row,
        org_name: orgMap.get(row.organization_id) ?? "不明な企業",
      }));

      setInterviews(mapped);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          こんにちは、{fullName}さん
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          選考の進捗と今後の予定を確認できます
        </p>
      </div>

      {/* Interview List */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">
          面接一覧
        </h2>

        {loading ? (
          <LoadingScreen />
        ) : interviews.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-2">
            <p className="text-sm text-text-muted">
              まだ面接は作成されていません
            </p>
            <p className="text-xs text-text-muted">
              企業の担当者が面接を作成すると、こちらに表示されます。
              <br />
              まずはプロフィールを充実させてお待ちください。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => {
              const status = statusConfig[interview.status];
              const expired = isDeadlineExpired(interview.deadline_at);
              const startCheck = canStartInterview(
                interview.status,
                interview.deadline_at
              );

              return (
                <div
                  key={interview.id}
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Company Name */}
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-text-sub shrink-0" />
                        <span className="text-sm font-semibold text-foreground truncate">
                          {interview.org_name}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            status.color
                          )}
                        >
                          {status.label}
                        </span>
                      </div>

                      {/* Deadline */}
                      {interview.deadline_at && (
                        <div className="flex items-center gap-2">
                          <Clock
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              expired ? "text-red" : "text-text-sub"
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs",
                              expired
                                ? "text-red font-medium"
                                : "text-text-sub"
                            )}
                          >
                            {expired
                              ? "期限切れ"
                              : `${formatDeadlineDate(interview.deadline_at)}（${formatDeadline(interview.deadline_at)}）`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Start Button */}
                    <div className="shrink-0 relative group">
                      <button
                        onClick={() =>
                          router.push(
                            `/portal/interviews/${interview.id}/lobby`
                          )
                        }
                        disabled={!startCheck.allowed}
                        className={cn(
                          "h-9 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5 transition-all",
                          startCheck.allowed
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30"
                            : "bg-gray-300 cursor-not-allowed text-gray-500"
                        )}
                      >
                        <Video className="h-3.5 w-3.5" />
                        面接を開始
                      </button>
                      {!startCheck.allowed && startCheck.reason && (
                        <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover:block">
                          <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-2 shadow-lg whitespace-nowrap">
                            <AlertCircle className="h-3.5 w-3.5 text-text-muted shrink-0" />
                            <span className="text-xs text-text-sub">
                              {startCheck.reason}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            プロフィール
          </h2>
          <p className="text-sm text-text-sub mb-3">
            プロフィールの情報を充実させると、選考に有利になります。
          </p>
          <Link
            href="/portal/profile"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-text transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            プロフィールを編集
          </Link>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            メッセージ
          </h2>
          <p className="text-sm text-text-sub mb-3">
            企業からのメッセージを確認できます。
          </p>
          <Link
            href="/portal/messages"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-text transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            メッセージを確認
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
