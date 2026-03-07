"use client";

import { useState } from "react";
import { Send, Paperclip, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Thread {
  id: string;
  senderName: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  sender: "them" | "me";
  senderName: string;
  content: string;
  time: string;
}

const threads: Thread[] = [
  {
    id: "1",
    senderName: "山田 太郎",
    initials: "山",
    lastMessage: "二次面接の日程が確定しました。ご確認をお願いいたします。",
    time: "14:30",
    unread: true,
    messages: [
      {
        id: "m1",
        sender: "them",
        senderName: "山田 太郎",
        content: "田中さん、一次面接の結果をお伝えします。おめでとうございます、通過されました！",
        time: "3月5日 10:00",
      },
      {
        id: "m2",
        sender: "me",
        senderName: "田中 花子",
        content: "ありがとうございます！とても嬉しいです。次のステップについて教えていただけますか？",
        time: "3月5日 10:15",
      },
      {
        id: "m3",
        sender: "them",
        senderName: "山田 太郎",
        content: "二次面接の日程が確定しました。3月15日（日）14:00からです。ご確認をお願いいたします。",
        time: "3月7日 14:30",
      },
    ],
  },
  {
    id: "2",
    senderName: "佐藤 花子",
    initials: "佐",
    lastMessage: "書類選考を通過されました。おめでとうございます！詳細は追ってご連絡します。",
    time: "昨日",
    unread: false,
    messages: [
      {
        id: "m4",
        sender: "them",
        senderName: "佐藤 花子",
        content: "田中さん、ご応募ありがとうございます。書類を拝見させていただきました。",
        time: "3月3日 09:00",
      },
      {
        id: "m5",
        sender: "them",
        senderName: "佐藤 花子",
        content: "書類選考を通過されました。おめでとうございます！詳細は追ってご連絡します。",
        time: "3月6日 11:00",
      },
      {
        id: "m6",
        sender: "me",
        senderName: "田中 花子",
        content: "ありがとうございます。よろしくお願いいたします。",
        time: "3月6日 11:30",
      },
    ],
  },
  {
    id: "3",
    senderName: "システム通知",
    initials: "S",
    lastMessage: "プロフィールを更新してください。完成度が75%です。",
    time: "3月5日",
    unread: false,
    messages: [
      {
        id: "m7",
        sender: "them",
        senderName: "システム通知",
        content: "InterviewAIへようこそ！まずはプロフィールを入力しましょう。",
        time: "3月1日 08:00",
      },
      {
        id: "m8",
        sender: "them",
        senderName: "システム通知",
        content: "プロフィールを更新してください。完成度が75%です。",
        time: "3月5日 09:00",
      },
    ],
  },
];

export default function MessagesPage() {
  const [activeThreadId, setActiveThreadId] = useState(threads[0].id);
  const [inputValue, setInputValue] = useState("");

  const activeThread = threads.find((t) => t.id === activeThreadId)!;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">メッセージ</h1>
        <p className="mt-1 text-sm text-text-muted">採用担当者とのやりとり</p>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        {/* Thread List (Left) */}
        <div className="w-[300px] shrink-0 border-r border-border flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-border-sub">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="検索..."
                className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={cn(
                  "w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors border-b border-border-sub",
                  activeThreadId === thread.id
                    ? "bg-accent-light"
                    : "hover:bg-accent-light/30"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {thread.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-foreground">{thread.senderName}</span>
                    <span className="text-[11px] text-text-muted shrink-0 ml-2">{thread.time}</span>
                  </div>
                  <p className="text-xs text-text-sub truncate mt-0.5">{thread.lastMessage}</p>
                </div>
                {thread.unread && (
                  <span className="h-2.5 w-2.5 rounded-full bg-accent shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat View (Right) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="h-14 px-5 flex items-center border-b border-border-sub shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-[11px] font-bold text-white">
                {activeThread.initials}
              </div>
              <span className="text-[14px] font-medium text-foreground">{activeThread.senderName}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {activeThread.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.sender === "me" ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn("max-w-[70%]", msg.sender === "me" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.sender === "me"
                        ? "bg-accent text-white rounded-br-md"
                        : "bg-background border border-border-sub text-foreground rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                  <p className={cn(
                    "text-[11px] text-text-muted mt-1",
                    msg.sender === "me" ? "text-right" : "text-left"
                  )}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
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
