"use client";

import { useRef, useCallback } from "react";

export interface PrintReportProps {
  candidate: {
    name: string;
    email: string;
    position: string | null;
  };
  interview: {
    id: string;
    started_at: string | null;
    completed_at: string | null;
  };
  transcripts: Array<{
    speaker: string;
    content: string;
    timestamp_ms: number;
  }>;
  evaluations: Array<{
    question_content: string;
    ai_score: number | null;
    ai_comment: string | null;
    manual_score: number | null;
    manual_comment: string | null;
  }>;
  overallScore: number;
  overallComment: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "-";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMin = Math.round((end - start) / 60000);
  return `${diffMin}分`;
}

function scoreColor(score: number | null): string {
  if (score === null) return "#999";
  if (score >= 4) return "#22c55e";
  if (score >= 3) return "#eab308";
  return "#ef4444";
}

function scoreLabel(score: number | null): string {
  if (score === null) return "-";
  return `${score} / 5`;
}

export function PrintReport(props: PrintReportProps) {
  const { candidate, interview, transcripts, evaluations, overallScore, overallComment } = props;
  const printRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <>
      <button
        onClick={triggerPrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-sub hover:bg-accent-light hover:text-accent hover:border-accent/30 transition-colors print:hidden"
      >
        PDF / 印刷
      </button>

      <div ref={printRef} className="hidden print:block print-report">
        <style jsx>{`
          @media print {
            .print-report {
              display: block !important;
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1a1a1a;
              font-size: 11px;
              line-height: 1.6;
            }
            @page {
              margin: 15mm;
              size: A4;
            }
          }
        `}</style>

        {/* Header */}
        <div style={{ borderBottom: "2px solid #6366f1", paddingBottom: "12px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#6366f1" }}>InterviewAI</h1>
              <p style={{ fontSize: "14px", fontWeight: 600, margin: "4px 0 0" }}>面接評価レポート</p>
            </div>
            <p style={{ fontSize: "10px", color: "#888" }}>
              出力日時: {new Date().toLocaleString("ja-JP")}
            </p>
          </div>
        </div>

        {/* Candidate Info */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>
            候補者情報
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: "120px", padding: "3px 8px 3px 0" }}>氏名</td>
                <td style={{ padding: "3px 0" }}>{candidate.name}</td>
                <td style={{ fontWeight: 600, width: "120px", padding: "3px 8px 3px 24px" }}>メール</td>
                <td style={{ padding: "3px 0" }}>{candidate.email}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, padding: "3px 8px 3px 0" }}>希望職種</td>
                <td style={{ padding: "3px 0" }}>{candidate.position || "-"}</td>
                <td style={{ fontWeight: 600, padding: "3px 8px 3px 24px" }}>面接日時</td>
                <td style={{ padding: "3px 0" }}>{formatDate(interview.started_at)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, padding: "3px 8px 3px 0" }}>所要時間</td>
                <td colSpan={3} style={{ padding: "3px 0" }}>
                  {formatDuration(interview.started_at, interview.completed_at)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Overall Score */}
        <div style={{ marginBottom: "20px", padding: "12px 16px", background: "#f8f8fc", border: "1px solid #e5e5ea", borderRadius: "6px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>総合評価</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: scoreColor(overallScore) }}>
              {scoreLabel(overallScore)}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: n <= Math.round(overallScore) ? "#6366f1" : "#e5e5ea",
                  }}
                />
              ))}
            </div>
          </div>
          {overallComment && (
            <p style={{ marginTop: "8px", fontSize: "11px", color: "#444" }}>{overallComment}</p>
          )}
        </div>

        {/* Per-question Evaluations */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>
            質問別評価
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ background: "#f3f3f8" }}>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ddd", width: "30%" }}>
                  質問
                </th>
                <th style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #ddd", width: "8%" }}>
                  AI点数
                </th>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ddd", width: "27%" }}>
                  AIコメント
                </th>
                <th style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #ddd", width: "8%" }}>
                  手動点数
                </th>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ddd", width: "27%" }}>
                  手動コメント
                </th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 500 }}>
                    Q{idx + 1}. {ev.question_content}
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, color: scoreColor(ev.ai_score) }}>
                    {ev.ai_score ?? "-"}
                  </td>
                  <td style={{ padding: "6px 8px", color: "#555" }}>{ev.ai_comment || "-"}</td>
                  <td style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, color: scoreColor(ev.manual_score) }}>
                    {ev.manual_score ?? "-"}
                  </td>
                  <td style={{ padding: "6px 8px", color: "#555" }}>{ev.manual_comment || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Transcript */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>
            面接トランスクリプト
          </h2>
          {transcripts.map((t, idx) => (
            <div key={idx} style={{ marginBottom: "6px", display: "flex", gap: "8px" }}>
              <span
                style={{
                  display: "inline-block",
                  minWidth: "60px",
                  fontWeight: 700,
                  fontSize: "10px",
                  color: t.speaker === "ai" ? "#6366f1" : "#333",
                }}
              >
                {t.speaker === "ai" ? "[AI]" : "[候補者]"}
              </span>
              <span style={{ fontSize: "10px", color: "#333", lineHeight: 1.5 }}>{t.content}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #ddd", paddingTop: "8px", textAlign: "center", fontSize: "9px", color: "#aaa" }}>
          InterviewAI - 面接評価レポート - {new Date().toLocaleDateString("ja-JP")}
        </div>
      </div>
    </>
  );
}
