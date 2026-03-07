"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Video,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "概要", href: "/dashboard", icon: LayoutDashboard, match: /^\/dashboard$/ },
  { label: "候補者", href: "/dashboard/candidates", icon: Users, match: /^\/dashboard\/candidates/ },
  { label: "質問セット", href: "/dashboard/question-sets", icon: MessageSquare, match: /^\/dashboard\/question-sets/ },
  { label: "面接", href: "/dashboard/interviews", icon: Video, match: /^\/dashboard\/interviews/ },
  { label: "設定", href: "/dashboard/settings", icon: Settings, match: /^\/dashboard\/settings/ },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-[210px] min-h-screen shrink-0 border-r border-border bg-surface">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-purple-500">
            <Video className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">InterviewAI</span>
        </div>
        <p className="mt-2 text-xs text-text-muted">Acme Corp.</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.match.test(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-accent-light text-accent-text"
                  : "text-text-sub hover:bg-accent-light/50 hover:text-accent-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-[11px] font-bold text-white">
            山
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">山田 太郎</p>
            <p className="truncate text-[11px] text-text-muted">管理者</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
