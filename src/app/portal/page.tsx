"use client";

import Link from "next/link";
import {
  FileText,
  Video,
  Users,
  Trophy,
  BarChart3,
  Calendar,
  Clock,
  ChevronRight,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { label: "書類提出", icon: FileText, done: true },
  { label: "一次面接", icon: Video, done: true },
  { label: "二次面接", icon: Users, current: true },
  { label: "最終面接", icon: Trophy, done: false },
  { label: "結果", icon: BarChart3, done: false },
];

const messages = [
  {
    id: "1",
    sender: "山田 太郎",
    initials: "山",
    content: "二次面接の日程が確定しました。ご確認をお願いいたします。",
    time: "3時間前",
    unread: true,
  },
  {
    id: "2",
    sender: "佐藤 花子",
    initials: "佐",
    content: "書類選考を通過されました。おめでとうございます！",
    time: "1日前",
    unread: false,
  },
  {
    id: "3",
    sender: "システム通知",
    initials: "S",
    content: "プロフィールを更新してください。完成度が75%です。",
    time: "2日前",
    unread: false,
  },
];

export default function PortalPage() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-foreground">こんにちは、田中 花子さん</h1>
        <p className="mt-1 text-sm text-text-muted">選考の進捗と今後の予定を確認できます</p>
      </div>

      {/* Selection Progress Stepper */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-foreground mb-6">選考の進捗</h2>
        <div className="flex items-center justify-between">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;
            return (
              <div key={step.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                      step.done
                        ? "bg-green text-white"
                        : step.current
                          ? "bg-gradient-to-br from-accent to-purple-500 text-white shadow-lg shadow-accent/25"
                          : "bg-border-sub text-text-muted"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      step.done
                        ? "text-green"
                        : step.current
                          ? "text-accent"
                          : "text-text-muted"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "flex-1 h-[2px] mx-3 rounded-full mt-[-20px]",
                      step.done ? "bg-green" : "bg-border-sub"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Interview */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">次回面接</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground">2026年3月15日（日）</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground">14:00 - 14:30</span>
            </div>
          </div>
          <Link
            href="/interview/demo-token"
            className={cn(
              "mt-5 w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all",
              "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
              "shadow-md shadow-violet-500/20 hover:shadow-violet-500/30"
            )}
          >
            <Video className="h-4 w-4" />
            面接に参加
          </Link>
        </div>

        {/* Profile Completion */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">プロフィール完成度</h2>
          <div className="flex items-center gap-6">
            {/* Circular Progress */}
            <div className="relative h-24 w-24 shrink-0">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#e5e8ed"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42 * 0.75} ${2 * Math.PI * 42 * 0.25}`}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">75%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-text-sub">プロフィールの情報を充実させると、選考に有利になります。</p>
              <Link
                href="/portal/profile"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-text transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                プロフィールを編集
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-foreground">最近のメッセージ</h2>
          <Link
            href="/portal/messages"
            className="text-xs font-medium text-accent hover:text-accent-text transition-colors flex items-center gap-0.5"
          >
            すべて表示
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-border-sub">
          {messages.map((msg) => (
            <Link
              key={msg.id}
              href="/portal/messages"
              className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-accent-light/30 transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {msg.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">{msg.sender}</span>
                  <span className="text-[11px] text-text-muted">{msg.time}</span>
                  {msg.unread && (
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  )}
                </div>
                <p className="text-xs text-text-sub truncate mt-0.5">{msg.content}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
