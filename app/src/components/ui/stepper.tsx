"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({
  value,
  min = 0,
  max,
  step = 1,
  size = "md",
  onChange,
}: {
  value: number;
  min?: number;
  max: number;
  step?: number;
  size?: "sm" | "md" | "lg";
  onChange: (next: number) => void;
}) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)));

  const btnSize =
    size === "lg"
      ? "size-[35px] rounded-[14px]"
      : size === "sm"
        ? "size-[31.5px] rounded-[10.5px]"
        : "size-9 rounded-lg";

  const iconSize = size === "lg" ? "size-5" : size === "sm" ? "size-3.5" : "size-4";

  const valueClasses =
    size === "lg"
      ? "text-[38px] font-bold"
      : size === "sm"
        ? "text-base font-semibold"
        : "text-lg font-semibold";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => set(value - step)}
        disabled={value <= min}
        className={cn(
          "flex items-center justify-center border border-border bg-surface hover:bg-muted disabled:opacity-40 transition-colors",
          btnSize,
        )}
        aria-label="Giảm"
      >
        <Minus className={iconSize} />
      </button>
      <span className={cn("min-w-10 text-center tabular-nums", valueClasses)}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => set(value + step)}
        disabled={value >= max}
        className={cn(
          "flex items-center justify-center border border-border bg-surface hover:bg-muted disabled:opacity-40 transition-colors",
          btnSize,
        )}
        aria-label="Tăng"
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}
