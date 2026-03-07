import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

  // Fetch candidate's interview to get the invite_token
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("id, invite_token")
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/interview/${interview.invite_token}`;

  if (method === "email") {
    // Placeholder: log for now, actual email integration via Supabase Edge Functions or Resend
    console.log(`[Invite Email] Sending invite to candidate ${candidate_id}`);
    console.log(`[Invite Email] Interview URL: ${inviteUrl}`);

    // Update candidate status to invited
    await supabase
      .from("candidates")
      .update({ status: "invited" })
      .eq("id", candidate_id);

    return NextResponse.json({
      success: true,
      message: "Invite email sent (placeholder)",
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
