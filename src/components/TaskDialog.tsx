import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, X } from "lucide-react";
import { Task, TaskPriority, TaskStatus, Domain } from "../lib/types";
import { Button, Input, Label, Textarea } from "./ui";
import { cn } from "../lib/ui_cn";
import { uid } from "../lib/id";

type Draft = Omit<Task, "id" | "created_at" | "updated_at"> & { id?: string };

const priorities: TaskPriority[] = ["P0", "P1", "P2", "P3"];
const statuses: TaskStatus[] = ["backlog", "planned", "doing", "done"];

function priorityLabel(p: TaskPriority) {
  if (p === "P0") return "P0 対外期限";
  if (p === "P1") return "P1 高";
  if (p === "P2") return "P2 中";
  return "P3 低";
}

function statusLabel(s: TaskStatus) {
  if (s === "backlog") return "バックログ";
  if (s === "planned") return "今週";
  if (s === "doing") return "進行中";
  return "完了";
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  domains,
  onSave,
  onDelete
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task | null;
  domains: Domain[];
  onSave: (t: Task) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(task));

  React.useEffect(() => {
    setDraft(toDraft(task));
  }, [task, open]);

  const isNew = !task;

  const canSaveTitle = draft.title.trim().length > 0;
  const nextActionOk =
    draft.status === "planned" || draft.status === "doing" ? draft.next_action.trim().length > 0 : true;

  const canSave = canSaveTitle && nextActionOk;

  function commit() {
    if (!canSave) return;
    const now = Date.now();
    const id = task?.id ?? uid();
    const created = task?.created_at ?? now;
    const next: Task = {
      id,
      title: draft.title.trim(),
      due_at: draft.due_at ? draft.due_at : null,
      eta_min: Math.max(0, Number(draft.eta_min) || 0),
      priority: draft.priority,
      status: draft.status,
      domain: draft.domain,
      next_action: draft.next_action.trim(),
      planned_for: draft.planned_for ? draft.planned_for : null,
      created_at: created,
      updated_at: now
    };
    onSave(next);
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50" />
        <Dialog.Content
          className={cn(
            "fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[min(560px,calc(100vw-32px))] rounded-xl2 bg-card shadow-soft ring-1 ring-black/5 p-5"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="text-base tracking-tight">{isNew ? "新規タスク" : "タスク編集"}</div>
            <Dialog.Close asChild>
              <button className="rounded-xl p-2 hover:bg-black/5" aria-label="close">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <Label>タイトル</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="例: RISE課題 提出"
              />
              {!canSaveTitle && <div className="mt-1 text-xs text-danger">タイトルは必須</div>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>締切</Label>
                <Input
                  value={draft.due_at ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, due_at: e.target.value || null }))}
                  placeholder="YYYY-MM-DD or YYYY-MM-DDTHH:mm"
                />
                <div className="mt-1 text-xs text-muted">日付のみは 23:59 扱い</div>
              </div>
              <div>
                <Label>見積(分)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.eta_min}
                  onChange={(e) => setDraft((d) => ({ ...d, eta_min: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>優先度</Label>
                <SelectRoot value={draft.priority} onValueChange={(v) => setDraft((d) => ({ ...d, priority: v as TaskPriority }))}>
                  {priorities.map((p) => (
                    <SelectItem key={p} value={p} label={priorityLabel(p)} />
                  ))}
                </SelectRoot>
              </div>
              <div>
                <Label>状態</Label>
                <SelectRoot value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as TaskStatus }))}>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s} label={statusLabel(s)} />
                  ))}
                </SelectRoot>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ドメイン</Label>
                <SelectRoot value={String(draft.domain)} onValueChange={(v) => setDraft((d) => ({ ...d, domain: v as Domain }))}>
                  {domains.map((dom) => (
                    <SelectItem key={dom} value={dom} label={dom} />
                  ))}
                </SelectRoot>
              </div>
              <div>
                <Label>今週配置(YYYY-MM-DD)</Label>
                <Input
                  value={draft.planned_for ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, planned_for: e.target.value || null }))}
                  placeholder="空なら未配置"
                />
              </div>
            </div>

            <div>
              <Label>次の一手 (1行)</Label>
              <Textarea
                value={draft.next_action}
                onChange={(e) => setDraft((d) => ({ ...d, next_action: e.target.value }))}
                placeholder="例: 資料の骨子を作り、1ページ目だけ完成させる"
              />
              {!nextActionOk && <div className="mt-1 text-xs text-warn">今週/進行中は次の一手が必須</div>}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isNew && onDelete && (
                <Button
                  tone="ghost"
                  onClick={() => {
                    onDelete(task!.id);
                    onOpenChange(false);
                  }}
                >
                  削除
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Dialog.Close asChild>
                <Button tone="ghost">閉じる</Button>
              </Dialog.Close>
              <Button
                tone="primary"
                disabled={!canSave}
                onClick={commit}
                title={!canSave ? "入力を確認" : "保存"}
              >
                保存
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function toDraft(task: Task | null): Draft {
  if (!task) {
    return {
      title: "",
      due_at: null,
      eta_min: 60,
      priority: "P1",
      status: "backlog",
      domain: "Personal",
      next_action: "",
      planned_for: null
    };
  }
  return {
    title: task.title,
    due_at: task.due_at,
    eta_min: task.eta_min,
    priority: task.priority,
    status: task.status,
    domain: task.domain,
    next_action: task.next_action,
    planned_for: task.planned_for
  };
}

function SelectRoot({
  value,
  onValueChange,
  children
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="w-full inline-flex items-center justify-between rounded-xl bg-white/70 ring-1 ring-black/10 px-3 py-2 text-sm hover:bg-white focus:ring-2 focus:ring-ext/30">
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={16} className="text-muted" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-[60] overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-black/10">
          <Select.Viewport className="p-1">{children}</Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function SelectItem({ value, label }: { value: string; label: string }) {
  return (
    <Select.Item
      value={value}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer select-none",
        "data-[highlighted]:bg-black/5 outline-none"
      )}
    >
      <Select.ItemIndicator className="inline-flex w-4 items-center justify-center">
        <Check size={14} />
      </Select.ItemIndicator>
      <Select.ItemText>{label}</Select.ItemText>
    </Select.Item>
  );
}
