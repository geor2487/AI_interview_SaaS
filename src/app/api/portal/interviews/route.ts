import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
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

  // 候補者レコードを取得（複数組織に所属している可能性があるため配列で取得）
  const { data: candidates, error: candidateError } = await admin
    .from("candidates")
    .select("id, organization_id")
    .eq("user_id", user.id);

  if (candidateError) {
    console.error("候補者検索エラー:", candidateError);
    return NextResponse.json({ error: "候補者情報の取得に失敗しました。" }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    // user_id でリンクされた候補者がない場合、メールアドレスで検索を試みる
    const { data: candidatesByEmail } = await admin
      .from("candidates")
      .select("id, organization_id, user_id")
      .eq("email", user.email?.toLowerCase() ?? "");

    if (candidatesByEmail && candidatesByEmail.length > 0) {
      // メールで見つかった候補者の user_id を更新（リンク漏れ修復）
      for (const c of candidatesByEmail) {
        if (!c.user_id) {
          await admin
            .from("candidates")
            .update({ user_id: user.id })
            .eq("id", c.id);
        }
      }
      // 更新後に再取得
      const { data: linkedCandidates } = await admin
        .from("candidates")
        .select("id, organization_id")
        .eq("user_id", user.id);

      if (!linkedCandidates || linkedCandidates.length === 0) {
        return NextResponse.json([]);
      }

      return fetchInterviews(admin, linkedCandidates);
    }

    return NextResponse.json([]);
  }

  return fetchInterviews(admin, candidates);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchInterviews(
  admin: any,
  candidates: { id: string; organization_id: string }[]
) {
  const candidateIds = candidates.map((c) => c.id);

  // 面接一覧を取得
  const { data: interviews, error: interviewError } = await admin
    .from("interviews")
    .select("id, status, deadline_at, created_at, organization_id, candidate_id")
    .in("candidate_id", candidateIds)
    .order("created_at", { ascending: false });

  if (interviewError) {
    console.error("面接取得エラー:", interviewError);
    return NextResponse.json({ error: "面接情報の取得に失敗しました。" }, { status: 500 });
  }

  if (!interviews || interviews.length === 0) {
    return NextResponse.json([]);
  }

  // 組織名を取得
  const orgIds = [...new Set(interviews.map((i: { organization_id: string }) => i.organization_id))];
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name")
    .in("id", orgIds);

  const orgMap = new Map(
    (orgs ?? []).map((o: { id: string; name: string }) => [o.id, o.name as string])
  );

  const result = interviews.map((row: Record<string, unknown>) => ({
    ...row,
    org_name: orgMap.get(row.organization_id as string) ?? "企業",
  }));

  return NextResponse.json(result);
}
