import React from "react";
import { Search, Plus } from "lucide-react";
import { Task, Domain, TaskPriority } from "../lib/types";
import { Card, Button, Input, SectionTitle } from "./ui";
import { TaskCard } from "./TaskCard";
import { urgencyScore } from "../lib/risk";

export function Backlog({
  tasks,
  domains,
  onAdd,
  onEditTask,
  onUpdateTask,
  onPlanTask,
  weeklyLimitRemaining
}: {
  tasks: Task[];
  domains: Domain[];
  onAdd: () => void;
  onEditTask: (t: Task) => void;
  onUpdateTask: (t: Task) => void;
  onPlanTask: (t: Task) => void;
  weeklyLimitRemaining: number;
}) {
  const backlog = tasks.filter((t) => t.status === "backlog");
  const [q, setQ] = React.useState("");
  const [domain, setDomain] = React.useState<Domain | "all">("all");
  const [pri, setPri] = React.useState<TaskPriority | "all">("all");

  const filtered = backlog
    .filter((t) => (q.trim() ? (t.title + " " + t.next_action).toLowerCase().includes(q.trim().toLowerCase()) : true))
    .filter((t) => (domain === "all" ? true : t.domain === domain))
    .filter((t) => (pri === "all" ? true : t.priority === pri))
    .sort((a, b) => urgencyScore(a) - urgencyScore(b));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg tracking-tight">バックログ</div>
          <div className="mt-1 text-sm text-muted">重要だが今すぐやらないものを退避</div>
        </div>
        <Button onClick={onAdd}>
          <Plus size={16} /> 追加
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="text-xs text-muted mb-1">検索</div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="タイトル/次の一手" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <select
              className="w-full rounded-xl bg-white/70 ring-1 ring-black/10 px-3 py-2 text-sm"
              value={String(domain)}
              onChange={(e) => setDomain(e.target.value as any)}
            >
              <option value="all">ドメイン: 全て</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-xl bg-white/70 ring-1 ring-black/10 px-3 py-2 text-sm"
              value={String(pri)}
              onChange={(e) => setPri(e.target.value as any)}
            >
              <option value="all">優先度: 全て</option>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <SectionTitle>一覧</SectionTitle>
        <div className="text-xs text-muted">今週残枠: {weeklyLimitRemaining}</div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-sm text-ink/80">バックログが空です</div>
          <div className="mt-1 text-xs text-muted">重要な仕込みはここに集約すると整理が楽になります</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onEdit={() => onEditTask(t)}
              onDone={() => onUpdateTask({ ...t, status: "done", updated_at: Date.now() })}
              onBacklog={() => onUpdateTask({ ...t, status: "backlog", planned_for: null, updated_at: Date.now() })}
              onStart={() => onUpdateTask({ ...t, status: "doing", updated_at: Date.now() })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
