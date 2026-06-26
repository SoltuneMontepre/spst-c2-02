"use client";

import type { PolicyType } from "@/generated/prisma/enums";
import { Check, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const POLICY_ICONS: Record<string, string> = {
  INFO_DISCLOSURE: "📊",
  COLD_STORAGE: "❄️",
  EXPORT_PROMOTION: "🚢",
  TECH_SUPPORT: "🔬",
  NONE: "⏸️",
};

export function PolicyCard({
  policyType = "NONE",
  title,
  description,
  costLabel,
  footer,
  selected,
  onSelect,
  disabled,
}: {
  policyType?: PolicyType | string;
  title: string;
  description: string;
  costLabel: string;
  footer?: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const icon = POLICY_ICONS[policyType] ?? "📋";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="w-[min(100%,220px)] shrink-0 text-left disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div
        className={cn(
          "flex h-[320px] w-full flex-col rounded-[14px] border bg-surface p-4 shadow-sm transition-colors",
          selected
            ? "border-primary ring-2 ring-primary/25"
            : "border-border hover:border-primary/30",
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50 text-lg">
          {icon}
        </div>
        <p className="mt-3 text-sm font-semibold leading-snug">{title}</p>
        <p className="mt-1 text-sm font-bold text-primary">{costLabel}</p>
        <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
        {footer ? (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/30 px-2 py-1.5 text-[10px] text-muted-foreground">
            <Scale className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span>{footer}</span>
          </div>
        ) : null}
        {selected ? (
          <p className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-primary">
            <Check className="size-3.5" aria-hidden />
            Đã chọn
          </p>
        ) : null}
      </div>
    </button>
  );
}

export type { PolicyType };
