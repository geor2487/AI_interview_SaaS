"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Video,
  Camera,
  Mic,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { canStartInterview } from "@/lib/interview/deadline";

interface DeviceStatus {
  camera: "checking" | "ready" | "error";
  mic: "checking" | "ready" | "error";
}

const cautions = [
  "静かな環境でご参加ください",
  "カメラとマイクの使用を許可してください",
  "ブラウザを閉じないでください",
  "安定したインターネット接続をご確認ください",
  "AIが質問を音声で読み上げます",
];

export default function InterviewLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startAllowed, setStartAllowed] = useState(false);
  const [disableReason, setDisableReason] = useState<string>();

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: "checking",
    mic: "checking",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch interview and verify ownership
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    (async () => {
      // Get candidate record
      const { data: candidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!candidate) {
        setError("候補者情報が見つかりません");
        setLoading(false);
        return;
      }

      // Get interview
      const { data: interview } = await supabase
        .from("interviews")
        .select("id, status, deadline_at, candidate_id")
        .eq("id", interviewId)
        .single();

      if (!interview) {
        setError("面接情報が見つかりません");
        setLoading(false);
        return;
      }

      // Verify ownership
      if (interview.candidate_id !== candidate.id) {
        setError("この面接へのアクセス権限がありません");
        setLoading(false);
        return;
      }

      // Check if can start
      const check = canStartInterview(interview.status, interview.deadline_at);
      setStartAllowed(check.allowed);
      setDisableReason(check.reason);

      setLoading(false);
    })();
  }, [user, interviewId]);

  // Device check
  const checkDevices = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setDeviceStatus({
        camera: stream.getVideoTracks().length > 0 ? "ready" : "error",
        mic: stream.getAudioTracks().length > 0 ? "ready" : "error",
      });
    } catch {
      setDeviceStatus({ camera: "error", mic: "error" });
    }
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      checkDevices();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [loading, error, checkDevices]);

  const handleStart = () => {
    setStarting(true);
    // Stop stream before navigating
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    router.push(`/interview/room/${interviewId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">面接ロビー</h1>
          <p className="mt-1 text-sm text-red">{error}</p>
        </div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-text transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          マイページへ戻る
        </Link>
      </div>
    );
  }

  const deviceItems = [
    {
      label: "カメラ",
      icon: Camera,
      status: deviceStatus.camera,
    },
    {
      label: "マイクロフォン",
      icon: Mic,
      status: deviceStatus.mic,
    },
    {
      label: "ネットワーク",
      icon: Wifi,
      status: "ready" as const,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-sub hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          戻る
        </Link>
        <h1 className="text-xl font-bold text-foreground">面接ロビー</h1>
        <p className="mt-1 text-sm text-text-muted">
          開始前にデバイスの確認を行います
        </p>
      </div>

      {/* Camera Preview */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">
          カメラプレビュー
        </h2>
        <div className="relative w-full aspect-video rounded-lg bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {deviceStatus.camera !== "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Camera className="h-10 w-10" />
              <span className="text-sm">
                {deviceStatus.camera === "checking"
                  ? "カメラを確認中..."
                  : "カメラにアクセスできません"}
              </span>
            </div>
          )}
          {deviceStatus.camera === "ready" && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-red animate-pulse" />
              <span className="text-[11px] text-white/80 font-medium">
                PREVIEW
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Device Check */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">
          デバイスチェック
        </h2>
        <div className="space-y-2">
          {deviceItems.map((device) => {
            const Icon = device.icon;
            const isReady = device.status === "ready";
            const isChecking = device.status === "checking";
            return (
              <div
                key={device.label}
                className="flex items-center justify-between rounded-lg border border-border-sub bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-text-sub" />
                  <span className="text-sm font-medium text-foreground">
                    {device.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 text-text-muted animate-spin" />
                  ) : isReady ? (
                    <CheckCircle2 className="h-4 w-4 text-green" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isChecking
                        ? "text-text-muted"
                        : isReady
                          ? "text-green"
                          : "text-yellow"
                    )}
                  >
                    {isChecking
                      ? "確認中..."
                      : isReady
                        ? "準備完了"
                        : "未許可"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cautions */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">
          注意事項
        </h2>
        <div className="rounded-lg border border-yellow/20 bg-yellow-bg px-4 py-3 space-y-2">
          {cautions.map((text, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow mt-0.5 shrink-0" />
              <span className="text-sm text-yellow">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleStart}
          disabled={!startAllowed || starting}
          className={cn(
            "w-full max-w-md h-12 rounded-xl text-[15px] font-semibold text-white transition-all",
            startAllowed && !starting
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.98]"
              : "bg-gray-300 cursor-not-allowed text-gray-500"
          )}
        >
          {starting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              接続中...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Video className="h-4 w-4" />
              面接を開始する
            </span>
          )}
        </button>

        {!startAllowed && disableReason && (
          <p className="text-sm text-red">{disableReason}</p>
        )}
      </div>
    </div>
  );
}
