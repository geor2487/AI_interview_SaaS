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
    .from("candidates")
    .select("*")
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

  const {
    name,
    email,
    phone,
    date_of_birth,
    gender,
    location,
    desired_position,
    desired_salary,
    available_from,
    self_introduction,
  } = await request.json();

  if (!name || !email) {
    return NextResponse.json({ error: "氏名とメールアドレスは必須です。" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      organization_id: member.organization_id,
      name,
      email,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      location: location || null,
      desired_position: desired_position || null,
      desired_salary: desired_salary || null,
      available_from: available_from || null,
      self_introduction: self_introduction || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
