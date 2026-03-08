import type { ReactNode } from "react";
import { TopNav } from "@/components/dashboard/sidebar";
import { ChatPanel } from "@/components/dashboard/chat-panel";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 overflow-auto px-8 py-8">{children}</main>
      <ChatPanel />
    </div>
  );
}
