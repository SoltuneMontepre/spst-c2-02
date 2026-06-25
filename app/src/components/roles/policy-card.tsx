"use client";

import type { PolicyType } from "@/generated/prisma/enums";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PolicyCard({
  title,
  description,
  costLabel,
  footer,
  selected,
  onSelect,
  disabled,
}: {
  title: string;
  description: string;
  costLabel: string;
  footer?: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="text-left disabled:opacity-50"
    >
      <Card
        className={cn(
          "flex h-full flex-col gap-2 p-4 transition-colors",
          selected
            ? "border-primary ring-2 ring-primary/30"
            : "hover:border-primary/40",
        )}
      >
        <p className="font-semibold">{title}</p>
        <p className="text-sm font-medium text-primary">{costLabel}</p>
        <p className="flex-1 text-sm text-muted-foreground">{description}</p>
        {footer ? (
          <p className="text-xs text-muted-foreground">{footer}</p>
        ) : null}
        {selected ? (
          <p className="flex items-center gap-1 text-xs font-semibold text-primary">
            <Check className="size-3.5" aria-hidden />
            Đã chọn
          </p>
        ) : null}
      </Card>
    </button>
  );
}

export type { PolicyType };
