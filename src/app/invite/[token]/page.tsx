"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Video } from "lucide-react";

export default function InviteGatewayPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.token as string;
    if (!token) {
      setError("このリンクは無効です。招待メールを確認してください。");
      return;
    }

    const handleRedirect = async () => {
      const res = await fetch(`/api/invitations/by-token?token=${token}`);

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "already_accepted") {
          // 既に使用済み → ログインページへ
          router.replace("/login?redirect=/portal");
          return;
        }
        setError("このリンクは無効です。招待メールを確認してください。");
        return;
      }

      // 候補者サインアップページへリダイレクト
      router.replace(`/candidate-signup?token=${token}`);
    };

    handleRedirect();
  }, [params.token, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-500">
            <Video className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            InterviewAI
          </span>
        </div>
        <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-sm p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow mx-auto mb-4" />
          <h1 className="text-lg font-bold text-foreground mb-2">
            無効なリンクです
          </h1>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-500">
          <Video className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          InterviewAI
        </span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
        <p className="text-sm text-text-muted">リダイレクト中...</p>
      </div>
    </div>
  );
}
