"use client";

import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}

const COLS_CLASS = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
} as const;

export function RoleKpiRow({
  items,
  cols = 4,
}: {
  items: KpiItem[];
  cols?: 3 | 4 | 5;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5", COLS_CLASS[cols])}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-0.5 rounded-[14px] border border-border bg-surface px-3.5 py-3 shadow-sm"
        >
          <span className="text-[11px] text-muted-foreground">{item.label}</span>
          <span
            className={cn(
              "font-mono text-[26px] font-bold leading-tight tracking-tight",
              item.valueClassName ?? "text-foreground",
            )}
          >
            {item.value}
          </span>
          {item.hint ? (
            <span className="text-[10px] text-muted-foreground">{item.hint}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
