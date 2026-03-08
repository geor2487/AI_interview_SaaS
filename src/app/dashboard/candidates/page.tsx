"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Candidate, CandidateStatus } from "@/types";

const tabs: { label: string; value: CandidateStatus | "all" }[] = [
  { label: "全て", value: "all" },
  { label: "招待済", value: "invited" },
  { label: "予定済", value: "scheduled" },
  { label: "面接済", value: "interviewed" },
  { label: "評価済", value: "evaluated" },
  { label: "合格", value: "accepted" },
  { label: "不合格", value: "rejected" },
];

const statusBadge: Record<CandidateStatus, { label: string; className: string }> = {
  invited: { label: "招待済", className: "bg-gray-100 text-gray-600" },
  scheduled: { label: "予定済", className: "bg-yellow-bg text-yellow" },
  interviewed: { label: "面接済", className: "bg-accent-light text-accent" },
  evaluated: { label: "評価済", className: "bg-green-bg text-green" },
  rejected: { label: "不合格", className: "bg-red-bg text-red" },
  accepted: { label: "合格", className: "bg-green-bg text-green" },
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CandidateStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchCandidates = () => {
    fetch("/api/candidates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filtered = candidates.filter((c) => {
    if (activeTab !== "all" && c.status !== activeTab) return false;
    if (search && !c.name.includes(search) && !c.email.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">候補者一覧</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新規追加
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.value
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-sub"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="氏名・メールで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-text-muted">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-text-muted">
            {candidates.length === 0 ? "候補者がまだ登録されていません。" : "該当する候補者が見つかりません。"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-sub text-left text-xs text-text-muted">
                <th className="px-5 py-3 font-medium">氏名 / メール</th>
                <th className="px-5 py-3 font-medium">希望ポジション</th>
                <th className="px-5 py-3 font-medium">ステータス</th>
                <th className="px-5 py-3 font-medium">登録日</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const badge = statusBadge[c.status];
                return (
                  <tr key={c.id} className="border-b border-border-sub last:border-0 hover:bg-background transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/candidates/${c.id}`} className="hover:text-accent transition-colors">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-text-muted">{c.email}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-text-sub">{c.desired_position ?? "-"}</td>
                    <td className="px-5 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", badge.className)}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {new Date(c.created_at).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Candidate Modal */}
      {showModal && (
        <AddCandidateModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            setLoading(true);
            fetchCandidates();
          }}
        />
      )}
    </div>
  );
}

function AddCandidateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [desiredPosition, setDesiredPosition] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, desired_position: desiredPosition }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "登録に失敗しました。");
        return;
      }
      onCreated();
    } catch {
      alert("登録中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">候補者を追加</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-background text-text-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1">
              氏名 <span className="text-red">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 山田太郎"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1">
              メールアドレス <span className="text-red">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例: taro@example.com"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1">希望ポジション</label>
            <input
              type="text"
              value={desiredPosition}
              onChange={(e) => setDesiredPosition(e.target.value)}
              placeholder="例: フロントエンドエンジニア"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-sub hover:bg-background transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || !name || !email}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "登録中..." : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
