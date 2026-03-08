"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Video,
  Calendar,
  Clock,
  ChevronRight,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";

interface MessageRow {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
}

interface InterviewRow {
  id: string;
  scheduled_at: string | null;
  invite_token: string;
}

export default function PortalPage() {
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name ?? "ユーザー";

  const [nextInterview, setNextInterview] = useState<InterviewRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    // Fetch next upcoming interview for this candidate
    supabase
      .from("interviews")
      .select("id, scheduled_at, invite_token, candidate:candidates!inner(user_id)")
      .eq("candidates.user_id", user.id)
      .in("status", ["pending", "in_progress"])
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setNextInterview(data[0] as unknown as InterviewRow);
      });

    // Fetch recent messages
    supabase
      .from("messages")
      .select("id, content, sender_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setMessages(data ?? []));
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-foreground">こんにちは、{fullName}さん</h1>
        <p className="mt-1 text-sm text-text-muted">選考の進捗と今後の予定を確認できます</p>
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Interview */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">次回面接</h2>
          {nextInterview ? (
            <>
              <div className="space-y-3">
                {nextInterview.scheduled_at && (
                  <>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-accent" />
                      <span className="text-sm text-foreground">
                        {new Date(nextInterview.scheduled_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-accent" />
                      <span className="text-sm text-foreground">
                        {new Date(nextInterview.scheduled_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <Link
                href={`/interview/${nextInterview.invite_token}`}
                className={cn(
                  "mt-5 w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all",
                  "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
                  "shadow-md shadow-violet-500/20 hover:shadow-violet-500/30"
                )}
              >
                <Video className="h-4 w-4" />
                面接に参加
              </Link>
            </>
          ) : (
            <p className="text-sm text-text-muted">予定されている面接はありません。</p>
          )}
        </div>

        {/* Profile Completion */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">プロフィール</h2>
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
        {messages.length === 0 ? (
          <div className="px-6 pb-5">
            <p className="text-sm text-text-muted">メッセージはまだありません。</p>
          </div>
        ) : (
          <div className="divide-y divide-border-sub">
            {messages.map((msg) => (
              <Link
                key={msg.id}
                href="/portal/messages"
                className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-accent-light/30 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-sub truncate">{msg.content}</p>
                  <span className="text-[11px] text-text-muted">
                    {new Date(msg.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
