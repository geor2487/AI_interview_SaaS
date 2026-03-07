"use client";

import { ArrowLeft, FileText, Mail, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const candidate = {
  name: "佐藤 花子",
  email: "hanako@example.com",
  phone: "090-1234-5678",
  location: "東京都渋谷区",
  age: 28,
  position: "フロントエンドエンジニア",
};

const education = [
  { institution: "東京大学", department: "工学部 情報工学科", period: "2016年4月 - 2020年3月" },
  { institution: "東京大学大学院", department: "情報理工学系研究科", period: "2020年4月 - 2022年3月" },
];

const career = [
  { company: "株式会社テックコープ", title: "フロントエンドエンジニア", period: "2022年4月 - 現在", description: "React/Next.jsを用いたWebアプリ開発" },
  { company: "株式会社スタートアップX", title: "インターン", period: "2021年6月 - 2022年3月", description: "Vue.jsでの管理画面開発" },
];

const skills = [
  { name: "React", level: 90 },
  { name: "TypeScript", level: 85 },
  { name: "Next.js", level: 80 },
  { name: "CSS/Tailwind", level: 75 },
  { name: "Node.js", level: 60 },
];

const interviews = [
  { date: "2026-03-07", title: "フロントエンド基礎", status: "completed", score: 85 },
  { date: "2026-03-01", title: "コーディングテスト", status: "evaluated", score: 90 },
];

const documents = [
  { name: "履歴書.pdf", size: "245 KB" },
  { name: "職務経歴書.pdf", size: "312 KB" },
  { name: "ポートフォリオ.pdf", size: "1.2 MB" },
];

const statusBadge: Record<string, { label: string; className: string }> = {
  completed: { label: "完了", className: "bg-green-bg text-green" },
  evaluated: { label: "評価済", className: "bg-accent-light text-accent" },
  scheduled: { label: "予定", className: "bg-yellow-bg text-yellow" },
};

export default function CandidateDetailPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back */}
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
                <p className="text-sm text-accent">{candidate.position}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-sm text-text-sub">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{candidate.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{candidate.phone}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{candidate.location}</span>
                  <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{candidate.age}歳</span>
                </div>
              </div>
            </div>
          </div>

          {/* 学歴・職歴 */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold mb-4">学歴・職歴</h2>
            <div className="space-y-0">
              <h3 className="text-xs font-medium text-text-muted mb-2">学歴</h3>
              {education.map((e, i) => (
                <div key={i} className="relative pl-5 pb-4 border-l-2 border-border-sub last:border-0">
                  <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-accent" />
                  <p className="text-sm font-medium">{e.institution}</p>
                  <p className="text-xs text-text-sub">{e.department}</p>
                  <p className="text-xs text-text-muted">{e.period}</p>
                </div>
              ))}
              <h3 className="text-xs font-medium text-text-muted mb-2 mt-3">職歴</h3>
              {career.map((c, i) => (
                <div key={i} className="relative pl-5 pb-4 border-l-2 border-border-sub last:border-0">
                  <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-accent" />
                  <p className="text-sm font-medium">{c.company}</p>
                  <p className="text-xs text-text-sub">{c.title}</p>
                  <p className="text-xs text-text-muted">{c.period}</p>
                  <p className="text-xs text-text-muted mt-0.5">{c.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* スキル */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold mb-4">スキル</h2>
            <div className="space-y-3">
              {skills.map((s) => (
                <div key={s.name} className="space-y-1">
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
        </div>

        {/* Right 40% */}
        <div className="col-span-2 space-y-5">
          {/* 面接履歴 */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold mb-4">面接履歴</h2>
            <div className="space-y-3">
              {interviews.map((iv, i) => {
                const badge = statusBadge[iv.status];
                return (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border-sub p-3">
                    <div>
                      <p className="text-sm font-medium">{iv.title}</p>
                      <p className="text-xs text-text-muted">{iv.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", badge.className)}>
                        {badge.label}
                      </span>
                      <span className="text-sm font-bold">{iv.score}点</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI総合評価 */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold mb-4">AI総合評価</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-xl font-bold text-white">
                87
              </div>
              <div>
                <p className="text-sm font-medium">総合スコア</p>
                <span className="rounded-full bg-green-bg px-2.5 py-0.5 text-xs font-medium text-green">優秀</span>
              </div>
            </div>
            <p className="text-sm text-text-sub leading-relaxed">
              技術力・コミュニケーション能力ともに高い水準です。特にReactとTypeScriptに関する深い理解が見られ、実務経験に基づいた回答が印象的でした。チームワークへの意識も高く、即戦力として期待できます。
            </p>
          </div>

          {/* 提出書類 */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold mb-4">提出書類</h2>
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5 rounded-lg border border-border-sub p-3 hover:bg-background transition-colors cursor-pointer">
                  <FileText className="h-4 w-4 text-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-text-muted">{d.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
