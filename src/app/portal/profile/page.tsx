"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Upload,
  Plus,
  Trash2,
  Save,
  Camera,
  FileText,
  FileUp,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { DatePicker } from "@/components/ui/date-picker";
import type { Candidate, CandidateDocument } from "@/types";

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

/** "2020-04-01" → "2020-04" (input type="month" 用) */
function toYearMonth(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 7); // "YYYY-MM"
}
const labelClass = "block text-[13px] font-medium text-foreground mb-1.5";
const sectionTitle = "text-base font-semibold text-foreground mb-4";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [careers, setCareers] = useState<CareerForm[]>([]);
  const [educations, setEducations] = useState<EducationForm[]>([]);
  const [skills, setSkills] = useState<SkillForm[]>([]);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // AI parsing state
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

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
      if (!authLoading) setLoading(false);
      return;
    }

    fetch("/api/portal/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.candidate) {
          setCandidate(data.candidate);
          setName(data.candidate.name);
          setDateOfBirth(data.candidate.date_of_birth ?? "");
          setGender(data.candidate.gender ?? "");
          setPhone(data.candidate.phone ?? "");
          setLocation(data.candidate.location ?? "");
          setSelfIntro(data.candidate.self_introduction ?? "");
          setDesiredPosition(data.candidate.desired_position ?? "");
          setDesiredSalary(data.candidate.desired_salary ?? "");
          setAvailableFrom(data.candidate.available_from ?? "");

          setCareers(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.careers ?? []).map((c: any) => ({
              id: c.id ?? crypto.randomUUID(),
              company: c.company,
              title: c.title,
              periodStart: c.period_start ?? "",
              periodEnd: c.period_end ?? "",
              description: c.description ?? "",
            }))
          );
          setEducations(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.educations ?? []).map((e: any) => ({
              id: e.id ?? crypto.randomUUID(),
              institution: e.institution,
              department: e.department,
              periodStart: e.period_start ?? "",
              periodEnd: e.period_end ?? "",
            }))
          );
          setSkills(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.skills ?? []).map((s: any) => ({
              id: s.id ?? crypto.randomUUID(),
              name: s.name,
              level: s.level,
            }))
          );
          setDocuments(data.documents ?? []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, authLoading]);

  const addCareer = () => {
    setCareers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), company: "", title: "", periodStart: "", periodEnd: "", description: "" },
    ]);
  };
  const removeCareer = (id: string) => setCareers((prev) => prev.filter((c) => c.id !== id));
  const updateCareer = (id: string, patch: Partial<CareerForm>) => {
    setCareers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addEducation = () => {
    setEducations((prev) => [
      ...prev,
      { id: crypto.randomUUID(), institution: "", department: "", periodStart: "", periodEnd: "" },
    ]);
  };
  const removeEducation = (id: string) => setEducations((prev) => prev.filter((e) => e.id !== id));
  const updateEducation = (id: string, patch: Partial<EducationForm>) => {
    setEducations((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const addSkill = () => {
    setSkills((prev) => [...prev, { id: crypto.randomUUID(), name: "", level: 50 }]);
  };
  const removeSkill = (id: string) => setSkills((prev) => prev.filter((s) => s.id !== id));
  const updateSkill = (id: string, patch: Partial<SkillForm>) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  /* ─── AI Resume Upload ─── */
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
      // Auto-fill (only overwrite if AI found a value)
      if (data.name) setName(data.name);
      if (data.phone) setPhone(data.phone);
      if (data.date_of_birth) setDateOfBirth(data.date_of_birth);
      if (data.gender) setGender(data.gender);
      if (data.location) setLocation(data.location);
      if (data.desired_position) setDesiredPosition(data.desired_position);
      if (data.desired_salary) setDesiredSalary(data.desired_salary);
      if (data.available_from) setAvailableFrom(data.available_from);
      if (data.self_introduction) setSelfIntro(data.self_introduction);
      if (data.education?.length) {
        setEducations(
          data.education.map(
            (e: { institution: string; department: string; period_start: string; period_end: string | null }) => ({
              id: crypto.randomUUID(),
              institution: e.institution ?? "",
              department: e.department ?? "",
              periodStart: toYearMonth(e.period_start),
              periodEnd: toYearMonth(e.period_end),
            })
          )
        );
      }
      if (data.careers?.length) {
        setCareers(
          data.careers.map(
            (c: { company: string; title: string; period_start: string; period_end: string | null; description: string }) => ({
              id: crypto.randomUUID(),
              company: c.company ?? "",
              title: c.title ?? "",
              periodStart: toYearMonth(c.period_start),
              periodEnd: toYearMonth(c.period_end),
              description: c.description ?? "",
            })
          )
        );
      }
      if (data.skills?.length) {
        setSkills(
          data.skills.map((s: { name: string; level: number }) => ({
            id: crypto.randomUUID(),
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

  /* ─── Save ─── */
  const handleSave = useCallback(async () => {
    if (!name) return;
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basicInfo: {
            name,
            phone,
            date_of_birth: dateOfBirth || null,
            gender,
            location,
            desired_position: desiredPosition,
            desired_salary: desiredSalary,
            available_from: availableFrom,
            self_introduction: selfIntro,
          },
          educations: educations.map((e) => ({
            institution: e.institution,
            department: e.department,
            period_start: e.periodStart,
            period_end: e.periodEnd || null,
          })),
          careers: careers.map((c) => ({
            company: c.company,
            title: c.title,
            period_start: c.periodStart,
            period_end: c.periodEnd || null,
            description: c.description,
          })),
          skills: skills.map((s) => ({
            name: s.name,
            level: s.level,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "保存に失敗しました。");
        return;
      }

      setSavedMsg("保存しました");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch {
      alert("保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }, [name, phone, dateOfBirth, gender, location, desiredPosition, desiredSalary, availableFrom, selfIntro, educations, careers, skills]);

  if (loading) return <LoadingScreen />;

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
      {/* AI解析中オーバーレイ */}
      {parsing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface border border-border p-10 shadow-xl">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-accent animate-pulse" />
            </div>
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
            <p className="text-base font-semibold text-foreground">AIが履歴書を解析中...</p>
            <p className="text-sm text-text-muted">しばらくお待ちください</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">プロフィール</h1>
        <p className="mt-1 text-sm text-text-muted">あなたの情報を登録・編集できます</p>
      </div>

      {/* ─── AI自動入力 ─── */}
      <section className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-5 space-y-3">
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
        {parseError && <p className="text-xs text-red">{parseError}</p>}
      </section>

      {/* 基本情報 */}
      <section className="bg-surface rounded-2xl border border-border p-6">
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
              <DatePicker value={dateOfBirth} onChange={setDateOfBirth} placeholder="生年月日を選択" />
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
      <section className="bg-surface rounded-2xl border border-border p-6">
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
                    <input type="text" value={career.company} onChange={(e) => updateCareer(career.id, { company: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>役職・ポジション</label>
                    <input type="text" value={career.title} onChange={(e) => updateCareer(career.id, { title: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>開始</label>
                    <input type="month" value={career.periodStart} onChange={(e) => updateCareer(career.id, { periodStart: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>終了</label>
                    <input type="month" value={career.periodEnd} onChange={(e) => updateCareer(career.id, { periodEnd: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>職務内容</label>
                  <textarea value={career.description} onChange={(e) => updateCareer(career.id, { description: e.target.value })} rows={2} className={cn(inputClass, "h-auto py-2 resize-none")} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 学歴 */}
      <section className="bg-surface rounded-2xl border border-border p-6">
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
                    <input type="text" value={edu.institution} onChange={(e) => updateEducation(edu.id, { institution: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>学部・学科</label>
                    <input type="text" value={edu.department} onChange={(e) => updateEducation(edu.id, { department: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>入学</label>
                    <input type="month" value={edu.periodStart} onChange={(e) => updateEducation(edu.id, { periodStart: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>卒業</label>
                    <input type="month" value={edu.periodEnd} onChange={(e) => updateEducation(edu.id, { periodEnd: e.target.value })} className={inputClass} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* スキル */}
      <section className="bg-surface rounded-2xl border border-border p-6">
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
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                  placeholder="スキル名"
                  className={cn(inputClass, "w-40 shrink-0")}
                />
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skill.level}
                    onChange={(e) => updateSkill(skill.id, { level: Number(e.target.value) })}
                    className="flex-1 h-2 accent-accent"
                  />
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
      <section className="bg-surface rounded-2xl border border-border p-6">
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
      <section className="bg-surface rounded-2xl border border-border p-6">
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
            <DatePicker value={availableFrom} onChange={setAvailableFrom} placeholder="入社可能日を選択" />
          </div>
        </div>
      </section>

      {/* 書類 */}
      <section className="bg-surface rounded-2xl border border-border p-6">
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
      <div className="flex items-center justify-end gap-3">
        {savedMsg && (
          <span className="text-sm text-green font-medium">{savedMsg}</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !name}
          className={cn(
            "h-11 px-8 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all",
            "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
            "shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Save className="h-4 w-4" />
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}
