"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, GripVertical, Pencil, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Question } from "@/types";

interface QSData {
  id: string;
  title: string;
  description: string;
}

export default function QuestionSetDetailPage() {
  const params = useParams();
  const qsId = params.id as string;
  const [qs, setQs] = useState<QSData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/question-sets/${qsId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setQs(data);
          setTitle(data.title);
          setDescription(data.description);
          const sorted = (data.questions ?? []).sort(
            (a: Question, b: Question) => a.order_index - b.order_index
          );
          setQuestions(sorted);
        }
      })
      .finally(() => setLoading(false));
  }, [qsId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/question-sets/${qsId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "保存に失敗しました。");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-text-muted p-6">読み込み中...</p>;
  }

  if (!qs) {
    return <p className="text-sm text-text-muted p-6">質問セットが見つかりません。</p>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <Link href="/dashboard/question-sets" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors">
        <ArrowLeft className="h-4 w-4" />
        質問セット一覧に戻る
      </Link>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: Settings */}
        <div className="col-span-2">
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4 sticky top-6">
            <h2 className="text-sm font-semibold">基本設定</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">説明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition resize-none"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Questions */}
        <div className="col-span-3 space-y-3">
          <h2 className="text-sm font-semibold">質問一覧 ({questions.length}問)</h2>
          {questions.length === 0 ? (
            <p className="text-sm text-text-muted">質問がまだ追加されていません。</p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="rounded-lg border border-border bg-surface p-4 group hover:border-accent/30 transition">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1 pt-0.5">
                    <GripVertical className="h-4 w-4 text-text-muted cursor-grab" />
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                      {q.order_index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed">{q.content}</p>
                    {q.evaluation_criteria && (
                      <div className="mt-2 rounded-md bg-background px-3 py-2">
                        <p className="text-xs text-text-muted">
                          <span className="font-medium text-text-sub">評価基準:</span> {q.evaluation_criteria}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="rounded-md p-1.5 hover:bg-accent-light text-text-muted hover:text-accent transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded-md p-1.5 hover:bg-red-bg text-text-muted hover:text-red transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-text-muted hover:border-accent hover:text-accent transition-colors">
            <Plus className="h-4 w-4" />
            質問を追加
          </button>
        </div>
      </div>
    </div>
  );
}
