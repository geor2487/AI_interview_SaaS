import { createClient } from "@/lib/supabase/client";
import { generateInterviewPDF, type PDFReportParams } from "./export";

export async function downloadInterviewPDF(interviewId: string): Promise<void> {
  const supabase = createClient();

  // Fetch interview with candidate
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("*, candidate:candidates(*)")
    .eq("id", interviewId)
    .single();

  if (interviewError || !interview) {
    throw new Error("Failed to fetch interview data");
  }

  // Fetch interview_question_sets to get question_set_ids
  const { data: interviewQSets } = await supabase
    .from("interview_question_sets")
    .select("question_set_id")
    .eq("interview_id", interviewId)
    .order("order_index");

  const questionSetIds = (interviewQSets ?? []).map((iq) => iq.question_set_id);

  // Fetch questions from those question sets
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .in("question_set_id", questionSetIds.length > 0 ? questionSetIds : ["__none__"])
    .order("order_index");

  // Fetch transcripts
  const { data: transcripts } = await supabase
    .from("transcripts")
    .select("*")
    .eq("interview_id", interviewId)
    .order("timestamp_ms");

  // Fetch evaluations
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*")
    .eq("interview_id", interviewId);

  // Build question map
  const questionMap = new Map<string, string>();
  (questions ?? []).forEach((q) => {
    questionMap.set(q.id, q.content);
  });

  // Build evaluation data with question content
  const evalData = (evaluations ?? []).map((ev) => ({
    question_content: ev.question_id ? (questionMap.get(ev.question_id) ?? "Unknown Question") : "Overall",
    ai_score: ev.ai_score,
    ai_comment: ev.ai_comment,
    manual_score: ev.manual_score,
    manual_comment: ev.manual_comment,
  }));

  // Calculate overall score (average of ai_scores)
  const scoredEvals = (evaluations ?? []).filter((ev) => ev.ai_score !== null);
  const overallScore =
    scoredEvals.length > 0
      ? Math.round((scoredEvals.reduce((sum, ev) => sum + (ev.ai_score ?? 0), 0) / scoredEvals.length) * 10) / 10
      : 0;

  const candidate = interview.candidate;

  const params: PDFReportParams = {
    candidate: {
      name: candidate?.name ?? "Unknown",
      email: candidate?.email ?? "",
      position: candidate?.desired_position ?? null,
    },
    interview: {
      id: interview.id,
      started_at: interview.started_at,
      completed_at: interview.completed_at,
    },
    transcripts: (transcripts ?? []).map((t) => ({
      speaker: t.speaker,
      content: t.content,
      timestamp_ms: t.timestamp_ms,
    })),
    evaluations: evalData,
    overallScore,
    overallComment: "",
  };

  const doc = generateInterviewPDF(params);
  const candidateName = candidate?.name?.replace(/\s+/g, "_") ?? "report";
  doc.save(`interview_report_${candidateName}_${interviewId.slice(0, 8)}.pdf`);
}
