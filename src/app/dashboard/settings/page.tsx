"use client";

import { useState } from "react";
import { Building2, Cog, BarChart3, Bell, Key, Mail, Users, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { key: "org", label: "組織情報", icon: Building2 },
  { key: "interview", label: "面接設定", icon: Cog },
  { key: "evaluation", label: "評価設定", icon: BarChart3 },
  { key: "notification", label: "通知", icon: Bell },
  { key: "api", label: "APIキー", icon: Key },
  { key: "email", label: "メールテンプレート", icon: Mail },
  { key: "members", label: "メンバー", icon: Users },
] as const;

type SectionKey = (typeof sections)[number]["key"];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("org");

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
                    defaultValue="Acme Corp."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">住所</label>
                  <input
                    type="text"
                    defaultValue="東京都渋谷区神宮前1-2-3"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">電話番号</label>
                    <input
                      type="tel"
                      defaultValue="03-1234-5678"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Webサイト</label>
                    <input
                      type="url"
                      defaultValue="https://acme-corp.example.com"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
                    <Save className="h-4 w-4" />
                    保存する
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection !== "org" && (
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="text-base font-semibold mb-3">
                {sections.find((s) => s.key === activeSection)?.label}
              </h2>
              <p className="text-sm text-text-muted">
                この設定セクションは開発中です。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
