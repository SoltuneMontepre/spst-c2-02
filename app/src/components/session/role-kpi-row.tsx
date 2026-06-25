"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}

export function RoleKpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <span
            className={cn(
              "text-lg font-bold tracking-tight",
              item.valueClassName,
            )}
          >
            {item.value}
          </span>
          {item.hint ? (
            <span className="text-xs text-muted-foreground">{item.hint}</span>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
