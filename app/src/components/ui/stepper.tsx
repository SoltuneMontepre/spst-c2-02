"use client";

import { Minus, Plus } from "lucide-react";

export function Stepper({
  value,
  min = 0,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)));
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => set(value - step)}
        disabled={value <= min}
        className="flex size-9 items-center justify-center rounded-lg border border-border disabled:opacity-40"
        aria-label="Giảm"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-10 text-center text-lg font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => set(value + step)}
        disabled={value >= max}
        className="flex size-9 items-center justify-center rounded-lg border border-border disabled:opacity-40"
        aria-label="Tăng"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
