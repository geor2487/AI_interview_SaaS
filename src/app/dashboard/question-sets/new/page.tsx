"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Save, Sparkles, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
interface QuestionDraft {
  id: string;
  content: string;
  evaluation_criteria: string;
}

export default function NewQuestionSetPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  // AI generation
  const [position, setPosition] = useState("");
  const [level, setLevel] = useState("mid");
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition";

  const handleGenerate = async () => {
    if (!position) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/question-sets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position, level, count }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }

      if (data.title && !title) setTitle(data.title);
      if (data.description && !description) setDescription(data.description);

      const generated: QuestionDraft[] = (data.questions ?? []).map(
        (q: { content: string; evaluation_criteria: string }) => ({
          id: crypto.randomUUID(),
          content: q.content,
          evaluation_criteria: q.evaluation_criteria,
        })
      );
      setQuestions((prev) => [...prev, ...generated]);
    } catch {
      alert("生成に失敗しました。");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title) {
      alert("タイトルを入力してください。");
      return;
    }
    if (questions.length === 0) {
      alert("質問を追加してください。");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/question-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          questions: questions.map((q) => ({
            content: q.content,
            evaluation_criteria: q.evaluation_criteria,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "保存に失敗しました。");
        return;
      }
      router.push("/dashboard/question-sets");
    } catch (e) {
      console.error("handleSave error:", e);
      alert("保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  const addManualQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), content: "", evaluation_criteria: "" },
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: "content" | "evaluation_criteria", value: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <Link href="/dashboard/question-sets" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors">
        <ArrowLeft className="h-4 w-4" />
        質問セット一覧に戻る
      </Link>

      <h1 className="text-xl font-bold">新規質問セット作成</h1>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: Settings */}
        <div className="col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 sticky top-6">
            <h2 className="text-sm font-semibold">基本設定</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: フロントエンド基礎"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">説明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="質問セットの説明を入力..."
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                />
              </div>
            </div>

            {/* AI Generation */}
            <div className="border-t border-border pt-4 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-accent" />
                AIで質問を生成
              </h2>
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">職種</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="例: フロントエンドエンジニア"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">レベル</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
                  <option value="junior">ジュニア（1-2年目）</option>
                  <option value="mid">ミドル（3-5年）</option>
                  <option value="senior">シニア（5年以上）</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">質問数</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  min={1}
                  max={20}
                  className={inputClass}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !position}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-purple-500 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? "生成中..." : "AIで生成する"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Questions */}
        <div className="col-span-3 space-y-3">
          <h2 className="text-sm font-semibold">質問一覧 ({questions.length}問)</h2>

          {questions.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-surface p-8 text-center">
              <p className="text-sm text-text-muted mb-3">まだ質問がありません</p>
              <p className="text-xs text-text-muted">左のパネルからAIで生成するか、手動で追加してください</p>
            </div>
          ) : (
            questions.map((q, i) => (
              <div key={q.id} className="rounded-2xl border border-border bg-surface p-4 group hover:border-accent/30 transition">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1 pt-0.5">
                    <GripVertical className="h-4 w-4 text-text-muted" />
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <textarea
                      value={q.content}
                      onChange={(e) => updateQuestion(q.id, "content", e.target.value)}
                      placeholder="質問文を入力..."
                      rows={2}
                      className={cn(inputClass, "resize-none")}
                    />
                    <div className="rounded-md bg-background px-3 py-2">
                      <label className="text-xs font-medium text-text-sub">評価基準</label>
                      <textarea
                        value={q.evaluation_criteria}
                        onChange={(e) => updateQuestion(q.id, "evaluation_criteria", e.target.value)}
                        placeholder="評価基準を入力..."
                        rows={2}
                        className={cn(inputClass, "resize-none mt-1 border-0 bg-transparent p-0 focus:ring-0")}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="rounded-md p-1.5 hover:bg-red-bg text-text-muted hover:text-red transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            onClick={addManualQuestion}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
            手動で質問を追加
          </button>

          {/* Save */}
          {questions.length > 0 && (
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving || !title}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? "保存中..." : "質問セットを保存"}
              </button>
              {!title && (
                <p className="text-xs text-text-muted mt-2">保存するにはタイトルを入力してください</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
