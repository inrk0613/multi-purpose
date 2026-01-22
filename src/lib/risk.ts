import { Task } from "./types";
import { parseDueToMs } from "./dates";

export type RiskTone = "danger" | "warn" | "ext" | "none";

export function getRisk(task: Task, nowMs = Date.now()): { tone: RiskTone; label: string | null } {
  if (task.status === "done") return { tone: "none", label: null };

  // External submission is always visible (P0)
  if (task.priority === "P0") {
    return { tone: "ext", label: "対外(P0)" };
  }

  if (!task.due_at) return { tone: "none", label: null };

  const dueMs = parseDueToMs(task.due_at);
  if (!Number.isFinite(dueMs)) return { tone: "none", label: null };

  const diff = dueMs - nowMs;

  if (diff < 0) return { tone: "danger", label: "期限超過" };
  if (diff <= 24 * 3600000) return { tone: "danger", label: "24h以内" };

  const stalled = nowMs - task.updated_at > 48 * 3600000;
  const near = diff <= 72 * 3600000;
  const lowProgress = task.status === "backlog" || task.status === "planned";

  if (near && (stalled || lowProgress)) return { tone: "warn", label: "要注意" };

  return { tone: "none", label: null };
}

export function urgencyScore(task: Task, nowMs = Date.now()): number {
  // Lower is more urgent
  let s = 1000000;

  if (task.status === "done") return 9999999;

  // P0 strongest
  if (task.priority === "P0") s -= 500000;
  if (task.priority === "P1") s -= 200000;
  if (task.priority === "P2") s -= 50000;

  if (task.due_at) {
    const dueMs = parseDueToMs(task.due_at);
    if (Number.isFinite(dueMs)) {
      const diff = dueMs - nowMs;
      // overdue: very urgent
      if (diff < 0) s -= 600000;
      s += Math.max(0, diff / 60000); // minutes
    }
  }

  // prefer doing tasks
  if (task.status === "doing") s -= 10000;

  return s;
}
