"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Video, Mic, MicOff, Camera, CameraOff, PhoneOff, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { RealtimeInterviewRoom } from "@/components/interview/realtime-interview-room";

const INTERVIEW_MODE = process.env.NEXT_PUBLIC_INTERVIEW_MODE || "realtime";

export default function InterviewRoomPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const interviewId = params.id as string;

  // Determine mode: query param > env var > default (realtime)
  const modeParam = searchParams.get("mode");
  const mode = modeParam || INTERVIEW_MODE;

  // If realtime mode, render the realtime interview room
  if (mode === "realtime") {
    return (
      <RealtimeInterviewRoom
        interviewId={interviewId}
        questions={[]}
      />
    );
  }

  // Legacy mode: original static interview room UI
  return <LegacyInterviewRoom />;
}

function LegacyInterviewRoom() {
  const router = useRouter();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [barHeights, setBarHeights] = useState([40, 60, 80, 50, 35]);

  // Animate audio bars
  useEffect(() => {
    const interval = setInterval(() => {
      setBarHeights((prev) =>
        prev.map(() => 20 + Math.random() * 60)
      );
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Increment timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleEnd = () => {
    router.push("/interview/complete");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#09090b", color: "#fafafa" }}>
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{ borderBottom: "1px solid #27272a" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Video className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">InterviewAI</span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <span style={{ color: "#a1a1aa" }}>
            質問 <span className="font-semibold" style={{ color: "#818cf8" }}>3</span>/10
          </span>
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1"
            style={{ background: "#18181b" }}
          >
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm font-medium">{formatTime(elapsed)}</span>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex items-center justify-center p-6 gap-6">
        {/* AI Section (Left 60%) */}
        <div className="flex-[3] flex flex-col items-center justify-center gap-8 max-w-2xl">
          {/* AI Avatar */}
          <div className="relative">
            <div
              className="h-40 w-40 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
                boxShadow: "0 0 60px rgba(99,102,241,0.3), 0 0 120px rgba(139,92,246,0.15)",
              }}
            >
              <Bot className="h-16 w-16 text-white/90" />
            </div>
            {/* Pulse ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                opacity: 0.15,
                animationDuration: "2s",
              }}
            />
          </div>

          {/* Audio Visualizer */}
          <div className="flex items-end gap-1.5 h-12">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-full transition-all duration-300 ease-in-out"
                style={{
                  height: `${h}%`,
                  background: "linear-gradient(to top, #6366f1, #a78bfa)",
                  opacity: 0.8,
                }}
              />
            ))}
          </div>

          {/* Current Question */}
          <div
            className="w-full rounded-xl px-8 py-6 text-center"
            style={{ background: "#18181b", border: "1px solid #27272a" }}
          >
            <p className="text-xs font-medium mb-3" style={{ color: "#818cf8" }}>
              現在の質問
            </p>
            <p className="text-lg font-medium leading-relaxed">
              あなたの強みについて教えてください
            </p>
          </div>
        </div>

        {/* Candidate Section (Right 40%) */}
        <div className="flex-[2] flex flex-col items-center justify-center max-w-md">
          <div
            className="relative w-full aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: "#18181b", border: "1px solid #27272a" }}
          >
            <div className="flex flex-col items-center gap-3" style={{ color: "#52525b" }}>
              <Camera className="h-10 w-10" />
              <span className="text-sm">カメラプレビュー</span>
            </div>

            {/* REC Badge */}
            <div
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            >
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-bold text-red-400 tracking-wider">REC</span>
            </div>

            {/* Name Badge */}
            <div
              className="absolute bottom-3 left-3 rounded-full px-3 py-1"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            >
              <span className="text-xs font-medium text-white/80">候補者</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <footer
        className="flex items-center justify-center gap-4 px-6 h-20 shrink-0"
        style={{ borderTop: "1px solid #27272a" }}
      >
        {/* Mic Toggle */}
        <button
          onClick={() => setMicOn(!micOn)}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all",
            micOn
              ? "bg-[#27272a] hover:bg-[#3f3f46] text-white"
              : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
          )}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => setCamOn(!camOn)}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all",
            camOn
              ? "bg-[#27272a] hover:bg-[#3f3f46] text-white"
              : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
          )}
        >
          {camOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
        </button>

        {/* End Interview */}
        <button
          onClick={handleEnd}
          className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-semibold flex items-center gap-2 transition-all"
        >
          <PhoneOff className="h-4 w-4" />
          面接を終了
        </button>
      </footer>
    </div>
  );
}
