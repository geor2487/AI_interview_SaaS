import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { interview_id } = await request.json();

  if (!interview_id) {
    return NextResponse.json(
      { error: "interview_id is required" },
      { status: 400 }
    );
  }

  // Verify interview exists
  const { data: interview } = await supabase
    .from("interviews")
    .select("id")
    .eq("id", interview_id)
    .single();

  if (!interview) {
    return NextResponse.json(
      { error: "Interview not found" },
      { status: 404 }
    );
  }

  const storagePath = `recordings/${interview_id}/${randomUUID()}.webm`;

  // Create signed upload URL (valid for 10 minutes)
  const { data, error } = await supabase.storage
    .from("recordings")
    .createSignedUploadUrl(storagePath);

  if (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signed_url: data.signedUrl,
    token: data.token,
    storage_path: storagePath,
  });
}
