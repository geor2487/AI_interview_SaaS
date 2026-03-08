import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: interviewId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 候補者レコードを取得
  const { data: candidate } = await admin
    .from("candidates")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!candidate) {
    return NextResponse.json(
      { error: "候補者情報が見つかりません。" },
      { status: 404 }
    );
  }

  // 面接情報を取得
  const { data: interview } = await admin
    .from("interviews")
    .select("id, status, deadline_at, candidate_id, organization_id")
    .eq("id", interviewId)
    .single();

  if (!interview) {
    return NextResponse.json(
      { error: "面接情報が見つかりません。" },
      { status: 404 }
    );
  }

  // 所有権チェック
  if (interview.candidate_id !== candidate.id) {
    return NextResponse.json(
      { error: "この面接へのアクセス権限がありません。" },
      { status: 403 }
    );
  }

  // interview_guidelines: 質問セット > 組織デフォルト
  let guidelines: string | null = null;

  const { data: iqsRows } = await admin
    .from("interview_question_sets")
    .select("question_set_id")
    .eq("interview_id", interviewId)
    .order("order_index", { ascending: true })
    .limit(1);

  if (iqsRows && iqsRows.length > 0) {
    const { data: qs } = await admin
      .from("question_sets")
      .select("interview_guidelines")
      .eq("id", iqsRows[0].question_set_id)
      .single();

    if (qs?.interview_guidelines) {
      guidelines = qs.interview_guidelines;
    }
  }

  if (!guidelines) {
    const { data: org } = await admin
      .from("organizations")
      .select("interview_guidelines")
      .eq("id", interview.organization_id)
      .single();

    if (org?.interview_guidelines) {
      guidelines = org.interview_guidelines;
    }
  }

  return NextResponse.json({
    id: interview.id,
    status: interview.status,
    deadline_at: interview.deadline_at,
    guidelines,
  });
}
