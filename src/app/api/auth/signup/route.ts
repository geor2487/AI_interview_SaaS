import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { email, password, fullName, orgName, address, phone } = await request.json();

  if (!email || !password || !fullName || !orgName) {
    return NextResponse.json(
      { error: "必須項目が不足しています。" },
      { status: 400 }
    );
  }

  // Service Role client to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // 2. Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName, address: address || null, phone: phone || null })
    .select("id")
    .single();

  if (orgError) {
    return NextResponse.json(
      { error: "組織の作成に失敗しました: " + orgError.message },
      { status: 500 }
    );
  }

  // 3. Create member record
  const { error: memberError } = await supabase.from("members").insert({
    organization_id: org.id,
    user_id: authData.user.id,
    role: "admin",
  });

  if (memberError) {
    return NextResponse.json(
      { error: "メンバー登録に失敗しました: " + memberError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
