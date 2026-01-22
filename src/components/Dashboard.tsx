import React from "react";
import { AlertTriangle, Clock4, Flame, Plus } from "lucide-react";
import { Task } from "../lib/types";
import { Card, Button, Chip, SectionTitle } from "./ui";
import { getRisk, urgencyScore } from "../lib/risk";
import { parseDueToMs, etaToHuman } from "../lib/dates";
import { TaskCard } from "./TaskCard";

export function Dashboard({
  tasks,
  weeklyCapacityMin,
  onAdd,
  onEditTask,
  onUpdateTask
}: {
  tasks: Task[];
  weeklyCapacityMin: number;
  onAdd: () => void;
  onEditTask: (t: Task) => void;
  onUpdateTask: (t: Task) => void;
}) {
  const now = Date.now();

  const active = tasks.filter((t) => t.status !== "done");
  const risky = active
    .map((t) => ({ t, r: getRisk(t, now) }))
    .filter((x) => x.r.tone !== "none");

  const overdue = active.filter((t) => {
    if (!t.due_at) return false;
    const ms = parseDueToMs(t.due_at);
    return Number.isFinite(ms) && ms - now < 0;
  });

  const in24h = active.filter((t) => {
    if (!t.due_at) return false;
    const ms = parseDueToMs(t.due_at);
    const diff = ms - now;
    return Number.isFinite(ms) && diff >= 0 && diff <= 24 * 3600000;
  });

  const in3d = active.filter((t) => {
    if (!t.due_at) return false;
    const ms = parseDueToMs(t.due_at);
    const diff = ms - now;
    return Number.isFinite(ms) && diff >= 0 && diff <= 72 * 3600000;
  });

  const top3 = active
    .slice()
    .sort((a, b) => urgencyScore(a, now) - urgencyScore(b, now))
    .slice(0, 3);

  const weekPlanned = tasks.filter((t) => t.status === "planned" || t.status === "doing");
  const weekLoad = weekPlanned.reduce((sum, t) => sum + (t.eta_min || 0), 0);

  const loadPct = weeklyCapacityMin > 0 ? Math.min(1, weekLoad / weeklyCapacityMin) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg tracking-tight">Silent Control</div>
          <div className="mt-1 text-sm text-muted">迷わない・疲れない・判断が速い</div>
        </div>
        <Button onClick={onAdd}>
          <Plus size={16} /> 追加
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={<Flame size={16} />} label="期限超過" value={overdue.length} tone="danger" />
        <StatCard icon={<Clock4 size={16} />} label="24h以内" value={in24h.length} tone="danger" />
        <StatCard icon={<AlertTriangle size={16} />} label="3日以内" value={in3d.length} tone="warn" />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <SectionTitle>今週の負荷</SectionTitle>
          <div className="text-xs text-muted">
            {etaToHuman(weekLoad)} / {etaToHuman(weeklyCapacityMin)}
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-black/5 overflow-hidden">
          <div className="h-2 rounded-full bg-ink/80" style={{ width: `${loadPct * 100}%` }} />
        </div>
        <div className="mt-2 text-xs text-muted">
          目安。超過は警告対象（予定の詰め込みすぎ）
        </div>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionTitle>最優先（最大3件）</SectionTitle>
          <div className="text-xs text-muted">P0/締切/進行中を優先</div>
        </div>

        {top3.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="text-sm text-ink/80">今すぐの優先タスクはありません</div>
            <div className="mt-1 text-xs text-muted">バックログを整えると判断がさらに速くなります</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {top3.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="text-[15px] tracking-tight line-clamp-2">{t.title}</div>
                <div className="mt-1 text-xs text-muted line-clamp-2">{t.next_action || "次の一手: 未設定"}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{t.domain}</span>
                    <span>・</span>
                    <span>{t.priority}</span>
                  </div>
                  {(() => {
                    const r = getRisk(t);
                    return r.label ? <Chip tone={r.tone}>{r.label}</Chip> : <Chip>通常</Chip>;
                  })()}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button tone="ghost" onClick={() => onEditTask(t)}>
                    編集
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <SectionTitle>要注意（色が付いたタスク）</SectionTitle>
        {risky.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="text-sm text-ink/80">要注意タスクはありません</div>
            <div className="mt-1 text-xs text-muted">色が付いたら、判断の合図です</div>
          </Card>
        ) : (
          <div className="space-y-3">
            {risky
              .sort((a, b) => urgencyScore(a.t, now) - urgencyScore(b.t, now))
              .slice(0, 12)
              .map(({ t }) => (
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
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "danger" | "warn";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="text-ink/70">{icon}</span>
          {label}
        </div>
        <Chip tone={tone}>{value}</Chip>
      </div>
      <div className="mt-2 text-3xl tracking-tight">{value}</div>
    </Card>
  );
}
