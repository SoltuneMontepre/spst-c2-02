"use client";

import { useEffect, useState } from "react";
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
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const commitText = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const parsed = digits === "" ? min : Number.parseInt(digits, 10);
    const next = clamp(Number.isNaN(parsed) ? min : parsed);
    onChange(next);
    setText(String(next));
  };

  const stepBy = (delta: number) => {
    const next = clamp(value + delta);
    onChange(next);
    setText(String(next));
  };

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
        onClick={() => stepBy(-step)}
        disabled={value <= min}
        className={cn(
          "flex items-center justify-center border border-border bg-surface hover:bg-muted disabled:opacity-40 transition-colors",
          btnSize,
        )}
        aria-label="Giảm"
      >
        <Minus className={iconSize} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={focused ? text : String(value)}
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
          // "04" → "4", "0" alone stays while typing
          setText(raw.length > 1 ? String(Number.parseInt(raw, 10)) : raw);
        }}
        onBlur={() => {
          setFocused(false);
          commitText(text);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={cn(
          "min-w-10 border-none bg-transparent text-center tabular-nums outline-none",
          valueClasses,
        )}
      />
      <button
        type="button"
        onClick={() => stepBy(step)}
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
