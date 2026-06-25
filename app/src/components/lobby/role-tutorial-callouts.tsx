"use client";

import { BookOpen } from "lucide-react";
import type { RoleTutorialAction } from "@/lib/role-tutorial";
import { cn } from "@/lib/utils";

export function RoleTutorialCallouts({
  theoryCallout,
  goalCallout,
  actions,
}: {
  theoryCallout: string;
  goalCallout: string;
  actions: RoleTutorialAction[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <div className="flex items-center gap-1.5">
          <BookOpen className="size-3 text-amber-800/70" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900/80">
            Lý thuyết giá trị
          </p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-amber-900">{theoryCallout}</p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5">
        <div className="flex items-center gap-1.5">
          <BookOpen className="size-3 text-blue-700/70" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-wide text-blue-800/80">
            Mục tiêu vai trò
          </p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-blue-900">{goalCallout}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Các hành động chính
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-lg",
                    action.iconClassName,
                  )}
                >
                  <Icon className="size-3" aria-hidden />
                </span>
                <span className="text-xs text-foreground/80">{action.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function RoleTutorialProgress({ step }: { step: 0 | 1 | 2 }) {
  return (
    <div className="flex w-full gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 min-w-0 flex-1 rounded-full",
            i <= step ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}
