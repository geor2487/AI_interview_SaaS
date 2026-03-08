"use client";

import { useEffect, useState } from "react";
import { Send, Paperclip, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types";

interface Thread {
  candidateId: string;
  orgId: string;
  senderName: string;
  lastMessage: string;
  lastTime: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">メッセージ</h1>
        <p className="mt-1 text-sm text-text-muted">採用担当者とのやりとり</p>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        {/* Chat View */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {loading ? (
              <LoadingScreen />
            ) : messages.length === 0 ? (
              <p className="text-sm text-text-muted text-center">メッセージはまだありません。</p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("max-w-[70%]")}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          isMe
                            ? "bg-accent text-white rounded-br-md"
                            : "bg-background border border-border-sub text-foreground rounded-bl-md"
                        )}
                      >
                        {msg.content}
                      </div>
                      <p className={cn(
                        "text-[11px] text-text-muted mt-1",
                        isMe ? "text-right" : "text-left"
                      )}>
                        {new Date(msg.created_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="px-4 py-3 border-t border-border-sub shrink-0">
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 rounded-lg flex items-center justify-center text-text-muted hover:text-foreground hover:bg-accent-light/50 transition-colors shrink-0">
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
              <button
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                  inputValue.trim()
                    ? "bg-accent text-white hover:bg-accent/90"
                    : "bg-border-sub text-text-muted cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
