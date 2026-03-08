import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function authenticate(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase
    .from("members")
    .select("organization_id, user_id")
    .eq("user_id", user.id)
    .single();
  return member;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: candidateId } = await params;
  const supabase = await createClient();
  const member = await authenticate(supabase);

  if (!member) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ messages: [] });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: candidateId } = await params;
  const supabase = await createClient();
  const member = await authenticate(supabase);

  if (!member) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { content } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "メッセージを入力してください。" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      organization_id: member.organization_id,
      candidate_id: candidateId,
      sender_id: member.user_id,
      sender_type: "admin",
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}
