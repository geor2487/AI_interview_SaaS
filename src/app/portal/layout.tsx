"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Video, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

const navItems = [
  { label: "マイページ", href: "/portal" },
  { label: "面接", href: "/portal/interviews" },
  { label: "プロフィール", href: "/portal/profile" },
  { label: "メッセージ", href: "/portal/messages" },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name ?? "ユーザー";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 h-14 bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-purple-500">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground">InterviewAI</span>
          </div>

          {/* Center Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-accent-light text-accent-text"
                      : "text-text-sub hover:text-foreground hover:bg-accent-light/50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <button className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent-light/50 transition-colors text-text-sub hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-[11px] font-bold text-white">
                {fullName[0]}
              </div>
              <span className="text-[13px] font-medium text-foreground hidden sm:block">{fullName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[800px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
