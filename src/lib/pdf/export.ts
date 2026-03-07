import { jsPDF } from "jspdf";

export interface PDFReportParams {
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

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "-";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMin = Math.round((end - start) / 60000);
  return `${diffMin} min`;
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

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

export function generateInterviewPDF(params: PDFReportParams): jsPDF {
  const { candidate, interview, transcripts, evaluations, overallScore, overallComment } = params;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(requiredHeight: number) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + requiredHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("InterviewAI - Interview Evaluation Report", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleString("ja-JP")}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 10;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Candidate Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Candidate Information", margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const candidateInfo = [
    ["Name", candidate.name],
    ["Email", candidate.email],
    ["Position", candidate.position || "-"],
    ["Interview Date", formatDate(interview.started_at)],
    ["Duration", formatDuration(interview.started_at, interview.completed_at)],
  ];

  candidateInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 40, y);
    y += 5;
  });
  y += 5;

  // Overall Evaluation
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Evaluation", margin, y);
  y += 7;

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  const scoreColor = overallScore >= 4 ? [34, 197, 94] : overallScore >= 3 ? [234, 179, 8] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${overallScore} / 5`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 5;

  if (overallComment) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const commentLines = wrapText(doc, overallComment, contentWidth);
    checkPageBreak(commentLines.length * 5 + 5);
    doc.text(commentLines, margin, y);
    y += commentLines.length * 5;
  }
  y += 5;

  // Per-question Evaluations
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Question Evaluations", margin, y);
  y += 8;

  evaluations.forEach((ev, idx) => {
    checkPageBreak(40);

    // Question header
    doc.setFillColor(245, 245, 250);
    doc.rect(margin, y - 4, contentWidth, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const qLines = wrapText(doc, `Q${idx + 1}. ${ev.question_content}`, contentWidth - 4);
    doc.text(qLines, margin + 2, y);
    y += qLines.length * 5 + 3;

    // AI Evaluation
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`AI Score: ${ev.ai_score ?? "-"} / 5`, margin + 4, y);
    y += 5;

    if (ev.ai_comment) {
      doc.setFont("helvetica", "normal");
      const aiLines = wrapText(doc, `AI Comment: ${ev.ai_comment}`, contentWidth - 8);
      checkPageBreak(aiLines.length * 4 + 5);
      doc.text(aiLines, margin + 4, y);
      y += aiLines.length * 4 + 2;
    }

    // Manual Evaluation
    if (ev.manual_score !== null) {
      doc.setFont("helvetica", "bold");
      doc.text(`Manual Score: ${ev.manual_score} / 5`, margin + 4, y);
      y += 5;

      if (ev.manual_comment) {
        doc.setFont("helvetica", "normal");
        const manualLines = wrapText(doc, `Manual Comment: ${ev.manual_comment}`, contentWidth - 8);
        checkPageBreak(manualLines.length * 4 + 5);
        doc.text(manualLines, margin + 4, y);
        y += manualLines.length * 4 + 2;
      }
    }

    y += 5;
  });

  // Transcript
  checkPageBreak(20);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Interview Transcript", margin, y);
  y += 8;

  transcripts.forEach((t) => {
    checkPageBreak(15);
    const speakerLabel = t.speaker === "ai" ? "[AI]" : "[Candidate]";
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(t.speaker === "ai" ? 99 : 60, t.speaker === "ai" ? 102 : 60, t.speaker === "ai" ? 241 : 60);
    doc.text(speakerLabel, margin, y);
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "normal");
    const contentLines = wrapText(doc, t.content, contentWidth - 25);
    checkPageBreak(contentLines.length * 4 + 5);
    doc.text(contentLines, margin + 22, y);
    y += Math.max(contentLines.length * 4, 5) + 3;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `InterviewAI - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
  }

  return doc;
}
