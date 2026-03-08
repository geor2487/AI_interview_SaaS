"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Video,
  Settings,
  ChevronDown,
  UserPlus,
  List,
  PlusCircle,
  ClipboardList,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useState, useRef, useEffect } from "react";

interface SubItem {
  label: string;
  href: string;
  description: string;
  icon: React.ElementType;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  match: RegExp;
  subItems?: SubItem[];
}

const navItems: NavItem[] = [
  {
    label: "概要",
    href: "/dashboard",
    icon: LayoutDashboard,
    match: /^\/dashboard$/,
  },
  {
    label: "候補者",
    href: "/dashboard/candidates",
    icon: Users,
    match: /^\/dashboard\/candidates/,
    subItems: [
      { label: "候補者一覧", href: "/dashboard/candidates", description: "登録済みの候補者を管理", icon: List },
      { label: "候補者を追加", href: "/dashboard/candidates?action=new", description: "新しい候補者を登録", icon: UserPlus },
    ],
  },
  {
    label: "質問セット",
    href: "/dashboard/question-sets",
    icon: MessageSquare,
    match: /^\/dashboard\/question-sets/,
    subItems: [
      { label: "質問セット一覧", href: "/dashboard/question-sets", description: "作成済みの質問セットを管理", icon: ClipboardList },
      { label: "新規作成", href: "/dashboard/question-sets/new", description: "新しい質問セットを作成", icon: PlusCircle },
    ],
  },
  {
    label: "面接",
    href: "/dashboard/interviews",
    icon: Video,
    match: /^\/dashboard\/interviews/,
    subItems: [
      { label: "面接一覧", href: "/dashboard/interviews", description: "すべての面接を確認", icon: List },
      { label: "面接を作成", href: "/dashboard/interviews/new", description: "新しい面接をセットアップ", icon: PlusCircle },
    ],
  },
  {
    label: "設定",
    href: "/dashboard/settings",
    icon: Settings,
    match: /^\/dashboard\/settings/,
  },
];

function NavDropdown({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const Icon = item.icon;

  if (!item.subItems) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2",
          isActive
            ? "border-accent text-accent"
            : "border-transparent text-text-sub hover:text-text hover:border-text-muted"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2",
          isActive
            ? "border-accent text-accent"
            : "border-transparent text-text-sub hover:text-text hover:border-text-muted"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </Link>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-0 w-64 rounded-xl border border-white/30 bg-white shadow-xl shadow-accent/8 py-2">
          {item.subItems.map((sub) => {
            const SubIcon = sub.icon;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                className="flex items-start gap-3 px-4 py-3 hover:bg-accent-light/50 transition-colors"
                onClick={() => setOpen(false)}
              >
                <SubIcon className="h-4 w-4 mt-0.5 text-text-muted" />
                <div>
                  <p className="text-sm font-medium text-text">{sub.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{sub.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { user, member, signOut } = useAuth();
  const fullName = user?.user_metadata?.full_name ?? "ユーザー";
  const orgName = member?.organizations?.name ?? "";
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/60 backdrop-blur-xl">
      <div className="flex items-center h-14 px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-8 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-purple-500">
            <Video className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold tracking-tight">InterviewAI</span>
            {orgName && <p className="text-[10px] text-text-muted leading-none">{orgName}</p>}
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = item.match.test(pathname);
            return <NavDropdown key={item.href} item={item} isActive={isActive} />;
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent-light/50 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-[11px] font-bold text-white">
              {fullName[0]}
            </div>
            <span className="text-sm font-medium">{fullName}</span>
            <ChevronDown className="h-3 w-3 text-text-muted" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-white/30 bg-white shadow-xl shadow-accent/8 py-1 z-50">
              <Link
                href="/dashboard/settings/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-sub hover:bg-accent-light/50 transition-colors"
              >
                <User className="h-4 w-4" />
                プロフィール
              </Link>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-sub hover:bg-accent-light/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export const Sidebar = TopNav;
