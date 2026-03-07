"use client";

import type { Evaluation, Question } from "@/types";
import { cn } from "@/lib/utils";

interface EvaluationSummaryProps {
  evaluations: Evaluation[];
  questions: Question[];
}

function scoreColorClass(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 4) return "text-green-600";
  if (score >= 3) return "text-yellow-600";
  return "text-red-500";
}

function barColorClass(score: number | null): string {
  if (score === null) return "bg-gray-200";
  if (score >= 4) return "bg-green-500";
  if (score >= 3) return "bg-yellow-500";
  return "bg-red-500";
}

function scoreBgClass(score: number | null): string {
  if (score === null) return "bg-gray-100";
  if (score >= 4) return "bg-green-bg";
  if (score >= 3) return "bg-yellow-bg";
  return "bg-red-100";
}

export function EvaluationSummary({ evaluations, questions }: EvaluationSummaryProps) {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Calculate overall AI score
  const scoredEvals = evaluations.filter((ev) => ev.ai_score !== null);
  const overallScore =
    scoredEvals.length > 0
      ? Math.round((scoredEvals.reduce((sum, ev) => sum + (ev.ai_score ?? 0), 0) / scoredEvals.length) * 10) / 10
      : null;

  if (evaluations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-text-muted">AI評価データがありません。面接の完了後に表示されます。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold text-text-sub mb-4">総合AI評価</h3>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={cn("text-4xl font-extrabold", scoreColorClass(overallScore))}>
              {overallScore !== null ? overallScore.toFixed(1) : "-"}
            </div>
            <p className="text-xs text-text-muted mt-1">/ 5.0</p>
          </div>
          <div className="flex-1">
            {/* Score visualization */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={cn(
                    "h-4 w-4 rounded-full transition-colors",
                    overallScore !== null && n <= Math.round(overallScore)
                      ? "bg-accent"
                      : "bg-gray-200"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {scoredEvals.length}問中{scoredEvals.filter((e) => (e.ai_score ?? 0) >= 4).length}問が高評価 (4以上)
            </p>
          </div>
        </div>
      </div>

      {/* Per-question scores */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-sub">質問別スコア</h3>

        {evaluations.map((ev, idx) => {
          const question = ev.question_id ? questionMap.get(ev.question_id) : null;
          const score = ev.ai_score;
          const barWidth = score !== null ? (score / 5) * 100 : 0;

          return (
            <div key={ev.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-sub truncate max-w-[70%]">
                  Q{idx + 1}. {question?.content ?? "全体評価"}
                </span>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  scoreBgClass(score),
                  scoreColorClass(score)
                )}>
                  {score !== null ? `${score} / 5` : "-"}
                </span>
              </div>

              {/* Horizontal bar */}
              <div className="h-2 rounded-full bg-background overflow-hidden">
                <div
                  className={cn("h-2 rounded-full transition-all duration-500", barColorClass(score))}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* AI Comment */}
              {ev.ai_comment && (
                <p className="text-xs text-text-muted pl-2 border-l-2 border-accent/30">
                  {ev.ai_comment}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
