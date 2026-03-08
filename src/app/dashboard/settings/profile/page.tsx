"use client";

import { useEffect, useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/settings"
          className="rounded-lg p-1.5 hover:bg-accent-light/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-text-sub" />
        </Link>
        <h1 className="text-xl font-bold">プロフィール</h1>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-xl font-bold text-white">
            {fullName?.[0] ?? "U"}
          </div>
          <div>
            <p className="text-base font-semibold">{fullName || "ユーザー"}</p>
            <p className="text-sm text-text-muted">{email}</p>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">名前</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">メールアドレス</label>
            <input
              type="email"
              value={email}
              disabled
              className={`${inputClass} opacity-60 cursor-not-allowed`}
            />
            <p className="mt-1 text-xs text-text-muted">メールアドレスは変更できません</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : "保存する"}
          </button>
          {saved && <span className="text-sm text-green">保存しました</span>}
        </div>
      </div>
    </div>
  );
}
