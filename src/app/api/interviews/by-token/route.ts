import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: interview, error } = await supabase
    .from("interviews")
    .select("id, candidate_id, status, deadline_at")
    .eq("invite_token", token)
    .single();

  if (error || !interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  return NextResponse.json(interview);
}
