import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: interviewId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );

  // Fetch interview with candidate
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("*, candidate:candidates(*)")
    .eq("id", interviewId)
    .single();

  if (interviewError || !interview) {
    return NextResponse.json(
      { error: "Interview not found" },
      { status: 404 }
    );
  }

  // Fetch interview_question_sets
  const { data: interviewQSets } = await supabase
    .from("interview_question_sets")
    .select("question_set_id")
    .eq("interview_id", interviewId)
    .order("order_index");

  const questionSetIds = (interviewQSets ?? []).map((iq) => iq.question_set_id);

  // Fetch questions
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

  // Build evaluation data
  const evalData = (evaluations ?? []).map((ev) => ({
    ...ev,
    question_content: ev.question_id
      ? questionMap.get(ev.question_id) ?? "Unknown Question"
      : "Overall",
  }));

  // Calculate overall score
  const scoredEvals = (evaluations ?? []).filter((ev) => ev.ai_score !== null);
  const overallScore =
    scoredEvals.length > 0
      ? Math.round(
          (scoredEvals.reduce((sum, ev) => sum + (ev.ai_score ?? 0), 0) /
            scoredEvals.length) *
            10
        ) / 10
      : 0;

  return NextResponse.json({
    interview,
    candidate: interview.candidate,
    questions: questions ?? [],
    transcripts: transcripts ?? [],
    evaluations: evalData,
    overallScore,
  });
}
