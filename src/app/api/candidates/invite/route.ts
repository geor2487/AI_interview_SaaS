import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { invitationEmail } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { candidate_id: string; method: "email" | "link" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { candidate_id, method } = body;

  if (!candidate_id || !method) {
    return NextResponse.json(
      { error: "candidate_id and method are required" },
      { status: 400 }
    );
  }

  // Service Role client to bypass RLS
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch candidate info
  const { data: candidate, error: candidateError } = await adminClient
    .from("candidates")
    .select("id, name, email, organization_id")
    .eq("id", candidate_id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 }
    );
  }

  // Fetch organization name
  const { data: org } = await adminClient
    .from("organizations")
    .select("name")
    .eq("id", candidate.organization_id)
    .single();

  // 既存の pending 招待があるか確認
  const { data: existingInvite } = await adminClient
    .from("invitations")
    .select("id, token")
    .eq("organization_id", candidate.organization_id)
    .eq("email", candidate.email.toLowerCase())
    .eq("status", "pending")
    .single();

  let token: string;

  if (existingInvite) {
    token = existingInvite.token;
  } else {
    // 新規招待を作成（候補者IDを紐づけ）
    const { data: invitation, error: insertError } = await adminClient
      .from("invitations")
      .insert({
        organization_id: candidate.organization_id,
        email: candidate.email.toLowerCase(),
        candidate_id: candidate.id,
      })
      .select("token")
      .single();

    if (insertError || !invitation) {
      return NextResponse.json(
        { error: "招待の作成に失敗しました" },
        { status: 500 }
      );
    }

    token = invitation.token;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${token}`;

  if (method === "email") {
    const { subject, body: emailBody } = invitationEmail({
      candidate_name: candidate.name,
      company_name: org?.name ?? "企業",
      interview_url: inviteUrl,
    });

    try {
      await sendEmail({
        to: candidate.email,
        subject,
        text: emailBody,
      });
    } catch (err) {
      console.error("[Invite] Email send failed:", err);
      return NextResponse.json(
        { error: "メール送信に失敗しました" },
        { status: 500 }
      );
    }

    // Update candidate status to invited
    await adminClient
      .from("candidates")
      .update({ status: "invited" })
      .eq("id", candidate_id);

    return NextResponse.json({
      success: true,
      message: "招待メールを送信しました",
      invite_url: inviteUrl,
    });
  }

  if (method === "link") {
    return NextResponse.json({
      success: true,
      invite_url: inviteUrl,
    });
  }

  return NextResponse.json({ error: "Invalid method" }, { status: 400 });
}
