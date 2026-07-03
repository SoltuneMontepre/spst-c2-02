"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Free-text VND price entry: grouped thousands, no leading zeros, clamped on blur. */
export function PriceInput({
  value,
  onChange,
  min,
  max,
  step,
  suffix = "đ",
  disabled,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max?: number;
  /** Snap the committed value to the nearest multiple of this step (e.g. 1000). */
  step?: number;
  suffix?: string | null;
  disabled?: boolean;
  className?: string;
}) {
  const clamp = (n: number) => {
    const bounded = Math.max(min, max != null ? Math.min(max, n) : n);
    return step ? Math.round(bounded / step) * step : bounded;
  };
  const format = (n: number) => n.toLocaleString("vi-VN");

  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const parsed = digits === "" ? min : Number.parseInt(digits, 10);
    const next = clamp(Number.isNaN(parsed) ? min : parsed);
    onChange(next);
    setText(String(next));
  };

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        disabled={disabled}
        value={focused ? text : format(value)}
        onFocus={() => {
          setFocused(true);
          setText(String(value));
        }}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            setText("");
            return;
          }
          if (!/^\d+$/.test(raw)) return;
          // "04" → "4", but a lone "0" stays while typing.
          setText(raw.length > 1 ? String(Number.parseInt(raw, 10)) : raw);
        }}
        onBlur={() => {
          setFocused(false);
          commit(text);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-right font-mono text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      />
      {suffix ? <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span> : null}
    </div>
  );
}
