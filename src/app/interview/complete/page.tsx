"use client";

import { Video, CheckCircle2, Clock, HelpCircle } from "lucide-react";

export default function InterviewCompletePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Branding */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-500">
          <Video className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">InterviewAI</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center">
          {/* Success Icon */}
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, #059669, #10b981)",
              boxShadow: "0 8px 32px rgba(5,150,105,0.25)",
            }}
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-foreground">面接が完了しました</h1>
          <p className="mt-2 text-sm text-text-muted">ご参加ありがとうございました。</p>

          {/* Summary */}
          <div className="w-full mt-8 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border-sub bg-background px-4 py-3">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-sub">質問数</span>
              </div>
              <span className="text-sm font-semibold text-foreground">10問</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border-sub bg-background px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-sub">所要時間</span>
              </div>
              <span className="text-sm font-semibold text-foreground">約15分</span>
            </div>
          </div>

          {/* Note */}
          <div className="w-full mt-6 rounded-lg bg-accent-light px-4 py-3">
            <p className="text-sm text-accent-text">
              結果については担当者よりご連絡いたします。
            </p>
          </div>

          {/* Link */}
          <a
            href="/portal"
            className="mt-8 inline-flex items-center justify-center h-10 px-6 rounded-lg text-sm font-medium text-accent hover:text-accent-text hover:bg-accent-light transition-colors"
          >
            マイページに戻る
          </a>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-text-muted">
        InterviewAI &copy; 2026. All rights reserved.
      </p>
    </div>
  );
}
