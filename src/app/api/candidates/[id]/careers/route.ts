import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: candidateId } = await params;
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
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("id", candidateId)
    .eq("organization_id", member.organization_id)
    .single();
  if (!candidate) {
    return NextResponse.json({ error: "候補者が見つかりません。" }, { status: 404 });
  }

  const { items } = (await request.json()) as {
    items: { company: string; title: string; period_start: string; period_end: string | null; description: string }[];
  };

  await supabase.from("candidate_careers").delete().eq("candidate_id", candidateId);

  if (items.length > 0) {
    const rows = items.map((item, i) => ({
      candidate_id: candidateId,
      company: item.company,
      title: item.title || "",
      period_start: item.period_start || null,
      period_end: item.period_end || null,
      description: item.description || "",
      order_index: i,
    }));
    const { error } = await supabase.from("candidate_careers").insert(rows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data } = await supabase
    .from("candidate_careers")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("order_index");

  return NextResponse.json(data ?? []);
}
