import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // 認証チェック
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const ids = req.nextUrl.searchParams.getAll("ids");
  if (ids.length === 0) {
    return NextResponse.json([]);
  }

  // 候補者が所属する組織のみ返す（セキュリティ）
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ユーザーが候補者として所属する組織IDを取得
  const { data: candidates } = await admin
    .from("candidates")
    .select("organization_id")
    .eq("user_id", user.id);

  const allowedOrgIds = new Set(
    (candidates ?? []).map((c) => c.organization_id)
  );

  // リクエストされたIDのうち、候補者が所属する組織のみフィルタ
  // 管理者の場合はmembersテーブルもチェック
  const { data: members } = await admin
    .from("members")
    .select("organization_id")
    .eq("user_id", user.id);

  (members ?? []).forEach((m) => allowedOrgIds.add(m.organization_id));

  const filteredIds = ids.filter((id) => allowedOrgIds.has(id));
  if (filteredIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name")
    .in("id", filteredIds);

  return NextResponse.json(orgs ?? []);
}
