import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  // 1. Authenticate user via cookie-based session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  // 2. Use service role to bypass RLS
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Get candidate
  const { data: candidate, error } = await admin
    .from("candidates")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !candidate) {
    return NextResponse.json({ error: "候補者が見つかりません。" }, { status: 404 });
  }

  // 4. Get related data
  const [carRes, eduRes, skillRes, docRes] = await Promise.all([
    admin.from("candidate_careers").select("*").eq("candidate_id", candidate.id).order("order_index"),
    admin.from("candidate_educations").select("*").eq("candidate_id", candidate.id).order("order_index"),
    admin.from("candidate_skills").select("*").eq("candidate_id", candidate.id),
    admin.from("candidate_documents").select("*").eq("candidate_id", candidate.id),
  ]);

  return NextResponse.json({
    candidate,
    careers: carRes.data ?? [],
    educations: eduRes.data ?? [],
    skills: skillRes.data ?? [],
    documents: docRes.data ?? [],
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get candidate by user_id
  const { data: candidate, error: candError } = await admin
    .from("candidates")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (candError || !candidate) {
    return NextResponse.json({ error: "候補者が見つかりません。" }, { status: 404 });
  }

  const candidateId = candidate.id;
  const body = await request.json();
  const { basicInfo, educations, careers, skills } = body;

  // Update basic info
  if (basicInfo) {
    const allowedFields = [
      "name", "phone", "date_of_birth", "gender", "location",
      "desired_position", "desired_salary", "available_from", "self_introduction",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in basicInfo) {
        updates[key] = basicInfo[key] || null;
      }
    }
    // name should not be null
    if ("name" in updates && !updates.name) {
      return NextResponse.json({ error: "氏名は必須です。" }, { status: 400 });
    }

    const { error } = await admin
      .from("candidates")
      .update(updates)
      .eq("id", candidateId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Update educations (replace all)
  if (Array.isArray(educations)) {
    await admin.from("candidate_educations").delete().eq("candidate_id", candidateId);
    const validEdu = educations.filter((e: { institution: string }) => e.institution);
    if (validEdu.length > 0) {
      const rows = validEdu.map((item: { institution: string; department: string; period_start: string; period_end: string | null; description: string }, i: number) => ({
        candidate_id: candidateId,
        institution: item.institution,
        department: item.department || "",
        period_start: item.period_start || null,
        period_end: item.period_end || null,
        description: item.description || "",
        order_index: i,
      }));
      await admin.from("candidate_educations").insert(rows);
    }
  }

  // Update careers (replace all)
  if (Array.isArray(careers)) {
    await admin.from("candidate_careers").delete().eq("candidate_id", candidateId);
    const validCar = careers.filter((c: { company: string }) => c.company);
    if (validCar.length > 0) {
      const rows = validCar.map((item: { company: string; title: string; period_start: string; period_end: string | null; description: string }, i: number) => ({
        candidate_id: candidateId,
        company: item.company,
        title: item.title || "",
        period_start: item.period_start || null,
        period_end: item.period_end || null,
        description: item.description || "",
        order_index: i,
      }));
      await admin.from("candidate_careers").insert(rows);
    }
  }

  // Update skills (replace all)
  if (Array.isArray(skills)) {
    await admin.from("candidate_skills").delete().eq("candidate_id", candidateId);
    const validSkills = skills.filter((s: { name: string }) => s.name);
    if (validSkills.length > 0) {
      const rows = validSkills.map((item: { name: string; level: number }) => ({
        candidate_id: candidateId,
        name: item.name,
        level: Math.min(100, Math.max(0, item.level)),
      }));
      await admin.from("candidate_skills").insert(rows);
    }
  }

  return NextResponse.json({ success: true });
}
