"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Download, MessageCircle, BarChart3, Pencil, Play, Printer, VideoOff } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { EvaluationSummary } from "@/components/interview/evaluation-summary";
import { ManualEvaluation } from "@/components/interview/manual-evaluation";
import { PrintReport, type PrintReportProps } from "@/components/interview/print-report";
import { downloadInterviewPDF } from "@/lib/pdf/generate-pdf";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Evaluation, Question, Transcript } from "@/types";

const tabItems = [
  { key: "transcript", label: "トランスクリプト", icon: MessageCircle },
  { key: "evaluation", label: "AI評価", icon: BarChart3 },
  { key: "manual", label: "面接官補正", icon: Pencil },
  { key: "recording", label: "録画", icon: Play },
] as const;

type TabKey = (typeof tabItems)[number]["key"];

interface ReportData {
  interview: {
    id: string;
    started_at: string | null;
    completed_at: string | null;
    deadline_at: string | null;
    status: string;
  };
  candidate: {
    name: string;
    email: string;
    desired_position: string | null;
  };
  questions: Question[];
  transcripts: Transcript[];
  evaluations: Array<Evaluation & { question_content: string }>;
  overallScore: number;
}


function scoreBg(score: number) {
  if (score >= 85) return "bg-green-bg text-green";
  if (score >= 70) return "bg-accent-light text-accent";
  return "bg-yellow-bg text-yellow";
}

export default function InterviewDetailPage() {
  const params = useParams();
  const interviewId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabKey>("transcript");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/interview/${interviewId}/report`);
        if (res.ok) {
          const data = await res.json();
          setReportData(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [interviewId]);

  // Fetch recording URL
  useEffect(() => {
    async function fetchRecording() {
      setRecordingLoading(true);
      const supabase = createClient();
      const { data: recording } = await supabase
        .from("recordings")
        .select("storage_path")
        .eq("interview_id", interviewId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recording?.storage_path) {
        const { data: urlData } = await supabase.storage
          .from("recordings")
          .createSignedUrl(recording.storage_path, 3600);
        if (urlData?.signedUrl) {
          setRecordingUrl(urlData.signedUrl);
        }
      }
      setRecordingLoading(false);
    }
    fetchRecording();
  }, [interviewId]);

  const handlePDFDownload = useCallback(async () => {
    setPdfDownloading(true);
    try {
      await downloadInterviewPDF(interviewId);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setPdfDownloading(false);
    }
  }, [interviewId]);

  const candidateName = reportData?.candidate?.name ?? "不明";
  const candidateInitial = candidateName.charAt(0);
  const position = reportData?.candidate?.desired_position ?? "";
  const deadlineDate = reportData?.interview?.deadline_at
    ? new Date(reportData.interview.deadline_at).toLocaleString("ja-JP")
    : "-";
  const interviewDate = reportData?.interview?.started_at
    ? new Date(reportData.interview.started_at).toLocaleString("ja-JP")
    : "-";
  const overallScore = reportData?.overallScore ?? 0;

  const displayTranscripts = reportData?.transcripts ?? [];

  const evaluations = reportData?.evaluations ?? [];
  const questions = reportData?.questions ?? [];

  // Compute per-question scores for sidebar
  const questionScores = evaluations
    .filter((ev) => ev.question_id !== null)
    .map((ev, i) => ({
      question: ev.question_content || `質問 ${i + 1}`,
      score: ev.ai_score !== null ? Math.round(ev.ai_score * 20) : 0, // Convert 1-5 to percentage
    }));

  // Print report props
  const printProps: PrintReportProps = {
    candidate: {
      name: candidateName,
      email: reportData?.candidate?.email ?? "",
      position: position,
    },
    interview: {
      id: interviewId,
      started_at: reportData?.interview?.started_at ?? null,
      completed_at: reportData?.interview?.completed_at ?? null,
    },
    transcripts: displayTranscripts.map((t) => ({
      speaker: t.speaker,
      content: t.content,
      timestamp_ms: t.timestamp_ms,
    })),
    evaluations: evaluations.map((ev) => ({
      question_content: ev.question_content,
      ai_score: ev.ai_score,
      ai_comment: ev.ai_comment,
      manual_score: ev.manual_score,
      manual_comment: ev.manual_comment,
    })),
    overallScore: overallScore,
    overallComment: "",
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <Link href="/dashboard/interviews" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors print:hidden">
        <ArrowLeft className="h-4 w-4" />
        面接一覧に戻る
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-5 print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-lg font-bold text-white">
            {candidateInitial}
          </div>
          <div>
            <h1 className="text-lg font-bold">{candidateName}</h1>
            <p className="text-sm text-text-sub">{position} - 回答期限: {deadlineDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {overallScore > 0 ? overallScore.toFixed(1) : "-"}
            </div>
            <p className="text-xs text-text-muted">総合スコア</p>
          </div>
          <button
            onClick={handlePDFDownload}
            disabled={pdfDownloading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-sub hover:bg-accent-light hover:text-accent hover:border-accent/30 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {pdfDownloading ? "生成中..." : "PDF出力"}
          </button>
          <PrintReport {...printProps} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border print:hidden">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.key
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-sub"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="grid grid-cols-3 gap-6 print:hidden">
        {/* Main content */}
        <div className="col-span-2">
          {loading && <LoadingScreen />}

          {!loading && activeTab === "transcript" && (
            <div className="space-y-4">
              {displayTranscripts.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.speaker === "candidate" && "flex-row-reverse")}>
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                    msg.speaker === "ai"
                      ? "bg-gradient-to-br from-accent to-purple-500"
                      : "bg-gray-400"
                  )}>
                    {msg.speaker === "ai" ? "AI" : candidateInitial}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                    msg.speaker === "ai"
                      ? "bg-accent-light text-foreground"
                      : "bg-surface border border-border"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === "evaluation" && (
            <EvaluationSummary evaluations={evaluations} questions={questions} />
          )}

          {!loading && activeTab === "manual" && (
            <ManualEvaluation
              interviewId={interviewId}
              evaluations={evaluations}
              questions={questions}
            />
          )}

          {!loading && activeTab === "recording" && (
            <div className="rounded-lg border border-border bg-surface p-5">
              {recordingLoading ? (
                <div className="flex h-48 items-center justify-center text-sm text-text-muted">
                  録画データを確認中...
                </div>
              ) : recordingUrl ? (
                <video
                  src={recordingUrl}
                  controls
                  className="w-full rounded-lg bg-black"
                  style={{ maxHeight: "480px" }}
                />
              ) : (
                <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-sub text-text-muted">
                  <VideoOff className="h-8 w-8" />
                  <p className="text-sm">録画データがありません</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Question scores */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">質問別スコア</h3>
          {questionScores.length > 0 ? (
            questionScores.map((q, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-sub font-medium truncate max-w-[70%]">Q{i + 1}. {q.question}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", scoreBg(q.score))}>
                    {q.score}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-background">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-accent to-purple-500"
                    style={{ width: `${q.score}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-text-muted">評価データがまだありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
