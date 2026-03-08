import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { interview_id, storage_path } = await request.json();

  if (!interview_id || !storage_path) {
    return NextResponse.json(
      { error: "interview_id and storage_path are required" },
      { status: 400 }
    );
  }

  // Create recording entry in DB
  const recordingId = randomUUID();
  const { error: dbError } = await supabase
    .from("recordings")
    .insert({
      id: recordingId,
      interview_id,
      storage_path,
      duration_ms: 0,
    });

  if (dbError) {
    console.error("DB error:", dbError);
    return NextResponse.json(
      { error: `Failed to create recording entry: ${dbError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ recording_id: recordingId });
}
