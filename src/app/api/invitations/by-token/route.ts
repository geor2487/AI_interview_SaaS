import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// GET: トークンから招待情報を取得（公開API — RLSバイパス）
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("id, organization_id, email, status, candidate_id")
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return NextResponse.json(
      { error: "Invalid invitation token" },
      { status: 404 }
    );
  }

  if (invitation.status === "accepted") {
    return NextResponse.json(
      { error: "already_accepted", message: "この招待は既に使用されています。ログインしてください。" },
      { status: 400 }
    );
  }

  // 組織名も返す
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", invitation.organization_id)
    .single();

  return NextResponse.json({
    id: invitation.id,
    email: invitation.email,
    organization_name: org?.name ?? "",
    status: invitation.status,
  });
}
