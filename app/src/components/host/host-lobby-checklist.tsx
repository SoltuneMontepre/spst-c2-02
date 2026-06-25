"use client";

import { AlertTriangle, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ChecklistItem } from "@/lib/lobby-readiness";
import { cn } from "@/lib/utils";

export function HostLobbyChecklist({
  items,
  completedCount,
  totalCount,
}: {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Danh sách kiểm tra</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount} hoàn thành
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm",
              item.warning && !item.done && "bg-muted/40",
            )}
          >
            {item.done ? (
              <Check className="size-4 shrink-0 text-success" aria-hidden />
            ) : item.warning ? (
              <AlertTriangle className="size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <span className="size-4 shrink-0 rounded-full border border-border" />
            )}
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
