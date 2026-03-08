"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/hooks/use-organization";
import { getCandidates } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import type { Candidate, QuestionSet } from "@/types";

export default function NewInterviewPage() {
  const router = useRouter();
  const { orgId } = useOrganization();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questionSets, setQuestionSets] = useState<(QuestionSet & { questions?: { id: string }[] })[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [selectedQS, setSelectedQS] = useState<Set<string>>(new Set());
  const [scheduledAt, setScheduledAt] = useState("");
  const [inviteMethod, setInviteMethod] = useState<"email" | "link">("email");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    const supabase = createClient();
    getCandidates(orgId).then(({ data }) => setCandidates(data ?? []));
    supabase
      .from("question_sets")
      .select("*, questions(id)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setQuestionSets(data ?? []));
  }, [orgId]);

  const toggleQS = (id: string) => {
    setSelectedQS((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!orgId || !selectedCandidate || selectedQS.size === 0) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: interview, error } = await supabase
      .from("interviews")
      .insert({
        organization_id: orgId,
        candidate_id: selectedCandidate,
        scheduled_at: scheduledAt || null,
      })
      .select()
      .single();

    if (error || !interview) {
      setSubmitting(false);
      return;
    }

    const junctionRows = Array.from(selectedQS).map((qsId, index) => ({
      interview_id: interview.id,
      question_set_id: qsId,
      order_index: index,
    }));

    await supabase.from("interview_question_sets").insert(junctionRows);
    router.push("/dashboard/interviews");
  };

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
          <select
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
          >
            <option value="">候補者を選択...</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 質問セット選択 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">質問セット選択</label>
          {questionSets.length === 0 ? (
            <p className="text-sm text-text-muted">質問セットがまだ作成されていません。</p>
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

        {/* 面接日時 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">面接日時</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
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
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedCandidate || selectedQS.size === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {submitting ? "作成中..." : "面接を作成"}
        </button>
      </div>
    </div>
  );
}
