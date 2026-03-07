"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Camera, Mic, Speaker, Wifi, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceCheck {
  label: string;
  icon: React.ElementType;
  status: "ready" | "error";
  statusLabel: string;
}

const deviceChecks: DeviceCheck[] = [
  { label: "カメラ", icon: Camera, status: "ready", statusLabel: "準備完了" },
  { label: "マイクロフォン", icon: Mic, status: "ready", statusLabel: "準備完了" },
  { label: "スピーカー", icon: Speaker, status: "ready", statusLabel: "準備完了" },
  { label: "ネットワーク", icon: Wifi, status: "ready", statusLabel: "良好" },
];

const cautions = [
  "静かな環境で受験してください",
  "面接中はブラウザを閉じないでください",
  "AIが質問を読み上げます",
];

export default function InterviewLobbyPage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const handleStart = () => {
    setStarting(true);
    setTimeout(() => {
      router.push("/interview/room/demo");
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Branding */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-500">
          <Video className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">InterviewAI</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-0">
          <h1 className="text-xl font-bold text-foreground">面接ロビー</h1>
          <p className="mt-1 text-sm text-text-muted">開始前にデバイスの確認を行います</p>
        </div>

        {/* Camera Preview */}
        <div className="px-8 pt-6">
          <div className="relative w-full aspect-video rounded-xl bg-[#09090b] flex items-center justify-center overflow-hidden">
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              <Camera className="h-10 w-10" />
              <span className="text-sm">カメラプレビュー</span>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-red animate-pulse" />
              <span className="text-[11px] text-white/80 font-medium">PREVIEW</span>
            </div>
          </div>
        </div>

        {/* Device Checks */}
        <div className="px-8 pt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">デバイスチェック</h2>
          <div className="space-y-2">
            {deviceChecks.map((device) => {
              const Icon = device.icon;
              return (
                <div
                  key={device.label}
                  className="flex items-center justify-between rounded-lg border border-border-sub bg-background px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-text-sub" />
                    <span className="text-sm font-medium text-foreground">{device.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {device.status === "ready" ? (
                      <CheckCircle2 className="h-4 w-4 text-green" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        device.status === "ready" ? "text-green" : "text-yellow"
                      )}
                    >
                      {device.statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cautions */}
        <div className="px-8 pt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">注意事項</h2>
          <div className="rounded-lg border border-yellow/20 bg-yellow-bg px-4 py-3 space-y-2">
            {cautions.map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow mt-0.5 shrink-0" />
                <span className="text-sm text-yellow">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="px-8 pt-8 pb-8">
          <button
            onClick={handleStart}
            disabled={starting}
            className={cn(
              "w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all",
              "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
              "shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40",
              "active:scale-[0.98]",
              starting && "opacity-60 cursor-not-allowed"
            )}
          >
            {starting ? "接続中..." : "面接を開始する"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-text-muted">
        InterviewAI &copy; 2026. All rights reserved.
      </p>
    </div>
  );
}
