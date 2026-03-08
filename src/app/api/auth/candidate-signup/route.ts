import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { name, email, password, invite_token } = await request.json();

  if (!name || !email || !password || !invite_token) {
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

  // 1. invite_token から interviews テーブルで該当面接を取得
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("id, candidate_id")
    .eq("invite_token", invite_token)
    .single();

  if (interviewError || !interview) {
    return NextResponse.json(
      { error: "無効な招待トークンです。" },
      { status: 404 }
    );
  }

  // 2. candidate_id から candidates テーブルでメールアドレスを取得
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, email, user_id")
    .eq("id", interview.candidate_id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: "候補者情報が見つかりません。" },
      { status: 404 }
    );
  }

  // 3. メールアドレスの一致を確認
  if (candidate.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { error: "招待されたメールアドレスと一致しません。" },
      { status: 400 }
    );
  }

  // 4. 既にアカウントが存在するか確認
  if (candidate.user_id) {
    return NextResponse.json(
      { error: "既にアカウントが登録されています。ログインしてください。" },
      { status: 400 }
    );
  }

  // 5. Supabase auth.admin.createUser でユーザー作成
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: "candidate" },
    });

  if (authError) {
    // ユーザーが既に存在する場合
    if (authError.message.includes("already been registered")) {
      return NextResponse.json(
        { error: "既にアカウントが登録されています。ログインしてください。" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // 6. candidates テーブルの user_id を更新
  const { error: updateError } = await supabase
    .from("candidates")
    .update({ user_id: authData.user.id })
    .eq("id", candidate.id);

  if (updateError) {
    return NextResponse.json(
      { error: "候補者情報の更新に失敗しました: " + updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
