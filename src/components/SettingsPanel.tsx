import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button, Card, Input, Label } from "./ui";

export function SettingsPanel({
  open,
  onOpenChange,
  weeklyCapacityMin,
  onSave
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  weeklyCapacityMin: number;
  onSave: (min: number) => void;
}) {
  const [val, setVal] = React.useState(weeklyCapacityMin);

  React.useEffect(() => {
    setVal(weeklyCapacityMin);
  }, [weeklyCapacityMin, open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-32px))]">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-base tracking-tight">設定</div>
              <Dialog.Close asChild>
                <button className="rounded-xl p-2 hover:bg-black/5" aria-label="close">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <Label>今週の可処分時間（分）</Label>
                <Input
                  type="number"
                  min={0}
                  value={val}
                  onChange={(e) => setVal(Number(e.target.value))}
                />
                <div className="mt-1 text-xs text-muted">例: 1500 (25h)</div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button tone="ghost">閉じる</Button>
              </Dialog.Close>
              <Button
                onClick={() => {
                  onSave(Math.max(0, Math.floor(val)));
                  onOpenChange(false);
                }}
              >
                保存
              </Button>
            </div>
          </Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
