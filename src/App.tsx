import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Settings, defaultSettings, loadSettings, loadTasks, saveSettings, saveTasks } from "./lib/storage";
import { Task, Domain } from "./lib/types";
import { cn } from "./lib/ui_cn";
import { Dashboard } from "./components/Dashboard";
import { WeekPlanner } from "./components/WeekPlanner";
import { Backlog } from "./components/Backlog";
import { TaskDialog } from "./components/TaskDialog";
import { Toast } from "./components/Toast";
import { SettingsPanel } from "./components/SettingsPanel";
import { Settings as SettingsIcon } from "lucide-react";

const WEEKLY_LIMIT = 10;

export default function App() {
  const [tasks, setTasks] = React.useState<Task[]>(() => loadTasks());
  const [settings, setSettings] = React.useState<Settings>(() => loadSettings());

  React.useEffect(() => saveTasks(tasks), [tasks]);
  React.useEffect(() => saveSettings(settings), [settings]);

  const domains = React.useMemo<Domain[]>(() => {
    const base: Domain[] = ["RISE", "Thesis", "Work", "Personal"];
    const fromTasks = Array.from(new Set(tasks.map((t) => t.domain))).filter(Boolean);
    return Array.from(new Set([...base, ...fromTasks]));
  }, [tasks]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Task | null>(null);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const plannedThisWeek = tasks.filter((t) => t.status === "planned" || t.status === "doing");
  const weeklyRemaining = Math.max(0, WEEKLY_LIMIT - plannedThisWeek.length);

  function upsertTask(t: Task) {
    setTasks((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = t;
        return next;
      }
      return [t, ...prev];
    });
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(t: Task) {
    setEditing(t);
    setDialogOpen(true);
  }

  function canPlanMore(): boolean {
    return plannedThisWeek.length < WEEKLY_LIMIT;
  }

  function planTask(t: Task) {
    if (!canPlanMore()) {
      setToast(`今週は最大${WEEKLY_LIMIT}件まで`);
      return;
    }
    upsertTask({ ...t, status: "planned", updated_at: Date.now() });
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Header onOpenSettings={() => setSettingsOpen(true)} />

        <Tabs.Root defaultValue="dashboard" className="mt-5">
          <Tabs.List className="flex items-center gap-2">
            <Tab value="dashboard">ダッシュボード</Tab>
            <Tab value="week">今週</Tab>
            <Tab value="backlog">バックログ</Tab>
            <div className="flex-1" />
            <button
              className="rounded-xl p-2 hover:bg-black/5"
              onClick={() => setSettingsOpen(true)}
              aria-label="settings"
              title="設定"
            >
              <SettingsIcon size={18} className="text-muted" />
            </button>
          </Tabs.List>

          <div className="mt-4">
            <Tabs.Content value="dashboard">
              <Dashboard
                tasks={tasks}
                weeklyCapacityMin={settings.weekly_capacity_min}
                onAdd={openNew}
                onEditTask={openEdit}
                onUpdateTask={upsertTask}
              />
            </Tabs.Content>

            <Tabs.Content value="week">
              <div className="space-y-4">
                <WeekPlanner
                  tasks={tasks}
                  onUpdateTask={upsertTask}
                  weeklyLimit={WEEKLY_LIMIT}
                  onLimitHit={() => setToast(`今週は最大${WEEKLY_LIMIT}件まで`)}
                />
                <div className="text-xs text-muted">
                  ルール: 今週の実行対象は最大{WEEKLY_LIMIT}件。超えると判断が遅くなる。
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="backlog">
              <Backlog
                tasks={tasks}
                domains={domains}
                onAdd={openNew}
                onEditTask={openEdit}
                onUpdateTask={upsertTask}
                onPlanTask={planTask}
                weeklyLimitRemaining={weeklyRemaining}
              />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        domains={domains}
        onSave={(t) => {
          // Weekly limit enforcement when saving as planned/doing
          const willBePlanned = t.status === "planned" || t.status === "doing";
          const currentlyPlanned = tasks.filter((x) => (x.status === "planned" || x.status === "doing") && x.id !== t.id).length;
          if (willBePlanned && currentlyPlanned >= WEEKLY_LIMIT) {
            setToast(`今週は最大${WEEKLY_LIMIT}件まで`);
            return;
          }
          upsertTask(t);
        }}
        onDelete={editing ? deleteTask : undefined}
      />

      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        weeklyCapacityMin={settings.weekly_capacity_min}
        onSave={(min) => setSettings((s) => ({ ...s, weekly_capacity_min: min }))}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-muted">Task Manager</div>
        <div className="text-2xl tracking-tight">Silent Control UI</div>
      </div>
      <div className="text-xs text-muted">local only / no API / GitHub Pages ready</div>
    </div>
  );
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "px-3 py-2 rounded-xl text-sm select-none",
        "text-ink/70 hover:bg-black/5 data-[state=active]:bg-ink data-[state=active]:text-white"
      )}
    >
      {children}
    </Tabs.Trigger>
  );
}
