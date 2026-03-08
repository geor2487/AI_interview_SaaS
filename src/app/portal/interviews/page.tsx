"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Clock,
  Building2,
  AlertCircle,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import {
  formatDeadline,
  formatDeadlineDate,
  isDeadlineExpired,
  canStartInterview,
} from "@/lib/interview/deadline";
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

export default function InterviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/portal/interviews");
        if (res.ok) {
          const data = await res.json();
          setInterviews(Array.isArray(data) ? data : []);
        } else {
          const errData = await res.json().catch(() => null);
          console.error("面接取得エラー:", res.status, errData);
          setError("面接情報の取得に失敗しました。ページを再読み込みしてください。");
        }
      } catch (err) {
        console.error("面接取得エラー:", err);
        setError("面接情報の取得に失敗しました。ページを再読み込みしてください。");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">面接一覧</h1>
        <p className="mt-1 text-sm text-text-muted">
          すべての面接を確認できます
        </p>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <div className="rounded-2xl border border-red/20 bg-red-bg p-8 text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-red mx-auto" />
          <p className="text-sm text-red">{error}</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-2">
          <p className="text-sm text-text-muted">
            まだ面接は作成されていません
          </p>
          <p className="text-xs text-text-muted">
            企業の担当者が面接を作成すると、こちらに表示されます。
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
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-text-sub shrink-0" />
                      <span className="text-sm font-semibold text-foreground truncate">
                        {interview.org_name}
                      </span>
                    </div>

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
  );
}
