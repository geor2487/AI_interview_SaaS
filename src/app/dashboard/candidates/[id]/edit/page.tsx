"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowLeft, CheckCircle2, FileUp, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { DatePicker } from "@/components/ui/date-picker";
import type {
  Candidate,
  CandidateEducation,
  CandidateCareer,
  CandidateSkill,
} from "@/types";

/* ─── helpers ─── */
const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition";
const labelClass = "block text-xs font-medium text-text-sub mb-1";

interface EduDraft {
  institution: string;
  department: string;
  period_start: string;
  period_end: string;
  description: string;
}
interface CareerDraft {
  company: string;
  title: string;
  period_start: string;
  period_end: string;
  description: string;
}
interface SkillDraft {
  name: string;
  level: number;
}

const emptyEdu: EduDraft = { institution: "", department: "", period_start: "", period_end: "", description: "" };
const emptyCareer: CareerDraft = { company: "", title: "", period_start: "", period_end: "", description: "" };
const emptySkill: SkillDraft = { name: "", level: 50 };

const skillPresets = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C#",
  "C++",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Node.js",
  "Django",
  "Rails",
  "Spring Boot",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "Terraform",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST API",
  "Git",
  "CI/CD",
  "Linux",
  "Figma",
  "UI/UX デザイン",
  "プロジェクトマネジメント",
  "アジャイル / スクラム",
  "データ分析",
  "機械学習",
  "セキュリティ",
];

/* ─── Profile completion config ─── */
interface CompletionItem {
  label: string;
  check: (ctx: CompletionCtx) => boolean;
  weight: number;
}
interface CompletionCtx {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  location: string;
  desiredPosition: string;
  desiredSalary: string;
  availableFrom: string;
  selfIntroduction: string;
  educations: EduDraft[];
  careers: CareerDraft[];
  skills: SkillDraft[];
}

const completionItems: CompletionItem[] = [
  { label: "氏名", check: (c) => !!c.name, weight: 10 },
  { label: "メールアドレス", check: (c) => !!c.email, weight: 10 },
  { label: "電話番号", check: (c) => !!c.phone, weight: 8 },
  { label: "生年月日", check: (c) => !!c.dateOfBirth, weight: 5 },
  { label: "性別", check: (c) => !!c.gender, weight: 3 },
  { label: "居住地", check: (c) => !!c.location, weight: 7 },
  { label: "希望ポジション", check: (c) => !!c.desiredPosition, weight: 10 },
  { label: "希望年収", check: (c) => !!c.desiredSalary, weight: 7 },
  { label: "入社可能時期", check: (c) => !!c.availableFrom, weight: 5 },
  { label: "自己紹介・自己PR", check: (c) => !!c.selfIntroduction, weight: 12 },
  { label: "学歴（1件以上）", check: (c) => c.educations.some((e) => !!e.institution), weight: 10 },
  { label: "職歴（1件以上）", check: (c) => c.careers.some((e) => !!e.company), weight: 10 },
  { label: "スキル（1件以上）", check: (c) => c.skills.some((s) => !!s.name), weight: 3 },
];

function calcCompletion(ctx: CompletionCtx) {
  let earned = 0;
  let total = 0;
  const details = completionItems.map((item) => {
    const done = item.check(ctx);
    total += item.weight;
    if (done) earned += item.weight;
    return { ...item, done };
  });
  return { percent: total > 0 ? Math.round((earned / total) * 100) : 0, details };
}

export default function CandidateEditPage() {
  const params = useParams();
  const candidateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  // Basic info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [desiredPosition, setDesiredPosition] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [selfIntroduction, setSelfIntroduction] = useState("");

  // Sub-resources
  const [educations, setEducations] = useState<EduDraft[]>([]);
  const [careers, setCareers] = useState<CareerDraft[]>([]);
  const [skills, setSkills] = useState<SkillDraft[]>([]);
  const [customSkillIdxs, setCustomSkillIdxs] = useState<Set<number>>(new Set());

  const completion = useMemo(
    () =>
      calcCompletion({
        name, email, phone, dateOfBirth, gender, location,
        desiredPosition, desiredSalary, availableFrom, selfIntroduction,
        educations, careers, skills,
      }),
    [name, email, phone, dateOfBirth, gender, location, desiredPosition, desiredSalary, availableFrom, selfIntroduction, educations, careers, skills]
  );

  useEffect(() => {
    fetch(`/api/candidates/${candidateId}`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        const c: Candidate = data.candidate;
        setName(c.name);
        setEmail(c.email);
        setPhone(c.phone ?? "");
        setDateOfBirth(c.date_of_birth ?? "");
        setGender(c.gender ?? "");
        setLocation(c.location ?? "");
        setDesiredPosition(c.desired_position ?? "");
        setDesiredSalary(c.desired_salary ?? "");
        setAvailableFrom(c.available_from ?? "");
        setSelfIntroduction(c.self_introduction ?? "");

        setEducations(
          (data.education as CandidateEducation[]).map((e) => ({
            institution: e.institution,
            department: e.department,
            period_start: e.period_start ?? "",
            period_end: e.period_end ?? "",
            description: e.description ?? "",
          }))
        );
        setCareers(
          (data.careers as CandidateCareer[]).map((c) => ({
            company: c.company,
            title: c.title,
            period_start: c.period_start ?? "",
            period_end: c.period_end ?? "",
            description: c.description ?? "",
          }))
        );
        setSkills(
          (data.skills as CandidateSkill[]).map((s) => ({
            name: s.name,
            level: s.level,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId]);

  const handleSave = useCallback(async () => {
    if (!name || !email) return;
    setSaving(true);
    setSavedMsg("");
    try {
      const results = await Promise.all([
        fetch(`/api/candidates/${candidateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            date_of_birth: dateOfBirth || null,
            gender,
            location,
            desired_position: desiredPosition,
            desired_salary: desiredSalary,
            available_from: availableFrom,
            self_introduction: selfIntroduction,
          }),
        }),
        fetch(`/api/candidates/${candidateId}/education`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: educations.filter((e) => e.institution) }),
        }),
        fetch(`/api/candidates/${candidateId}/careers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: careers.filter((c) => c.company) }),
        }),
        fetch(`/api/candidates/${candidateId}/skills`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: skills.filter((s) => s.name) }),
        }),
      ]);

      const failed = results.find((r) => !r.ok);
      if (failed) {
        const err = await failed.json();
        alert(err.error || "保存に失敗しました。");
        return;
      }

      setSavedMsg("保存しました");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch {
      alert("保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }, [
    candidateId, name, email, phone, dateOfBirth, gender, location,
    desiredPosition, desiredSalary, availableFrom, selfIntroduction,
    educations, careers, skills,
  ]);

  /* ─── resume upload ─── */
  const handleResumeUpload = useCallback(async (file: File) => {
    setParsing(true);
    setParseError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/candidates/parse-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || "解析に失敗しました。");
        return;
      }
      // Auto-fill fields (only overwrite if AI found a value)
      if (data.name) setName(data.name);
      if (data.email) setEmail(data.email);
      if (data.phone) setPhone(data.phone);
      if (data.date_of_birth) setDateOfBirth(data.date_of_birth);
      if (data.gender) setGender(data.gender);
      if (data.location) setLocation(data.location);
      if (data.desired_position) setDesiredPosition(data.desired_position);
      if (data.desired_salary) setDesiredSalary(data.desired_salary);
      if (data.available_from) setAvailableFrom(data.available_from);
      if (data.self_introduction) setSelfIntroduction(data.self_introduction);
      if (data.education?.length) {
        setEducations(
          data.education.map((e: { institution: string; department: string; period_start: string; period_end: string | null; description: string }) => ({
            institution: e.institution ?? "",
            department: e.department ?? "",
            period_start: e.period_start ?? "",
            period_end: e.period_end ?? "",
            description: e.description ?? "",
          }))
        );
      }
      if (data.careers?.length) {
        setCareers(
          data.careers.map((c: { company: string; title: string; period_start: string; period_end: string | null; description: string }) => ({
            company: c.company ?? "",
            title: c.title ?? "",
            period_start: c.period_start ?? "",
            period_end: c.period_end ?? "",
            description: c.description ?? "",
          }))
        );
      }
      if (data.skills?.length) {
        setSkills(
          data.skills.map((s: { name: string; level: number }) => ({
            name: s.name ?? "",
            level: s.level ?? 50,
          }))
        );
      }
    } catch {
      setParseError("解析中にエラーが発生しました。");
    } finally {
      setParsing(false);
    }
  }, []);

  /* ─── list helpers ─── */
  function updateEdu(idx: number, patch: Partial<EduDraft>) {
    setEducations((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }
  function updateCareer(idx: number, patch: Partial<CareerDraft>) {
    setCareers((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }
  function updateSkill(idx: number, patch: Partial<SkillDraft>) {
    setSkills((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  if (loading) return <LoadingScreen />;

  const completionColor =
    completion.percent >= 80
      ? "from-green to-emerald-400"
      : completion.percent >= 50
        ? "from-yellow to-amber-400"
        : "from-red to-orange-400";

  const missingItems = completion.details.filter((d) => !d.done);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/candidates/${candidateId}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          詳細に戻る
        </Link>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className="text-sm text-green font-medium">{savedMsg}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !name || !email}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>

      <h1 className="text-xl font-bold">候補者情報の編集</h1>

      {/* ─── プロフィール完成度 ─── */}
      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">プロフィール完成度</h2>
          <span
            className={cn(
              "text-2xl font-bold",
              completion.percent >= 80
                ? "text-green"
                : completion.percent >= 50
                  ? "text-yellow"
                  : "text-red"
            )}
          >
            {completion.percent}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-background overflow-hidden">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", completionColor)}
            style={{ width: `${completion.percent}%` }}
          />
        </div>
        {completion.percent < 100 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-text-muted">
              未入力の項目（あと{missingItems.length}項目）
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingItems.map((item) => (
                <span
                  key={item.label}
                  className="rounded-full bg-background px-2.5 py-1 text-xs text-text-muted"
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}
        {completion.percent === 100 && (
          <div className="flex items-center gap-2 text-green">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">全項目が入力済みです</span>
          </div>
        )}
      </section>

      {/* ─── AI書類解析 ─── */}
      <section className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-accent">AIで自動入力</h2>
        </div>
        <p className="text-xs text-text-sub">
          履歴書・職務経歴書をアップロードすると、AIが内容を解析してプロフィールを自動入力します。
        </p>
        <div className="flex items-center gap-3">
          <label
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-surface px-4 py-2.5 text-sm font-medium text-accent cursor-pointer hover:bg-accent/10 transition-colors",
              parsing && "opacity-50 pointer-events-none"
            )}
          >
            {parsing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            {parsing ? "解析中..." : "ファイルを選択"}
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              disabled={parsing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleResumeUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          <span className="text-xs text-text-muted">PDF / Word (.docx) / テキスト</span>
        </div>
        {parseError && (
          <p className="text-xs text-red">{parseError}</p>
        )}
      </section>

      {/* ─── 基本情報 ─── */}
      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold">基本情報</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              氏名 <span className="text-red">*</span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              メールアドレス <span className="text-red">*</span>
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>電話番号</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="例: 090-1234-5678" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>生年月日</label>
            <DatePicker value={dateOfBirth} onChange={setDateOfBirth} placeholder="生年月日を選択" />
          </div>
          <div>
            <label className={labelClass}>性別</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
              <option value="">未選択</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">その他</option>
              <option value="prefer_not_to_say">回答しない</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>居住地</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="例: 東京都渋谷区" className={inputClass} />
          </div>
        </div>
      </section>

      {/* ─── 希望条件 ─── */}
      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold">希望条件</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>希望ポジション</label>
            <input type="text" value={desiredPosition} onChange={(e) => setDesiredPosition(e.target.value)} placeholder="例: フロントエンドエンジニア" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>希望年収</label>
            <input type="text" value={desiredSalary} onChange={(e) => setDesiredSalary(e.target.value)} placeholder="例: 600万円〜800万円" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>入社可能時期</label>
            <DatePicker value={availableFrom} onChange={setAvailableFrom} placeholder="入社可能時期を選択" />
          </div>
        </div>
      </section>

      {/* ─── 自己紹介 ─── */}
      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold">自己紹介・自己PR</h2>
        <textarea
          value={selfIntroduction}
          onChange={(e) => setSelfIntroduction(e.target.value)}
          rows={5}
          placeholder="候補者の経歴やアピールポイントを記載してください..."
          className={inputClass + " resize-y"}
        />
      </section>

      {/* ─── 学歴 ─── */}
      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">学歴</h2>
          <button
            type="button"
            onClick={() => setEducations((prev) => [...prev, { ...emptyEdu }])}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-sub hover:bg-background transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            追加
          </button>
        </div>
        {educations.length === 0 && (
          <p className="text-sm text-text-muted">学歴が登録されていません。</p>
        )}
        {educations.map((edu, idx) => (
          <div key={idx} className="relative rounded-lg border border-border-sub p-4 space-y-3">
            <button
              type="button"
              onClick={() => setEducations((prev) => prev.filter((_, i) => i !== idx))}
              className="absolute top-3 right-3 p-1 rounded-md text-text-muted hover:text-red hover:bg-red-bg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>学校名</label>
                <input type="text" value={edu.institution} onChange={(e) => updateEdu(idx, { institution: e.target.value })} placeholder="例: 東京大学" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>学部・学科</label>
                <input type="text" value={edu.department} onChange={(e) => updateEdu(idx, { department: e.target.value })} placeholder="例: 工学部 情報工学科" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>開始日</label>
                <DatePicker value={edu.period_start} onChange={(v) => updateEdu(idx, { period_start: v })} placeholder="開始日を選択" />
              </div>
              <div>
                <label className={labelClass}>終了日</label>
                <DatePicker value={edu.period_end} onChange={(v) => updateEdu(idx, { period_end: v })} placeholder="終了日を選択" />
              </div>
            </div>
            <div>
              <label className={labelClass}>補足</label>
              <input type="text" value={edu.description} onChange={(e) => updateEdu(idx, { description: e.target.value })} placeholder="例: GPA 3.8 / 4.0" className={inputClass} />
            </div>
          </div>
        ))}
      </section>

      {/* ─── 職歴 ─── */}
      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">職歴</h2>
          <button
            type="button"
            onClick={() => setCareers((prev) => [...prev, { ...emptyCareer }])}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-sub hover:bg-background transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            追加
          </button>
        </div>
        {careers.length === 0 && (
          <p className="text-sm text-text-muted">職歴が登録されていません。</p>
        )}
        {careers.map((career, idx) => (
          <div key={idx} className="relative rounded-lg border border-border-sub p-4 space-y-3">
            <button
              type="button"
              onClick={() => setCareers((prev) => prev.filter((_, i) => i !== idx))}
              className="absolute top-3 right-3 p-1 rounded-md text-text-muted hover:text-red hover:bg-red-bg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>会社名</label>
                <input type="text" value={career.company} onChange={(e) => updateCareer(idx, { company: e.target.value })} placeholder="例: 株式会社〇〇" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>役職・ポジション</label>
                <input type="text" value={career.title} onChange={(e) => updateCareer(idx, { title: e.target.value })} placeholder="例: シニアエンジニア" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>開始日</label>
                <DatePicker value={career.period_start} onChange={(v) => updateCareer(idx, { period_start: v })} placeholder="開始日を選択" />
              </div>
              <div>
                <label className={labelClass}>終了日</label>
                <DatePicker value={career.period_end} onChange={(v) => updateCareer(idx, { period_end: v })} placeholder="終了日を選択" />
              </div>
            </div>
            <div>
              <label className={labelClass}>業務内容</label>
              <textarea value={career.description} onChange={(e) => updateCareer(idx, { description: e.target.value })} rows={2} placeholder="担当業務や実績を記載..." className={inputClass + " resize-y"} />
            </div>
          </div>
        ))}
      </section>

      {/* ─── スキル ─── */}
      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">スキル</h2>
          <button
            type="button"
            onClick={() => setSkills((prev) => [...prev, { ...emptySkill }])}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-sub hover:bg-background transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            追加
          </button>
        </div>
        {skills.length === 0 && (
          <p className="text-sm text-text-muted">スキルが登録されていません。</p>
        )}
        {skills.map((skill, idx) => {
          const selectedSkills = skills.map((s) => s.name).filter(Boolean);
          const availablePresets = skillPresets.filter(
            (p) => p === skill.name || !selectedSkills.includes(p)
          );
          const isCustom = customSkillIdxs.has(idx) || (skill.name !== "" && !skillPresets.includes(skill.name));
          return (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex-1 flex gap-2">
              <select
                value={isCustom ? "__custom__" : skill.name}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__custom__") {
                    setCustomSkillIdxs((prev) => new Set(prev).add(idx));
                    updateSkill(idx, { name: "" });
                  } else {
                    setCustomSkillIdxs((prev) => {
                      const next = new Set(prev);
                      next.delete(idx);
                      return next;
                    });
                    updateSkill(idx, { name: v });
                  }
                }}
                className={cn(inputClass, isCustom && "w-1/2")}
              >
                <option value="">スキルを選択...</option>
                {availablePresets.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                <option value="__custom__">その他（自由入力）</option>
              </select>
              {isCustom && (
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(idx, { name: e.target.value })}
                  placeholder="スキル名を入力..."
                  className={cn(inputClass, "w-1/2")}
                  autoFocus
                />
              )}
            </div>
            <div className="w-24">
              <input
                type="number"
                min={0}
                max={100}
                value={skill.level}
                onChange={(e) => updateSkill(idx, { level: Number(e.target.value) })}
                className={inputClass + " text-center"}
              />
            </div>
            <span className="text-xs text-text-muted w-4">%</span>
            <button
              type="button"
              onClick={() => setSkills((prev) => prev.filter((_, i) => i !== idx))}
              className="p-1 rounded-md text-text-muted hover:text-red hover:bg-red-bg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          );
        })}
      </section>

      {/* ─── 下部保存ボタン ─── */}
      <div className="flex justify-end pb-10">
        <button
          onClick={handleSave}
          disabled={saving || !name || !email}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}
