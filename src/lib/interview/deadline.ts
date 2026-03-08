export function isDeadlineExpired(deadlineAt: string | null): boolean {
  if (!deadlineAt) return false;
  return new Date(deadlineAt) < new Date();
}

export function formatDeadline(deadlineAt: string | null): string {
  if (!deadlineAt) return "期限なし";

  const deadline = new Date(deadlineAt);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs < 0) return "期限切れ";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) return `あと${diffDays}日${diffHours}時間`;
  if (diffHours > 0) return `あと${diffHours}時間`;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return `あと${diffMinutes}分`;
}

export function formatDeadlineDate(deadlineAt: string | null): string {
  if (!deadlineAt) return "";
  const d = new Date(deadlineAt);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function canStartInterview(status: string, deadlineAt: string | null): { allowed: boolean; reason?: string } {
  if (status === "completed" || status === "evaluated") {
    return { allowed: false, reason: "この面接は既に完了しています" };
  }
  if (status === "in_progress") {
    return { allowed: true };
  }
  if (isDeadlineExpired(deadlineAt)) {
    return { allowed: false, reason: "回答期限を過ぎています" };
  }
  return { allowed: true };
}
