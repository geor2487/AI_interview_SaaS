"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MessageSquare } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface QSRow {
  id: string;
  title: string;
  description: string;
  created_at: string;
  questions: { id: string }[];
}

export default function QuestionSetsPage() {
  const [questionSets, setQuestionSets] = useState<QSRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/question-sets")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setQuestionSets(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <h1 className="text-xl font-bold">質問セット</h1>

      {/* Card Grid */}
      {loading ? (
        <LoadingScreen />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {questionSets.map((qs) => (
            <Link
              key={qs.id}
              href={`/dashboard/question-sets/${qs.id}`}
              className="group rounded-2xl border border-border bg-surface p-5 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light">
                  <MessageSquare className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold group-hover:text-accent transition-colors">{qs.title}</h3>
                  <p className="mt-1 text-xs text-text-sub leading-relaxed line-clamp-2">{qs.description}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                    <span className="rounded-full bg-accent-light px-2 py-0.5 font-medium text-accent">
                      {qs.questions?.length ?? 0}問
                    </span>
                    <span>作成日: {new Date(qs.created_at).toLocaleDateString("ja-JP")}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <Link
            href="/dashboard/question-sets/new"
            className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-5 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition"
          >
            <Plus className="h-8 w-8 text-text-muted" />
          </Link>
        </div>
      )}
    </div>
  );
}
