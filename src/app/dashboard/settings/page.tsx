"use client";

import { useEffect, useState } from "react";
import { Building2, Cog, BarChart3, Bell, Mail, Users, Save, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";

const sections = [
  { key: "org", label: "組織情報", icon: Building2 },
  { key: "interview", label: "面接設定", icon: Cog },
  { key: "evaluation", label: "評価設定", icon: BarChart3 },
  { key: "notification", label: "通知", icon: Bell },
  { key: "email", label: "メールテンプレート", icon: Mail },
  { key: "members", label: "メンバー", icon: Users },
] as const;

type SectionKey = (typeof sections)[number]["key"];

const emailTemplates = [
  {
    key: "invitation",
    label: "面接招待メール",
    desc: "候補者に面接リンクを送信",
    defaultSubject: "【{{company_name}}】面接のご案内",
    defaultBody: `{{candidate_name}} 様

この度は{{company_name}}にご応募いただき、誠にありがとうございます。

書類選考の結果、ぜひ面接にお進みいただきたくご連絡いたしました。
下記のリンクより、AI面接にご参加ください。

■ 面接リンク
{{interview_url}}

■ 面接時間
約{{duration}}分

■ 注意事項
・静かな環境でご参加ください
・カメラとマイクの使用を許可してください
・安定したインターネット接続をご確認ください

ご不明な点がございましたら、お気軽にお問い合わせください。

{{company_name}}
採用担当`,
  },
  {
    key: "reminder",
    label: "リマインダーメール",
    desc: "面接前日のリマインド",
    defaultSubject: "【リマインド】明日の面接について - {{company_name}}",
    defaultBody: `{{candidate_name}} 様

明日の面接についてリマインドいたします。

■ 面接日時
{{interview_date}}

■ 面接リンク
{{interview_url}}

■ 所要時間
約{{duration}}分

準備が整いましたら、上記リンクよりご参加ください。
ご不明な点がございましたら、お気軽にお問い合わせください。

{{company_name}}
採用担当`,
  },
  {
    key: "completion",
    label: "面接完了メール",
    desc: "面接後のお礼・次のステップ案内",
    defaultSubject: "【{{company_name}}】面接完了のお知らせ",
    defaultBody: `{{candidate_name}} 様

本日は面接にご参加いただき、誠にありがとうございました。

選考結果につきましては、{{result_days}}営業日以内にご連絡いたします。
今しばらくお待ちくださいますようお願いいたします。

ご不明な点がございましたら、お気軽にお問い合わせください。

{{company_name}}
採用担当`,
  },
  {
    key: "rejection",
    label: "不採用通知メール",
    desc: "選考結果のお知らせ",
    defaultSubject: "【{{company_name}}】選考結果のご連絡",
    defaultBody: `{{candidate_name}} 様

この度は{{company_name}}の選考にご参加いただき、誠にありがとうございました。

慎重に検討いたしました結果、誠に残念ではございますが、
今回はご期待に沿えない結果となりました。

{{candidate_name}}様の今後のご活躍を心よりお祈り申し上げます。

{{company_name}}
採用担当`,
  },
] as const;

type EmailTemplateKey = (typeof emailTemplates)[number]["key"];

export default function SettingsPage() {
  const { orgId, organization } = useOrganization();
  const [activeSection, setActiveSection] = useState<SectionKey>("org");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateKey | null>(null);
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);

  const openTemplateEditor = (key: EmailTemplateKey) => {
    const tmpl = emailTemplates.find((t) => t.key === key)!;
    setTemplateSubject(tmpl.defaultSubject);
    setTemplateBody(tmpl.defaultBody);
    setEditingTemplate(key);
    setTemplateSaved(false);
  };

  const handleTemplateSave = () => {
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2000);
  };

  useEffect(() => {
    if (organization) {
      setName(organization.name ?? "");
      setAddress(organization.address ?? "");
      setPhone(organization.phone ?? "");
      setWebsite(organization.website ?? "");
    }
  }, [organization]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    await supabase
      .from("organizations")
      .update({ name, address, phone, website })
      .eq("id", orgId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition";

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-bold mb-6">設定</h1>

      <div className="grid grid-cols-4 gap-6">
        {/* Left navigation */}
        <div className="col-span-1">
          <nav className="space-y-0.5">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors text-left",
                    isActive
                      ? "bg-accent-light text-accent-text"
                      : "text-text-sub hover:bg-accent-light/50 hover:text-accent-text"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right content */}
        <div className="col-span-3">
          {activeSection === "org" && (
            <div className="rounded-lg border border-border bg-surface p-6 space-y-5">
              <h2 className="text-base font-semibold">組織情報</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">会社名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">住所</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">電話番号</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Webサイト</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "保存中..." : "保存する"}
                  </button>
                  {saved && (
                    <span className="text-sm text-green">保存しました</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === "interview" && (
            <div className="rounded-lg border border-border bg-surface p-6 space-y-5">
              <h2 className="text-base font-semibold">面接設定</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">デフォルトの面接時間（分）</label>
                  <input type="number" defaultValue={30} min={10} max={120} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">質問数の上限</label>
                  <input type="number" defaultValue={10} min={1} max={50} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">面接形式</label>
                  <select className={inputClass}>
                    <option value="ai">AI自動面接</option>
                    <option value="live">ライブ面接</option>
                    <option value="hybrid">ハイブリッド</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="auto-record" defaultChecked className="rounded border-border" />
                  <label htmlFor="auto-record" className="text-sm">面接を自動で録画する</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="auto-transcript" defaultChecked className="rounded border-border" />
                  <label htmlFor="auto-transcript" className="text-sm">自動文字起こしを有効にする</label>
                </div>
              </div>
            </div>
          )}

          {activeSection === "evaluation" && (
            <div className="rounded-lg border border-border bg-surface p-6 space-y-5">
              <h2 className="text-base font-semibold">評価設定</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">評価スケール</label>
                  <select className={inputClass}>
                    <option value="5">5段階評価</option>
                    <option value="10">10段階評価</option>
                    <option value="letter">A〜E評価</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">デフォルト評価項目</label>
                  <div className="space-y-2">
                    {["コミュニケーション能力", "技術スキル", "問題解決力", "チームワーク", "リーダーシップ"].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="rounded border-border" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="ai-scoring" defaultChecked className="rounded border-border" />
                  <label htmlFor="ai-scoring" className="text-sm">AIによる自動スコアリングを有効にする</label>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notification" && (
            <div className="rounded-lg border border-border bg-surface p-6 space-y-5">
              <h2 className="text-base font-semibold">通知</h2>
              <div className="space-y-4">
                <p className="text-sm text-text-muted">通知の受信方法とタイミングを設定します。</p>
                <div className="space-y-3">
                  {[
                    { id: "notif-new-application", label: "新しい応募があった時" },
                    { id: "notif-interview-scheduled", label: "面接がスケジュールされた時" },
                    { id: "notif-interview-completed", label: "面接が完了した時" },
                    { id: "notif-evaluation-submitted", label: "評価が提出された時" },
                    { id: "notif-reminder", label: "面接のリマインダー" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <label htmlFor={item.id} className="text-sm">{item.label}</label>
                      <input type="checkbox" id={item.id} defaultChecked className="rounded border-border" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">リマインダーのタイミング</label>
                  <select className={inputClass}>
                    <option value="30">30分前</option>
                    <option value="60">1時間前</option>
                    <option value="1440">1日前</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === "email" && (
            <div className="rounded-lg border border-border bg-surface p-6 space-y-5">
              {editingTemplate === null ? (
                <>
                  <h2 className="text-base font-semibold">メールテンプレート</h2>
                  <div className="space-y-4">
                    <p className="text-sm text-text-muted">候補者への自動送信メールのテンプレートを管理します。</p>
                    <div className="space-y-3">
                      {emailTemplates.map((tmpl) => (
                        <div key={tmpl.key} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{tmpl.label}</p>
                            <p className="text-xs text-text-muted">{tmpl.desc}</p>
                          </div>
                          <button
                            onClick={() => openTemplateEditor(tmpl.key)}
                            className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                          >
                            編集
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="rounded-lg p-1.5 hover:bg-background transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 text-text-sub" />
                    </button>
                    <h2 className="text-base font-semibold">
                      {emailTemplates.find((t) => t.key === editingTemplate)?.label}
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">件名</label>
                      <input
                        type="text"
                        value={templateSubject}
                        onChange={(e) => setTemplateSubject(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">本文</label>
                      <textarea
                        value={templateBody}
                        onChange={(e) => setTemplateBody(e.target.value)}
                        rows={16}
                        className={cn(inputClass, "resize-y leading-relaxed")}
                      />
                    </div>
                    <div className="rounded-lg bg-background border border-border-sub px-4 py-3">
                      <p className="text-xs font-medium text-text-sub mb-1.5">利用可能な変数</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["{{candidate_name}}", "{{company_name}}", "{{interview_url}}", "{{interview_date}}", "{{duration}}", "{{result_days}}"].map((v) => (
                          <code key={v} className="rounded bg-accent-light px-1.5 py-0.5 text-xs text-accent-text">
                            {v}
                          </code>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleTemplateSave}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        保存する
                      </button>
                      <button
                        onClick={() => setEditingTemplate(null)}
                        className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-background transition-colors"
                      >
                        キャンセル
                      </button>
                      {templateSaved && (
                        <span className="text-sm text-green">保存しました</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === "members" && (
            <div className="rounded-lg border border-border bg-surface p-6 space-y-5">
              <h2 className="text-base font-semibold">メンバー</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">チームメンバーの管理と権限の設定を行います。</p>
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
                    メンバーを招待
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "管理者ユーザー", email: "admin@example.com", role: "管理者" },
                    { name: "面接官A", email: "interviewer-a@example.com", role: "面接官" },
                    { name: "面接官B", email: "interviewer-b@example.com", role: "面接官" },
                  ].map((member) => (
                    <div key={member.email} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-text-muted">{member.email}</p>
                      </div>
                      <select defaultValue={member.role} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none">
                        <option value="管理者">管理者</option>
                        <option value="面接官">面接官</option>
                        <option value="閲覧者">閲覧者</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
