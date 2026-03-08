"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "@/components/ui/date-picker";
import type { Candidate } from "@/types";

interface QSOption {
  id: string;
  title: string;
  questions?: { id: string }[];
}

export default function NewInterviewPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questionSets, setQuestionSets] = useState<QSOption[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [selectedQS, setSelectedQS] = useState<Set<string>>(new Set());
  const [deadlineAt, setDeadlineAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Result after creation
  const [created, setCreated] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/candidates").then((r) => r.json()),
      fetch("/api/question-sets").then((r) => r.json()),
    ]).then(([cands, qsList]) => {
      if (Array.isArray(cands)) setCandidates(cands);
      if (Array.isArray(qsList)) setQuestionSets(qsList);
    });
  }, []);

  const toggleQS = (id: string) => {
    setSelectedQS((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedCandidate || selectedQS.size === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: selectedCandidate,
          question_set_ids: Array.from(selectedQS),
          deadline_at: deadlineAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "面接の作成に失敗しました。");
        return;
      }
      setCreated(true);
    } catch {
      alert("作成中にエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/dashboard/interviews" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors">
        <ArrowLeft className="h-4 w-4" />
        面接一覧に戻る
      </Link>

      <h1 className="text-xl font-bold">新規面接作成</h1>

      {created ? (
        /* 作成完了 */
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
          <div className="rounded-lg bg-green-bg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green shrink-0" />
            <div>
              <p className="text-sm font-medium text-green">面接が作成されました</p>
              <p className="text-xs text-green/80 mt-0.5">候補者のポータル画面に面接が表示されます。</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/interviews"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              面接一覧へ
            </Link>
            <button
              onClick={() => {
                setCreated(false);
                setSelectedCandidate("");
                setSelectedQS(new Set());
                setDeadlineAt("");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-sub hover:bg-background transition-colors"
            >
              もう1件作成
            </button>
          </div>
        </div>
      ) : (
        /* 作成フォーム */
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-6">
          {/* 候補者選択 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">候補者選択</label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            >
              <option value="">候補者を選択...</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          {/* 質問セット選択 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">質問セット選択</label>
            {questionSets.length === 0 ? (
              <div className="text-sm text-text-muted">
                質問セットがまだ作成されていません。
                <Link href="/dashboard/question-sets/new" className="text-accent hover:underline ml-1">作成する</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {questionSets.map((qs, idx) => (
                  <label
                    key={qs.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-background cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedQS.has(qs.id)}
                      onChange={() => toggleQS(qs.id)}
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium">{qs.title}</span>
                    </div>
                    <span className="text-xs text-text-muted">{qs.questions?.length ?? 0}問</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 回答期限 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">回答期限（任意）</label>
            <DateTimePicker
              value={deadlineAt}
              onChange={setDeadlineAt}
              placeholder="回答期限を選択"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedCandidate || selectedQS.size === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            {submitting ? "作成中..." : "面接を作成"}
          </button>
        </div>
      )}
    </div>
  );
}
