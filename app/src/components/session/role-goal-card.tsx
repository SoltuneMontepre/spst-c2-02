"use client";

import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/display-labels";
import { getRoleGoalSummary, roleTutorialIcon } from "@/lib/role-tutorial";
import { cn } from "@/lib/utils";

const ROLE_GOAL_THEME: Record<Role, string> = {
  PRODUCER: "bg-success/15 text-success",
  CONSUMER: "bg-primary/10 text-primary",
  INTERMEDIARY: "bg-violet-600/10 text-violet-700",
  GOVERNMENT: "bg-amber-700/10 text-amber-800",
};

export function RoleGoalCard({ role }: { role: Role }) {
  const goal = getRoleGoalSummary(role);
  const Icon = roleTutorialIcon(role);

  return (
    <section
      className="rounded-[14px] border border-border bg-surface p-4 shadow-sm"
      aria-labelledby="role-goal-title"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              ROLE_GOAL_THEME[role],
            )}
          >
            <Icon className="size-4.5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Mục tiêu / Cách thắng
            </p>
            <h2
              id="role-goal-title"
              className="mt-1 text-base font-semibold tracking-tight"
            >
              {ROLE_LABELS[role]}
            </h2>
          </div>
        </div>
        <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Tính điểm: {goal.metricLabel}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Cách thắng: </span>
        {goal.winText}
      </p>

      <ul className="mt-3 grid gap-2 md:grid-cols-3">
        {goal.bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2 rounded-[10.5px] bg-muted/30 px-3 py-2 text-xs leading-relaxed text-foreground"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
