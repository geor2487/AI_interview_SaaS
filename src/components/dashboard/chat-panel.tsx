"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, MessageCircle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const initialMessages: Message[] = [
  { role: "assistant", content: "こんにちは！InterviewAI アシスタントです。採用や面接に関することなら何でもお気軽にどうぞ。" },
];

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "エラーが発生しました。もう一度お試しください。" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent/90 transition-all hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[340px] h-[480px] rounded-2xl border border-white/30 bg-white/60 backdrop-blur-xl shadow-2xl shadow-accent/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/20">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
            <Bot className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold">AIアシスタント</p>
            <p className="text-[10px] text-text-muted">オンライン</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/40 transition-colors"
        >
          <X className="h-4 w-4 text-text-muted" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
              msg.role === "assistant"
                ? "bg-white/60 text-text mr-auto"
                : "bg-accent text-white ml-auto"
            )}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-text-muted mr-auto">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">考え中...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/20 px-3 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 rounded-xl bg-white/50 px-3 py-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors shrink-0 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
