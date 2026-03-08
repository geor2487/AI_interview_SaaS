"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function CandidateSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm flex flex-col items-center py-20">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
        </div>
      }
    >
      <CandidateSignupForm />
    </Suspense>
  );
}

function CandidateSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailEditable, setEmailEditable] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [tokenError, setTokenError] = useState("");

  // トークン検証
  useEffect(() => {
    if (!token) {
      setTokenError("招待トークンが見つかりません。URLを確認してください。");
      setValidating(false);
      return;
    }

    fetch(`/api/invitations/by-token?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (data.error === "already_accepted") {
            setTokenError("この招待は既に使用されています。ログインしてください。");
          } else {
            setTokenError("無効な招待リンクです。招待メールを確認してください。");
          }
          return;
        }
        const isPlaceholder = data.email?.includes("@placeholder.local");
        setEmail(isPlaceholder ? "" : data.email);
        setEmailEditable(isPlaceholder);
        setOrgName(data.organization_name);
      })
      .catch(() => {
        setTokenError("招待の確認中にエラーが発生しました。");
      })
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("パスワードが一致しません。");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/candidate-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, invite_token: token }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/portal/profile?setup=true");
    } catch (err) {
      setError(
        "登録中にエラーが発生しました: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
    "placeholder:text-text-muted",
    "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
    "transition-colors"
  );

  if (validating) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center py-20">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
        <p className="mt-3 text-sm text-text-muted">招待を確認中...</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">InterviewAI</h1>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm text-center">
          <p className="text-sm text-text-sub mb-4">{tokenError}</p>
          <Link
            href="/login?redirect=/portal"
            className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground">InterviewAI</h1>
      </div>

      {/* Card */}
      <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground text-center mb-1">
          面接アカウント作成
        </h2>
        <p className="text-sm text-text-sub text-center mb-6">
          {orgName
            ? `${orgName}から招待されています`
            : "アカウントを作成してください"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              氏名
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              readOnly={!emailEditable}
              onChange={emailEditable ? (e) => setEmail(e.target.value) : undefined}
              placeholder="email@example.com"
              className={cn(inputClass, !emailEditable && "bg-gray-50 text-text-muted cursor-not-allowed")}
            />
            {!emailEditable && (
              <p className="mt-1 text-xs text-text-muted">
                招待されたメールアドレスは変更できません
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              パスワード確認
            </label>
            <input
              id="passwordConfirm"
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="もう一度入力"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white",
              "hover:bg-accent/90 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-accent/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? "登録中..." : "アカウントを作成"}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-text-sub">
        既にアカウントをお持ちですか？{" "}
        <Link
          href={`/login?redirect=/portal`}
          className="font-medium text-accent hover:text-accent-text transition-colors"
        >
          ログイン
        </Link>
      </p>
    </div>
  );
}
