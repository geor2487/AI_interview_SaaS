import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("video") as File | null;
  const interviewId = formData.get("interview_id") as string | null;

  if (!file || !interviewId) {
    return NextResponse.json(
      { error: "video file and interview_id are required" },
      { status: 400 }
    );
  }

  // Verify interview exists
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("id")
    .eq("id", interviewId)
    .single();

  if (interviewError || !interview) {
    return NextResponse.json(
      { error: "Interview not found" },
      { status: 404 }
    );
  }

  // Generate storage path
  const fileExt = file.name.split(".").pop() || "webm";
  const storagePath = `recordings/${interviewId}/${randomUUID()}.${fileExt}`;

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = new Uint8Array(arrayBuffer);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("recordings")
    .upload(storagePath, fileBuffer, {
      contentType: file.type || "video/webm",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload recording" },
      { status: 500 }
    );
  }

  // Create recording entry in DB
  const recordingId = randomUUID();
  const { error: dbError } = await supabase
    .from("recordings")
    .insert({
      id: recordingId,
      interview_id: interviewId,
      storage_path: storagePath,
      duration_ms: 0, // Will be updated later when duration is known
    });

  if (dbError) {
    console.error("DB error:", dbError);
    // Clean up uploaded file
    await supabase.storage.from("recordings").remove([storagePath]);
    return NextResponse.json(
      { error: "Failed to create recording entry" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    recording_id: recordingId,
    storage_path: storagePath,
  });
}
