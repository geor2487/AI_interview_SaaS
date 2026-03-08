import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function authenticate(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();
  return member;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const member = await authenticate(supabase);

  if (!member) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const [candRes, eduRes, carRes, skillRes, docRes, ivRes] = await Promise.all([
    supabase
      .from("candidates")
      .select("*")
      .eq("id", id)
      .eq("organization_id", member.organization_id)
      .single(),
    supabase
      .from("candidate_educations")
      .select("*")
      .eq("candidate_id", id)
      .order("order_index"),
    supabase
      .from("candidate_careers")
      .select("*")
      .eq("candidate_id", id)
      .order("order_index"),
    supabase
      .from("candidate_skills")
      .select("*")
      .eq("candidate_id", id),
    supabase
      .from("candidate_documents")
      .select("*")
      .eq("candidate_id", id),
    supabase
      .from("interviews")
      .select("id, status, created_at")
      .eq("candidate_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (candRes.error) {
    return NextResponse.json({ error: "候補者が見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({
    candidate: candRes.data,
    education: eduRes.data ?? [],
    careers: carRes.data ?? [],
    skills: skillRes.data ?? [],
    documents: docRes.data ?? [],
    interviews: ivRes.data ?? [],
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const member = await authenticate(supabase);

  if (!member) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const body = await request.json();

  const allowedFields = [
    "name",
    "email",
    "phone",
    "date_of_birth",
    "gender",
    "location",
    "desired_position",
    "desired_salary",
    "available_from",
    "self_introduction",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key] || null;
    }
  }
  // name and email should not be null
  if ("name" in updates && !updates.name) {
    return NextResponse.json({ error: "氏名は必須です。" }, { status: 400 });
  }
  if ("email" in updates && !updates.email) {
    return NextResponse.json({ error: "メールアドレスは必須です。" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("candidates")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", member.organization_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const member = await authenticate(supabase);

  if (!member) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  // 候補者が自組織に属しているか確認
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("id", id)
    .eq("organization_id", member.organization_id)
    .single();

  if (!candidate) {
    return NextResponse.json({ error: "候補者が見つかりません。" }, { status: 404 });
  }

  // 関連データを削除
  await Promise.all([
    supabase.from("interviews").delete().eq("candidate_id", id),
    supabase.from("candidate_educations").delete().eq("candidate_id", id),
    supabase.from("candidate_careers").delete().eq("candidate_id", id),
    supabase.from("candidate_skills").delete().eq("candidate_id", id),
    supabase.from("candidate_documents").delete().eq("candidate_id", id),
    supabase.from("invitations").delete().eq("candidate_id", id),
  ]);

  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", id)
    .eq("organization_id", member.organization_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
