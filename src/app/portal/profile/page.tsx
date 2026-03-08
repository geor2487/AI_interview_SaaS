"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  Plus,
  Trash2,
  Save,
  Camera,
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { Candidate, CandidateCareer, CandidateEducation, CandidateSkill, CandidateDocument } from "@/types";

interface CareerForm {
  id: string;
  company: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  description: string;
}

interface EducationForm {
  id: string;
  institution: string;
  department: string;
  periodStart: string;
  periodEnd: string;
}

interface SkillForm {
  id: string;
  name: string;
  level: number;
}

const inputClass =
  "w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors";
const labelClass = "block text-[13px] font-medium text-foreground mb-1.5";
const sectionTitle = "text-base font-semibold text-foreground mb-4";

export default function ProfilePage() {
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [careers, setCareers] = useState<CareerForm[]>([]);
  const [educations, setEducations] = useState<EducationForm[]>([]);
  const [skills, setSkills] = useState<SkillForm[]>([]);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Basic info state
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [selfIntro, setSelfIntro] = useState("");
  const [desiredPosition, setDesiredPosition] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    supabase
      .from("candidates")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setCandidate(data);
          setName(data.name);
          setDateOfBirth(data.date_of_birth ?? "");
          setGender(data.gender ?? "");
          setPhone(data.phone ?? "");
          setLocation(data.location ?? "");
          setSelfIntro(data.self_introduction ?? "");
          setDesiredPosition(data.desired_position ?? "");
          setDesiredSalary(data.desired_salary ?? "");
          setAvailableFrom(data.available_from ?? "");

          // Fetch related data
          Promise.all([
            supabase.from("candidate_careers").select("*").eq("candidate_id", data.id).order("order_index"),
            supabase.from("candidate_educations").select("*").eq("candidate_id", data.id).order("order_index"),
            supabase.from("candidate_skills").select("*").eq("candidate_id", data.id),
            supabase.from("candidate_documents").select("*").eq("candidate_id", data.id),
          ]).then(([carRes, eduRes, skillRes, docRes]) => {
            setCareers((carRes.data ?? []).map((c) => ({
              id: c.id, company: c.company, title: c.title,
              periodStart: c.period_start, periodEnd: c.period_end ?? "",
              description: c.description,
            })));
            setEducations((eduRes.data ?? []).map((e) => ({
              id: e.id, institution: e.institution, department: e.department,
              periodStart: e.period_start, periodEnd: e.period_end ?? "",
            })));
            setSkills((skillRes.data ?? []).map((s) => ({ id: s.id, name: s.name, level: s.level })));
            setDocuments(docRes.data ?? []);
          });
        }
        setLoading(false);
      });
  }, [user]);

  const addCareer = () => {
    setCareers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), company: "", title: "", periodStart: "", periodEnd: "", description: "" },
    ]);
  };

  const removeCareer = (id: string) => setCareers((prev) => prev.filter((c) => c.id !== id));

  const addEducation = () => {
    setEducations((prev) => [
      ...prev,
      { id: crypto.randomUUID(), institution: "", department: "", periodStart: "", periodEnd: "" },
    ]);
  };

  const removeEducation = (id: string) => setEducations((prev) => prev.filter((e) => e.id !== id));

  const addSkill = () => {
    setSkills((prev) => [...prev, { id: crypto.randomUUID(), name: "", level: 50 }]);
  };

  const removeSkill = (id: string) => setSkills((prev) => prev.filter((s) => s.id !== id));

  if (loading) return <p className="text-sm text-text-muted p-6">プロフィールを取得できませんでした</p>;

  if (!candidate) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-foreground">プロフィール</h1>
        <p className="mt-2 text-sm text-text-muted">候補者プロフィールが見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">プロフィール</h1>
        <p className="mt-1 text-sm text-text-muted">あなたの情報を登録・編集できます</p>
      </div>

      {/* 基本情報 */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <h2 className={sectionTitle}>基本情報</h2>
        <div className="space-y-5">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {name?.[0] ?? "?"}
              <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-surface border border-border flex items-center justify-center text-text-sub hover:text-foreground transition-colors shadow-sm">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">プロフィール画像</p>
              <p className="text-xs text-text-muted mt-0.5">JPG, PNG (最大2MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>氏名</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>生年月日</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>性別</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
                <option value="unspecified">回答しない</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>電話番号</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>居住地</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      </section>

      {/* 職歴 */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn(sectionTitle, "mb-0")}>職歴</h2>
          <button onClick={addCareer} className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-text transition-colors">
            <Plus className="h-4 w-4" />
            追加
          </button>
        </div>
        {careers.length === 0 ? (
          <p className="text-sm text-text-muted">職歴が登録されていません。</p>
        ) : (
          <div className="space-y-4">
            {careers.map((career) => (
              <div key={career.id} className="rounded-lg border border-border-sub bg-background p-4 space-y-3 relative group">
                <button onClick={() => removeCareer(career.id)} className="absolute top-3 right-3 h-7 w-7 rounded-md flex items-center justify-center text-text-muted hover:text-red hover:bg-red-bg transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>会社名</label>
                    <input type="text" defaultValue={career.company} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>役職・ポジション</label>
                    <input type="text" defaultValue={career.title} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>開始</label>
                    <input type="month" defaultValue={career.periodStart} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>終了</label>
                    <input type="month" defaultValue={career.periodEnd} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>職務内容</label>
                  <textarea defaultValue={career.description} rows={2} className={cn(inputClass, "h-auto py-2 resize-none")} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 学歴 */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn(sectionTitle, "mb-0")}>学歴</h2>
          <button onClick={addEducation} className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-text transition-colors">
            <Plus className="h-4 w-4" />
            追加
          </button>
        </div>
        {educations.length === 0 ? (
          <p className="text-sm text-text-muted">学歴が登録されていません。</p>
        ) : (
          <div className="space-y-4">
            {educations.map((edu) => (
              <div key={edu.id} className="rounded-lg border border-border-sub bg-background p-4 space-y-3 relative group">
                <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 h-7 w-7 rounded-md flex items-center justify-center text-text-muted hover:text-red hover:bg-red-bg transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>学校名</label>
                    <input type="text" defaultValue={edu.institution} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>学部・学科</label>
                    <input type="text" defaultValue={edu.department} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>入学</label>
                    <input type="month" defaultValue={edu.periodStart} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>卒業</label>
                    <input type="month" defaultValue={edu.periodEnd} className={inputClass} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* スキル */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn(sectionTitle, "mb-0")}>スキル</h2>
          <button onClick={addSkill} className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-text transition-colors">
            <Plus className="h-4 w-4" />
            追加
          </button>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-text-muted">スキルが登録されていません。</p>
        ) : (
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill.id} className="flex items-center gap-3 group">
                <input type="text" defaultValue={skill.name} placeholder="スキル名" className={cn(inputClass, "w-40 shrink-0")} />
                <div className="flex-1 flex items-center gap-3">
                  <input type="range" min="0" max="100" defaultValue={skill.level} className="flex-1 h-2 accent-accent" />
                  <span className="text-xs font-medium text-text-sub w-10 text-right">{skill.level}%</span>
                </div>
                <button onClick={() => removeSkill(skill.id)} className="h-8 w-8 rounded-md flex items-center justify-center text-text-muted hover:text-red hover:bg-red-bg transition-colors opacity-0 group-hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 自己PR */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <h2 className={sectionTitle}>自己PR</h2>
        <textarea
          rows={5}
          value={selfIntro}
          onChange={(e) => setSelfIntro(e.target.value)}
          placeholder="自己PRを入力してください"
          className={cn(inputClass, "h-auto py-3 resize-none")}
        />
      </section>

      {/* 希望条件 */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <h2 className={sectionTitle}>希望条件</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>希望職種</label>
            <input type="text" value={desiredPosition} onChange={(e) => setDesiredPosition(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>希望年収</label>
            <input type="text" value={desiredSalary} onChange={(e) => setDesiredSalary(e.target.value)} placeholder="例: 600万円 ~ 800万円" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>入社可能日</label>
            <input type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* 書類 */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <h2 className={sectionTitle}>書類</h2>
        <div className="space-y-3">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-border-sub bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">{d.name}</p>
                  <p className="text-xs text-text-muted">{(d.size_bytes / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button className="text-text-muted hover:text-red transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-3 hover:border-accent/50 hover:bg-accent-light/20 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-text-muted" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">ファイルをドロップまたはクリック</p>
              <p className="text-xs text-text-muted mt-1">PDF, DOC, DOCX (最大10MB)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          className={cn(
            "h-11 px-8 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all",
            "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
            "shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
          )}
        >
          <Save className="h-4 w-4" />
          保存する
        </button>
      </div>
    </div>
  );
}
