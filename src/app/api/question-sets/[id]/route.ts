import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  // Verify user belongs to an organization
  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json(
      { error: "組織メンバー情報が見つかりません。" },
      { status: 403 }
    );
  }

  // Try with interview_guidelines first, fallback without it
  let data, error;
  ({ data, error } = await supabase
    .from("question_sets")
    .select("id, title, description, interview_guidelines, questions(*)")
    .eq("id", id)
    .eq("organization_id", member.organization_id)
    .single());

  if (error?.message?.includes("interview_guidelines")) {
    ({ data, error } = await supabase
      .from("question_sets")
      .select("id, title, description, questions(*)")
      .eq("id", id)
      .eq("organization_id", member.organization_id)
      .single());
  }

  if (error || !data) {
    return NextResponse.json(
      { error: "質問セットが見つかりません。" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, interview_guidelines } = body;

  const updateData: Record<string, unknown> = { title, description };
  if (interview_guidelines !== undefined) {
    updateData.interview_guidelines = interview_guidelines;
  }

  let { error } = await supabase
    .from("question_sets")
    .update(updateData)
    .eq("id", id);

  // Retry without interview_guidelines if column doesn't exist yet
  if (error?.message?.includes("interview_guidelines")) {
    delete updateData.interview_guidelines;
    ({ error } = await supabase
      .from("question_sets")
      .update(updateData)
      .eq("id", id));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
