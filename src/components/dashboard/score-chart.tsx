"use client";

interface ScoreChartProps {
  scores: { score: number; label: string }[];
}

export function ScoreChart({ scores }: ScoreChartProps) {
  if (scores.length === 0) return null;

  const max = 5;
  const chartHeight = 128;
  const barWidth = 100 / scores.length;

  return (
    <div className="h-32 flex items-end gap-2 px-2">
      {scores.map((item, i) => {
        const heightPct = (item.score / max) * 100;
        const color =
          item.score >= 4.25
            ? "from-green to-green/70"
            : item.score >= 3.5
              ? "from-accent to-accent/70"
              : "from-yellow to-yellow/70";

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 min-w-0"
          >
            <span className="text-[10px] font-bold text-text-sub">
              {item.score.toFixed(1)}
            </span>
            <div className="w-full flex justify-center">
              <div
                className={`w-full max-w-[32px] rounded-t-md bg-gradient-to-t ${color} transition-all duration-500`}
                style={{ height: `${(heightPct / 100) * (chartHeight - 32)}px` }}
              />
            </div>
            <span className="text-[9px] text-text-muted truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
