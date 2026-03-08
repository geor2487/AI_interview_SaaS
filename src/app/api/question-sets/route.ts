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
    .from("question_sets")
    .select("id, title, description, created_at, questions(id)")
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

  // Get member info for org_id
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

  const { title, description, questions } = await request.json();

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json(
      { error: "タイトルと質問は必須です。" },
      { status: 400 }
    );
  }

  const { data: qs, error } = await supabase
    .from("question_sets")
    .insert({
      organization_id: member.organization_id,
      title,
      description: description || "",
    })
    .select("id")
    .single();

  if (error || !qs) {
    console.error("question_sets insert error:", error);
    return NextResponse.json(
      { error: "質問セットの保存に失敗しました: " + (error?.message ?? "") },
      { status: 500 }
    );
  }

  const rows = questions.map(
    (q: { content: string; evaluation_criteria: string }, i: number) => ({
      question_set_id: qs.id,
      order_index: i,
      content: q.content,
      evaluation_criteria: q.evaluation_criteria,
    })
  );

  const { error: questionsError } = await supabase
    .from("questions")
    .insert(rows);

  if (questionsError) {
    console.error("questions insert error:", questionsError);
    return NextResponse.json(
      { error: "質問の保存に失敗しました: " + questionsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: qs.id });
}
