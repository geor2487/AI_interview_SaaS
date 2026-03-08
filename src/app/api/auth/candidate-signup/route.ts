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

  // 1. invitations テーブルでトークンを検証
  const { data: invitation, error: inviteError } = await supabase
    .from("invitations")
    .select("id, organization_id, email, candidate_id, status")
    .eq("token", invite_token)
    .single();

  if (inviteError || !invitation) {
    return NextResponse.json(
      { error: "無効な招待トークンです。" },
      { status: 404 }
    );
  }

  if (invitation.status === "accepted") {
    return NextResponse.json(
      { error: "この招待は既に使用されています。ログインしてください。" },
      { status: 400 }
    );
  }

  // 2. メールアドレスの一致を確認（リンクのみ招待の場合はスキップ）
  const isLinkOnly = invitation.email.includes("@placeholder.local");
  if (!isLinkOnly && invitation.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { error: "招待されたメールアドレスと一致しません。" },
      { status: 400 }
    );
  }

  // リンクのみ招待の場合、招待のメールを更新
  if (isLinkOnly) {
    await supabase
      .from("invitations")
      .update({ email: email.toLowerCase() })
      .eq("id", invitation.id);
  }

  // 3. パターンB: 既存の候補者がいる場合、user_id が既に設定されていないか確認
  if (invitation.candidate_id) {
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id, user_id")
      .eq("id", invitation.candidate_id)
      .single();

    if (existingCandidate?.user_id) {
      return NextResponse.json(
        { error: "既にアカウントが登録されています。ログインしてください。" },
        { status: 400 }
      );
    }
  }

  // 4. Supabase auth.admin.createUser でユーザー作成
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: "candidate" },
    });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      return NextResponse.json(
        { error: "既にアカウントが登録されています。ログインしてください。" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // 5. 候補者レコードを作成 or 更新
  if (invitation.candidate_id) {
    // パターンB: 既存の候補者の user_id を更新
    const { error: updateError } = await supabase
      .from("candidates")
      .update({ user_id: authData.user.id, name })
      .eq("id", invitation.candidate_id);

    if (updateError) {
      return NextResponse.json(
        { error: "候補者情報の更新に失敗しました: " + updateError.message },
        { status: 500 }
      );
    }
  } else {
    // パターンA: 新規候補者レコードを作成
    const { data: newCandidate, error: insertError } = await supabase
      .from("candidates")
      .insert({
        user_id: authData.user.id,
        organization_id: invitation.organization_id,
        name,
        email: email.toLowerCase(),
        status: "invited",
      })
      .select("id")
      .single();

    if (insertError || !newCandidate) {
      return NextResponse.json(
        { error: "候補者情報の作成に失敗しました: " + insertError?.message },
        { status: 500 }
      );
    }

    // invitation に candidate_id を紐づけ
    await supabase
      .from("invitations")
      .update({ candidate_id: newCandidate.id, status: "accepted" })
      .eq("id", invitation.id);

    return NextResponse.json({ success: true });
  }

  // パターンBの場合も invitation を accepted に更新
  await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  return NextResponse.json({ success: true });
}
