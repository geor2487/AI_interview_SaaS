"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("ログイン中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

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
        <h2 className="text-lg font-semibold text-foreground text-center mb-6">
          ログイン
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(
                "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
                "placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                "transition-colors"
              )}
            />
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
              placeholder="********"
              className={cn(
                "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
                "placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                "transition-colors"
              )}
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
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-text-sub">
        アカウントをお持ちでない方は{" "}
        <Link
          href="/signup"
          className="font-medium text-accent hover:text-accent-text transition-colors"
        >
          新規登録
        </Link>
      </p>
    </div>
  );
}
