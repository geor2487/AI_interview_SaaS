"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Evaluation, Question } from "@/types";
import { cn } from "@/lib/utils";

interface ManualEvaluationProps {
  interviewId: string;
  evaluations: Evaluation[];
  questions: Question[];
}

interface EvalFormState {
  manual_score: number | null;
  manual_comment: string;
}

export function ManualEvaluation({ interviewId, evaluations, questions }: ManualEvaluationProps) {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const initialState: Record<string, EvalFormState> = {};
  evaluations.forEach((ev) => {
    initialState[ev.id] = {
      manual_score: ev.manual_score,
      manual_comment: ev.manual_comment ?? "",
    };
  });

  const [formState, setFormState] = useState<Record<string, EvalFormState>>(initialState);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const updateField = useCallback(
    (evalId: string, field: keyof EvalFormState, value: number | string | null) => {
      setFormState((prev) => ({
        ...prev,
        [evalId]: { ...prev[evalId], [field]: value },
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSavedMessage(null);

    const supabase = createClient();

    try {
      const updates = Object.entries(formState).map(([evalId, state]) =>
        supabase
          .from("evaluations")
          .update({
            manual_score: state.manual_score,
            manual_comment: state.manual_comment || null,
          })
          .eq("id", evalId)
          .eq("interview_id", interviewId)
      );

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        setSavedMessage("保存中にエラーが発生しました");
      } else {
        setSavedMessage("保存しました");
        setTimeout(() => setSavedMessage(null), 3000);
      }
    } catch {
      setSavedMessage("保存中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  }, [formState, interviewId]);

  if (evaluations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-text-muted">評価データがありません。AI面接の完了後に表示されます。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evaluations.map((ev) => {
        const question = ev.question_id ? questionMap.get(ev.question_id) : null;
        const state = formState[ev.id];
        if (!state) return null;

        return (
          <div key={ev.id} className="rounded-lg border border-border bg-surface p-5 space-y-4">
            {/* Question */}
            <div>
              <h3 className="text-sm font-semibold text-text-sub">
                {question ? question.content : "全体評価"}
              </h3>
              {question?.evaluation_criteria && (
                <p className="text-xs text-text-muted mt-1">評価基準: {question.evaluation_criteria}</p>
              )}
            </div>

            {/* AI Evaluation (read-only) */}
            <div className="rounded-md bg-accent-light/50 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-accent">AI評価</span>
                <span className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded",
                  ev.ai_score !== null && ev.ai_score >= 4 ? "bg-green-bg text-green" :
                  ev.ai_score !== null && ev.ai_score >= 3 ? "bg-yellow-bg text-yellow" :
                  ev.ai_score !== null ? "bg-red-100 text-red-600" :
                  "bg-gray-100 text-gray-500"
                )}>
                  {ev.ai_score !== null ? `${ev.ai_score} / 5` : "-"}
                </span>
              </div>
              {ev.ai_comment && (
                <p className="text-xs text-text-sub">{ev.ai_comment}</p>
              )}
            </div>

            {/* Manual Score */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-sub">面接官スコア</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => updateField(ev.id, "manual_score", state.manual_score === score ? null : score)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold transition-colors",
                      state.manual_score === score
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-background text-text-muted hover:border-accent/50 hover:text-accent"
                    )}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Comment */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-sub">面接官コメント</label>
              <textarea
                value={state.manual_comment}
                onChange={(e) => updateField(ev.id, "manual_comment", e.target.value)}
                placeholder="補足コメントを入力..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 resize-none"
              />
            </div>
          </div>
        );
      })}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors",
            saving
              ? "bg-accent/50 cursor-not-allowed"
              : "bg-accent hover:bg-accent/90"
          )}
        >
          {saving ? "保存中..." : "評価を保存"}
        </button>
        {savedMessage && (
          <span className={cn(
            "text-sm font-medium",
            savedMessage.includes("エラー") ? "text-red-500" : "text-green-600"
          )}>
            {savedMessage}
          </span>
        )}
      </div>
    </div>
  );
}
