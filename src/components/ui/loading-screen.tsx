import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "読み込み中..." }: LoadingScreenProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
        <p className="text-sm text-text-muted">{message}</p>
      </div>
    </div>
  );
}
