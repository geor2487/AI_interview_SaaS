"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Mail, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Candidate, CandidateCareer, CandidateEducation, CandidateSkill, CandidateDocument } from "@/types";

const statusBadge: Record<string, { label: string; className: string }> = {
  completed: { label: "完了", className: "bg-green-bg text-green" },
  evaluated: { label: "評価済", className: "bg-accent-light text-accent" },
  scheduled: { label: "予定", className: "bg-yellow-bg text-yellow" },
  pending: { label: "予定", className: "bg-yellow-bg text-yellow" },
  in_progress: { label: "進行中", className: "bg-accent-light text-accent-text" },
};

interface InterviewRow {
  id: string;
  status: string;
  created_at: string;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [education, setEducation] = useState<CandidateEducation[]>([]);
  const [careers, setCareers] = useState<CandidateCareer[]>([]);
  const [skills, setSkills] = useState<CandidateSkill[]>([]);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("candidates").select("*").eq("id", candidateId).single(),
      supabase.from("candidate_educations").select("*").eq("candidate_id", candidateId).order("order_index"),
      supabase.from("candidate_careers").select("*").eq("candidate_id", candidateId).order("order_index"),
      supabase.from("candidate_skills").select("*").eq("candidate_id", candidateId),
      supabase.from("candidate_documents").select("*").eq("candidate_id", candidateId),
      supabase.from("interviews").select("id, status, created_at").eq("candidate_id", candidateId).order("created_at", { ascending: false }),
    ]).then(([candRes, eduRes, carRes, skillRes, docRes, ivRes]) => {
      setCandidate(candRes.data);
      setEducation(eduRes.data ?? []);
      setCareers(carRes.data ?? []);
      setSkills(skillRes.data ?? []);
      setDocuments(docRes.data ?? []);
      setInterviews(ivRes.data ?? []);
      setLoading(false);
    });
  }, [candidateId]);

  if (loading) return <p className="text-sm text-text-muted p-6">候補者データを取得できませんでした</p>;
  if (!candidate) return <p className="text-sm text-text-muted p-6">候補者が見つかりません。</p>;

  return (
    <div className="space-y-6 max-w-6xl">
      <Link href="/dashboard/candidates" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors">
        <ArrowLeft className="h-4 w-4" />
        候補者一覧に戻る
      </Link>

      <div className="grid grid-cols-5 gap-6">
        {/* Left 60% */}
        <div className="col-span-3 space-y-5">
          {/* 基本情報 */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold mb-4">基本情報</h2>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-lg font-bold text-white">
                {candidate.name[0]}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold">{candidate.name}</h3>
                {candidate.desired_position && (
                  <p className="text-sm text-accent">{candidate.desired_position}</p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 text-sm text-text-sub">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{candidate.email}</span>
                  {candidate.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{candidate.phone}</span>}
                  {candidate.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{candidate.location}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 学歴・職歴 */}
          {(education.length > 0 || careers.length > 0) && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold mb-4">学歴・職歴</h2>
              <div className="space-y-0">
                {education.length > 0 && (
                  <>
                    <h3 className="text-xs font-medium text-text-muted mb-2">学歴</h3>
                    {education.map((e) => (
                      <div key={e.id} className="relative pl-5 pb-4 border-l-2 border-border-sub last:border-0">
                        <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-accent" />
                        <p className="text-sm font-medium">{e.institution}</p>
                        <p className="text-xs text-text-sub">{e.department}</p>
                        <p className="text-xs text-text-muted">{e.period_start} - {e.period_end ?? "現在"}</p>
                      </div>
                    ))}
                  </>
                )}
                {careers.length > 0 && (
                  <>
                    <h3 className="text-xs font-medium text-text-muted mb-2 mt-3">職歴</h3>
                    {careers.map((c) => (
                      <div key={c.id} className="relative pl-5 pb-4 border-l-2 border-border-sub last:border-0">
                        <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-accent" />
                        <p className="text-sm font-medium">{c.company}</p>
                        <p className="text-xs text-text-sub">{c.title}</p>
                        <p className="text-xs text-text-muted">{c.period_start} - {c.period_end ?? "現在"}</p>
                        {c.description && <p className="text-xs text-text-muted mt-0.5">{c.description}</p>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* スキル */}
          {skills.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold mb-4">スキル</h2>
              <div className="space-y-3">
                {skills.map((s) => (
                  <div key={s.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-text-muted">{s.level}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-background">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-accent to-purple-500"
                        style={{ width: `${s.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 40% */}
        <div className="col-span-2 space-y-5">
          {/* 面接履歴 */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold mb-4">面接履歴</h2>
            {interviews.length === 0 ? (
              <p className="text-sm text-text-muted">面接履歴がありません。</p>
            ) : (
              <div className="space-y-3">
                {interviews.map((iv) => {
                  const badge = statusBadge[iv.status] ?? { label: iv.status, className: "bg-gray-100 text-gray-600" };
                  return (
                    <Link
                      key={iv.id}
                      href={`/dashboard/interviews/${iv.id}`}
                      className="flex items-center justify-between rounded-lg border border-border-sub p-3 hover:bg-background transition-colors"
                    >
                      <p className="text-xs text-text-muted">{new Date(iv.created_at).toLocaleDateString("ja-JP")}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", badge.className)}>
                        {badge.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* 提出書類 */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold mb-4">提出書類</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-text-muted">書類がありません。</p>
            ) : (
              <div className="space-y-2">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-2.5 rounded-lg border border-border-sub p-3 hover:bg-background transition-colors cursor-pointer">
                    <FileText className="h-4 w-4 text-accent" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-text-muted">{(d.size_bytes / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
