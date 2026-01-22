import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Pencil, Play, Undo2 } from "lucide-react";
import { Task } from "../lib/types";
import { Card, Chip } from "./ui";
import { getRisk } from "../lib/risk";
import { etaToHuman, msToHuman, parseDueToMs } from "../lib/dates";

export function TaskCard({
  task,
  onEdit,
  onDone,
  onBacklog,
  onStart
}: {
  task: Task;
  onEdit: () => void;
  onDone: () => void;
  onBacklog: () => void;
  onStart: () => void;
}) {
  const risk = getRisk(task);
  const dueMs = task.due_at ? parseDueToMs(task.due_at) : NaN;
  const diff = Number.isFinite(dueMs) ? dueMs - Date.now() : null;

  const dueLine =
    diff == null
      ? "締切なし"
      : diff < 0
        ? `期限超過 ${msToHuman(diff)}`
        : `残り ${msToHuman(diff)}`;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[15px] tracking-tight truncate">{task.title}</div>
            <div className="mt-1 text-xs text-muted line-clamp-2">{task.next_action || "次の一手: 未設定"}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {risk.label && <Chip tone={risk.tone}>{risk.label}</Chip>}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>{task.domain}</span>
            <span>・</span>
            <span>{task.priority}</span>
            <span>・</span>
            <span>{etaToHuman(task.eta_min)}</span>
          </div>
          <div>{dueLine}</div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          {task.status !== "done" && (
            <button className="rounded-xl p-2 hover:bg-black/5" title="完了" onClick={onDone}>
              <CheckCircle2 size={18} />
            </button>
          )}
          {task.status !== "backlog" && (
            <button className="rounded-xl p-2 hover:bg-black/5" title="バックログへ" onClick={onBacklog}>
              <Undo2 size={18} />
            </button>
          )}
          {task.status !== "doing" && task.status !== "done" && (
            <button className="rounded-xl p-2 hover:bg-black/5" title="進行中" onClick={onStart}>
              <Play size={18} />
            </button>
          )}
          <button className="rounded-xl p-2 hover:bg-black/5" title="編集" onClick={onEdit}>
            <Pencil size={18} />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
