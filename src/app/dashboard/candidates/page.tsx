"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileUp, Loader2, Mail, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/loading-screen";
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？関連データもすべて削除されます。`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "削除に失敗しました。");
        return;
      }
      setCandidates((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("削除中にエラーが発生しました。");
    } finally {
      setDeleting(null);
    }
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent text-accent px-4 py-2 text-sm font-medium hover:bg-accent/5 transition-colors"
          >
            <Mail className="h-4 w-4" />
            メールで招待
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            新規追加
          </button>
        </div>
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
          className="w-full rounded-2xl border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <LoadingScreen />
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
                <th className="px-5 py-3 font-medium w-16"></th>
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
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deleting === c.id}
                        className="rounded-md p-1.5 text-text-muted hover:text-red hover:bg-red-bg transition-colors disabled:opacity-50"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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

      {/* Email Invite Modal */}
      {showInviteModal && (
        <InviteByEmailModal
          onClose={() => setShowInviteModal(false)}
          onSent={() => {
            setShowInviteModal(false);
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
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [desiredPosition, setDesiredPosition] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition";
  const labelClass = "block text-xs font-medium text-text-sub mb-1";

  const handleResumeUpload = async (file: File) => {
    setParsing(true);
    setParseError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/candidates/parse-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || "解析に失敗しました。");
        return;
      }
      if (data.name) setName(data.name);
      if (data.email) setEmail(data.email);
      if (data.phone) setPhone(data.phone);
      if (data.location) setLocation(data.location);
      if (data.desired_position) setDesiredPosition(data.desired_position);
      if (data.desired_salary) setDesiredSalary(data.desired_salary);
    } catch {
      setParseError("解析中にエラーが発生しました。");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          location,
          desired_position: desiredPosition,
          desired_salary: desiredSalary,
        }),
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
      <div className="w-full max-w-lg rounded-xl border border-border bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">候補者を追加</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-background text-text-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AI書類解析 */}
          <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent">AIで自動入力</span>
            </div>
            <p className="text-xs text-text-sub">履歴書・職務経歴書から自動でフォームを埋めます。</p>
            <div className="flex items-center gap-2">
              <label
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-surface px-3 py-1.5 text-xs font-medium text-accent cursor-pointer hover:bg-accent/10 transition-colors",
                  parsing && "opacity-50 pointer-events-none"
                )}
              >
                {parsing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileUp className="h-3.5 w-3.5" />
                )}
                {parsing ? "解析中..." : "ファイルを選択"}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  disabled={parsing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleResumeUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <span className="text-xs text-text-muted">PDF / Word / テキスト</span>
            </div>
            {parseError && <p className="text-xs text-red">{parseError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
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
              <label className={labelClass}>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>電話番号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="例: 090-1234-5678"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>居住地</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: 東京都渋谷区"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>希望ポジション</label>
              <input
                type="text"
                value={desiredPosition}
                onChange={(e) => setDesiredPosition(e.target.value)}
                placeholder="例: フロントエンドエンジニア"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>希望年収</label>
              <input
                type="text"
                value={desiredSalary}
                onChange={(e) => setDesiredSalary(e.target.value)}
                placeholder="例: 600万円〜800万円"
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-xs text-text-muted">※ 学歴・職歴・スキルなどは登録後に編集画面から追加できます。</p>
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

function InviteByEmailModal({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: () => void;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ url?: string; message?: string; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, method: "email" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.error || "送信に失敗しました。" });
        return;
      }
      setResult({ url: data.invite_url, message: data.message });
    } catch {
      setResult({ error: "送信中にエラーが発生しました。" });
    } finally {
      setSending(false);
    }
  };

  const [showLink, setShowLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleShowLink = async () => {
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined, method: "link" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.error || "リンク生成に失敗しました。" });
        return;
      }
      setGeneratedLink(data.invite_url);
      setShowLink(true);
    } catch {
      setResult({ error: "リンク生成中にエラーが発生しました。" });
    } finally {
      setSending(false);
    }
  };

  const handleCopyGeneratedLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-white/30 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">メールで招待</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-background text-text-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-text-sub mb-4">
          候補者のメールアドレスを入力して招待リンクを送信します。
          候補者は自分でアカウントを作成し、プロフィールを登録します。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1">
              メールアドレス <span className="text-red">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@example.com"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            />
          </div>

          {result?.error && (
            <div className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red">
              {result.error}
            </div>
          )}

          {result?.message && !result.error && (
            <div className="rounded-lg bg-green-bg px-3 py-2 text-sm text-green">
              {result.message}
              {result.url && (
                <p className="mt-1 text-xs break-all opacity-70">{result.url}</p>
              )}
            </div>
          )}

          {showLink && generatedLink && (
            <div className="rounded-lg border border-border bg-background p-3 space-y-2">
              <p className="text-xs font-medium text-text-sub">招待リンク</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 rounded-md border border-border bg-white px-2 py-1.5 text-xs text-text-sub outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyGeneratedLink}
                  className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors"
                >
                  {copied ? "コピー済" : "コピー"}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {result?.message && !result.error ? (
              <button
                type="button"
                onClick={onSent}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
              >
                閉じる
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleShowLink}
                  disabled={sending}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-sub hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  リンクを表示
                </button>
                <button
                  type="submit"
                  disabled={sending || !email}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "送信中..." : "招待メールを送信"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
