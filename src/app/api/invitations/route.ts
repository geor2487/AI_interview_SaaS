import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { invitationEmail } from "@/lib/email/templates";

// POST: メアドだけで招待リンクを送信
export async function POST(request: NextRequest) {
  // 認証チェック（管理者のみ）
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email: string; candidate_id?: string; method?: "email" | "link" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, candidate_id, method = "email" } = body;

  if (!email && method === "email") {
    return NextResponse.json(
      { error: "メール送信にはメールアドレスが必要です" },
      { status: 400 }
    );
  }

  // Service Role client to bypass RLS for insert
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let token: string;

  // メールがある場合は既存の招待を探す
  const { data: existing } = email
    ? await adminClient
        .from("invitations")
        .select("id, token")
        .eq("organization_id", member.organization_id)
        .eq("email", email.toLowerCase())
        .eq("status", "pending")
        .single()
    : { data: null };

  if (existing) {
    // 既存の招待を再利用
    token = existing.token;
  } else {
    // 新規招待を作成
    const placeholderEmail = email ? email.toLowerCase() : `link-${crypto.randomUUID()}@placeholder.local`;
    const insertData: Record<string, unknown> = {
      organization_id: member.organization_id,
      candidate_id: candidate_id || null,
      email: placeholderEmail,
    };

    const { data: invitation, error: insertError } = await adminClient
      .from("invitations")
      .insert(insertData)
      .select("token")
      .single();

    if (insertError || !invitation) {
      return NextResponse.json(
        { error: "招待の作成に失敗しました: " + insertError?.message },
        { status: 500 }
      );
    }

    token = invitation.token;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${token}`;

  // 組織名を取得
  const { data: org } = await adminClient
    .from("organizations")
    .select("name")
    .eq("id", member.organization_id)
    .single();

  if (method === "email") {
    const { subject, body: emailBody } = invitationEmail({
      candidate_name: email.split("@")[0],
      company_name: org?.name ?? "企業",
      interview_url: inviteUrl,
    });

    try {
      await sendEmail({ to: email, subject, text: emailBody });
    } catch (err) {
      console.error("[Invitation] Email send failed:", err);
      return NextResponse.json(
        { error: "メール送信に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "招待メールを送信しました",
      invite_url: inviteUrl,
    });
  }

  // method === "link"
  return NextResponse.json({
    success: true,
    invite_url: inviteUrl,
  });
}

// GET: 招待一覧取得
export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: invitations, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(invitations);
}
