import React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Calendar, GripVertical } from "lucide-react";
import { Task } from "../lib/types";
import { Card, Chip } from "./ui";
import { startOfWeekMonday, addDays, toDateOnly, formatShortDate, etaToHuman } from "../lib/dates";
import { getRisk } from "../lib/risk";
import { cn } from "../lib/ui_cn";

type ColumnId = string; // "YYYY-MM-DD" or "unscheduled"

export function WeekPlanner({
  tasks,
  onUpdateTask,
  weeklyLimit,
  onLimitHit
}: {
  tasks: Task[];
  onUpdateTask: (t: Task) => void;
  weeklyLimit: number;
  onLimitHit: () => void;
}) {
  const now = new Date();
  const weekStart = startOfWeekMonday(now);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const columns: Array<{ id: ColumnId; label: string; date: Date | null }> = [
    { id: "unscheduled", label: "未配置", date: null },
    ...days.map((d) => ({ id: toDateOnly(d), label: formatShortDate(d), date: d }))
  ];

  const planned = tasks.filter((t) => t.status === "planned" || t.status === "doing");
  const inThisWeek = planned.filter((t) => (t.planned_for ? isInThisWeek(t.planned_for, weekStart) : true));

  // Limit: count tasks that are planned/doing and in week scope (including unscheduled)
  if (inThisWeek.length > weeklyLimit) {
    // Soft enforcement: warn and do not auto-fix
    // (The app blocks adding new tasks beyond limit elsewhere)
  }

  const byCol = new Map<ColumnId, Task[]>();
  for (const col of columns) byCol.set(col.id, []);
  for (const t of inThisWeek) {
    const key = t.planned_for && isInThisWeek(t.planned_for, weekStart) ? t.planned_for : "unscheduled";
    byCol.get(key)!.push(t);
  }

  // Stable order: urgency then updated
  for (const [k, arr] of byCol) {
    arr.sort((a, b) => (a.updated_at - b.updated_at));
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeTask = activeId ? planned.find((t) => t.id === activeId) ?? null : null;

  function onDragStart(id: string) {
    setActiveId(id);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeTask = planned.find((t) => t.id === String(active.id));
    if (!activeTask) return;

    const overId = String(over.id);
    const [overColId] = overId.startsWith("col:") ? [overId.slice(4)] : ["unscheduled"];

    const nextPlannedFor = overColId === "unscheduled" ? null : overColId;

    const next: Task = { ...activeTask, planned_for: nextPlannedFor, updated_at: Date.now() };
    onUpdateTask(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink/80 tracking-tight">
          <Calendar size={16} />
          今週ビュー（最大{weeklyLimit}件）
        </div>
        <div className="text-xs text-muted">
          planned/doing: {inThisWeek.length}/{weeklyLimit}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={(e) => onDragStart(String(e.active.id))}>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {columns.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.label}
              tasks={byCol.get(col.id)!}
              isUnscheduled={col.id === "unscheduled"}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[260px]">
              <PlannerCard task={activeTask} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );

  function Column({ id, title, tasks, isUnscheduled }: { id: ColumnId; title: string; tasks: Task[]; isUnscheduled: boolean }) {
    return (
      <Card className={cn("p-3", isUnscheduled ? "md:col-span-1 lg:col-span-1" : "md:col-span-1 lg:col-span-1")}>
        <div className="flex items-center justify-between">
          <div className="text-xs text-ink/70">{title}</div>
          <div className="text-[11px] text-muted">{tasks.length}</div>
        </div>
        <div className="mt-2 space-y-2 min-h-[56px]" id={`col:${id}`}>
          <SortableContext items={tasks.map((t) => t.id)} strategy={rectSortingStrategy}>
            {tasks.map((t) => (
              <SortableItem key={t.id} task={t} />
            ))}
          </SortableContext>
        </div>
      </Card>
    );
  }

  function SortableItem({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    };

    return (
      <div ref={setNodeRef} style={style} className={cn(isDragging ? "opacity-60" : "")}>
        <PlannerCard task={task} dragHandleProps={{ ...attributes, ...listeners }} />
      </div>
    );
  }
}

function PlannerCard({
  task,
  dragHandleProps,
  dragging
}: {
  task: Task;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  dragging?: boolean;
}) {
  const risk = getRisk(task);

  return (
    <motion.div layout transition={{ duration: 0.2 }}>
      <div className={cn("rounded-xl bg-white/70 ring-1 ring-black/10 p-3", dragging ? "shadow-soft" : "hover:bg-white")}>
        <div className="flex items-start gap-2">
          <button
            className="mt-[2px] rounded-lg p-1 hover:bg-black/5 text-muted"
            aria-label="drag"
            {...dragHandleProps}
          >
            <GripVertical size={14} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-sm tracking-tight truncate">{task.title}</div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
              <span>{task.domain}</span>
              <span>{etaToHuman(task.eta_min)}</span>
            </div>
          </div>
        </div>
        {risk.label && (
          <div className="mt-2">
            <Chip tone={risk.tone}>{risk.label}</Chip>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function isInThisWeek(dateOnly: string, weekStart: Date): boolean {
  const start = toDateOnly(weekStart);
  const end = toDateOnly(addDays(weekStart, 6));
  return dateOnly >= start && dateOnly <= end;
}
