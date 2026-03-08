import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { invitationEmail } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  // Fetch candidate info
  const { data: candidate, error: candidateError } = await supabase
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

  // Fetch candidate's interview to get the invite_token
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("id, invite_token, deadline_at")
    .eq("candidate_id", candidate_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (interviewError || !interview) {
    return NextResponse.json(
      { error: "No interview found for this candidate" },
      { status: 404 }
    );
  }

  // Fetch organization name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", candidate.organization_id)
    .single();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/interview/${interview.invite_token}`;

  // Format deadline_at to Japanese date string
  const deadlineDate = interview.deadline_at
    ? new Date(interview.deadline_at).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "期限なし";

  if (method === "email") {
    const { subject, body: emailBody } = invitationEmail({
      candidate_name: candidate.name,
      company_name: org?.name ?? "企業",
      interview_url: inviteUrl,
      deadline_date: deadlineDate,
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
    await supabase
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
