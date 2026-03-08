"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarDays,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type {
  Candidate,
  CandidateCareer,
  CandidateEducation,
  CandidateSkill,
  CandidateDocument,
} from "@/types";

const statusBadge: Record<string, { label: string; className: string }> = {
  completed: { label: "完了", className: "bg-green-bg text-green" },
  evaluated: { label: "評価済", className: "bg-accent-light text-accent" },
  scheduled: { label: "予定", className: "bg-yellow-bg text-yellow" },
  pending: { label: "予定", className: "bg-yellow-bg text-yellow" },
  in_progress: { label: "進行中", className: "bg-accent-light text-accent-text" },
};

const genderLabel: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  prefer_not_to_say: "回答しない",
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
    fetch(`/api/candidates/${candidateId}`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        setCandidate(data.candidate);
        setEducation(data.education ?? []);
        setCareers(data.careers ?? []);
        setSkills(data.skills ?? []);
        setDocuments(data.documents ?? []);
        setInterviews(data.interviews ?? []);
      })
      .catch(() => setCandidate(null))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) return <LoadingScreen />;
  if (!candidate)
    return <p className="text-sm text-text-muted p-6">候補者が見つかりません。</p>;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/candidates"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          候補者一覧に戻る
        </Link>
        <Link
          href={`/dashboard/candidates/${candidateId}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-sub hover:bg-background transition-colors"
        >
          <Pencil className="h-4 w-4" />
          編集する
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left 60% */}
        <div className="col-span-3 space-y-5">
          {/* 基本情報 */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold mb-4">基本情報</h2>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-lg font-bold text-white shrink-0">
                {candidate.name[0]}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold">{candidate.name}</h3>
                {candidate.desired_position && (
                  <p className="text-sm text-accent">{candidate.desired_position}</p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 text-sm text-text-sub">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {candidate.email}
                  </span>
                  {candidate.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {candidate.phone}
                    </span>
                  )}
                  {candidate.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {candidate.location}
                    </span>
                  )}
                  {candidate.date_of_birth && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      {candidate.date_of_birth}
                    </span>
                  )}
                  {candidate.gender && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      {genderLabel[candidate.gender] ?? candidate.gender}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 希望条件 */}
          {(candidate.desired_position ||
            candidate.desired_salary ||
            candidate.available_from) && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold mb-4">希望条件</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {candidate.desired_position && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted">希望ポジション</p>
                      <p className="font-medium">{candidate.desired_position}</p>
                    </div>
                  </div>
                )}
                {candidate.desired_salary && (
                  <div className="flex items-start gap-2">
                    <Wallet className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted">希望年収</p>
                      <p className="font-medium">{candidate.desired_salary}</p>
                    </div>
                  </div>
                )}
                {candidate.available_from && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted">入社可能時期</p>
                      <p className="font-medium">{candidate.available_from}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 自己紹介 */}
          {candidate.self_introduction && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold mb-3">自己紹介・自己PR</h2>
              <p className="text-sm text-text-sub whitespace-pre-wrap leading-relaxed">
                {candidate.self_introduction}
              </p>
            </div>
          )}

          {/* 学歴・職歴 */}
          {(education.length > 0 || careers.length > 0) && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold mb-4">学歴・職歴</h2>
              <div className="space-y-0">
                {education.length > 0 && (
                  <>
                    <h3 className="text-xs font-medium text-text-muted mb-2">学歴</h3>
                    {education.map((e) => (
                      <div
                        key={e.id}
                        className="relative pl-5 pb-4 border-l-2 border-border-sub last:border-0"
                      >
                        <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-accent" />
                        <p className="text-sm font-medium">{e.institution}</p>
                        <p className="text-xs text-text-sub">{e.department}</p>
                        <p className="text-xs text-text-muted">
                          {e.period_start} - {e.period_end ?? "現在"}
                        </p>
                        {e.description && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {e.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                )}
                {careers.length > 0 && (
                  <>
                    <h3 className="text-xs font-medium text-text-muted mb-2 mt-3">
                      職歴
                    </h3>
                    {careers.map((c) => (
                      <div
                        key={c.id}
                        className="relative pl-5 pb-4 border-l-2 border-border-sub last:border-0"
                      >
                        <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-accent" />
                        <p className="text-sm font-medium">{c.company}</p>
                        <p className="text-xs text-text-sub">{c.title}</p>
                        <p className="text-xs text-text-muted">
                          {c.period_start} - {c.period_end ?? "現在"}
                        </p>
                        {c.description && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {c.description}
                          </p>
                        )}
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
                  const badge = statusBadge[iv.status] ?? {
                    label: iv.status,
                    className: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <Link
                      key={iv.id}
                      href={`/dashboard/interviews/${iv.id}`}
                      className="flex items-center justify-between rounded-lg border border-border-sub p-3 hover:bg-background transition-colors"
                    >
                      <p className="text-xs text-text-muted">
                        {new Date(iv.created_at).toLocaleDateString("ja-JP")}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          badge.className
                        )}
                      >
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
                  <div
                    key={d.id}
                    className="flex items-center gap-2.5 rounded-lg border border-border-sub p-3 hover:bg-background transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-accent" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-text-muted">
                        {(d.size_bytes / 1024).toFixed(0)} KB
                      </p>
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
