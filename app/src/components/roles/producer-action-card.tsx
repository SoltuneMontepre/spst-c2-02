"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function formatCompactVnd(
  amountVnd: number,
  options?: { signed?: boolean },
): string {
  const sign =
    options?.signed && amountVnd > 0 ? "+" : amountVnd < 0 ? "-" : "";
  const absolute = Math.abs(amountVnd);
  const thousands = absolute / 1000;
  const text = Number.isInteger(thousands)
    ? thousands.toString()
    : thousands.toFixed(1);
  return `${sign}${text}k`;
}

export function ProducerActionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[256.5px] w-full flex-col rounded-[14px] border border-border bg-surface p-[18.5px] shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-[7px]">
        <Icon className="size-[15px] shrink-0 text-foreground" aria-hidden />
        <h2 className="text-sm font-bold leading-[21px] text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function ProducerQuantityControl({
  value,
  min = 0,
  max,
  disabled,
  onChange,
}: {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  const set = (next: number) => {
    if (disabled) return;
    onChange(Math.max(min, Math.min(max, next)));
  };

  return (
    <div className="flex items-center gap-[10.5px]">
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={disabled || value <= min}
        className="flex size-7 items-center justify-center rounded-[14.5px] border border-border bg-surface text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        aria-label="Giảm"
      >
        <Minus className="size-[13px]" aria-hidden />
      </button>
      <span className="w-7 text-center font-mono text-[22px] font-bold leading-[33px] text-foreground tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={disabled || value >= max}
        className="flex size-7 items-center justify-center rounded-[14.5px] border border-border bg-surface text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        aria-label="Tăng"
      >
        <Plus className="size-[13px]" aria-hidden />
      </button>
    </div>
  );
}

export function PriceStepper({
  value,
  onChange,
  min = 1000,
  max = 30000,
  step = 1000,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  const set = (next: number) => {
    if (disabled) return;
    onChange(Math.max(min, Math.min(max, next)));
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => set(value - step)}
        disabled={disabled || value <= min}
        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        aria-label="Giảm giá"
      >
        <Minus className="size-3" aria-hidden />
      </button>
      <span className="w-12 shrink-0 text-center font-mono text-sm font-bold tabular-nums">
        {formatCompactVnd(value)}
      </span>
      <button
        type="button"
        onClick={() => set(value + step)}
        disabled={disabled || value >= max}
        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        aria-label="Tăng giá"
      >
        <Plus className="size-3" aria-hidden />
      </button>
    </div>
  );
}

export function ProducerValueRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex h-[23.25px] items-start justify-between pt-[5.25px] text-xs leading-[18px] first:h-[18px] first:pt-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono font-bold text-foreground", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
