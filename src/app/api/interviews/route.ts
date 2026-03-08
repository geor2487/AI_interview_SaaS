import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "組織メンバー情報が見つかりません。" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("interviews")
    .select("id, status, scheduled_at, deadline_at, created_at, invite_token, candidate:candidates(name)")
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "組織メンバー情報が見つかりません。" }, { status: 403 });
  }

  const { candidate_id, question_set_ids, deadline_at } = await request.json();

  if (!candidate_id || !Array.isArray(question_set_ids) || question_set_ids.length === 0) {
    return NextResponse.json(
      { error: "候補者と質問セットは必須です。" },
      { status: 400 }
    );
  }

  // Create interview
  const { data: interview, error } = await supabase
    .from("interviews")
    .insert({
      organization_id: member.organization_id,
      candidate_id,
      deadline_at: deadline_at || null,
    })
    .select("id, invite_token")
    .single();

  if (error || !interview) {
    console.error("interview insert error:", error);
    return NextResponse.json(
      { error: "面接の作成に失敗しました: " + (error?.message ?? "") },
      { status: 500 }
    );
  }

  // Create junction rows
  const junctionRows = question_set_ids.map((qsId: string, index: number) => ({
    interview_id: interview.id,
    question_set_id: qsId,
    order_index: index,
  }));

  const { error: junctionError } = await supabase
    .from("interview_question_sets")
    .insert(junctionRows);

  if (junctionError) {
    console.error("interview_question_sets insert error:", junctionError);
    return NextResponse.json(
      { error: "質問セットの紐付けに失敗しました: " + junctionError.message },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/interview/${interview.invite_token}`;

  return NextResponse.json({
    id: interview.id,
    invite_token: interview.invite_token,
    invite_url: inviteUrl,
  });
}
