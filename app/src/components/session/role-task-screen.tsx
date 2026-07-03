"use client";

import type { ReactNode } from "react";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS, ROLE_SHORT_LABELS } from "@/lib/display-labels";
import { ROLE_ICONS } from "@/components/lobby/role-distribution-dots";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { RoleGoalCard } from "@/components/session/role-goal-card";
import { PHASE_LABELS } from "@/lib/labels";
import type { GameScreen } from "@/lib/game-zones";
import { cn } from "@/lib/utils";

const ROLE_TABS: { role: Role; label: string }[] = [
  { role: "PRODUCER", label: ROLE_SHORT_LABELS.PRODUCER },
  { role: "CONSUMER", label: ROLE_SHORT_LABELS.CONSUMER },
  { role: "INTERMEDIARY", label: ROLE_SHORT_LABELS.INTERMEDIARY },
  { role: "GOVERNMENT", label: ROLE_SHORT_LABELS.GOVERNMENT },
];

const ROLE_THEME: Record<Role, string> = {
  PRODUCER: "bg-emerald-600/13 text-emerald-700",
  CONSUMER: "bg-[#c94a2d]/13 text-[#c94a2d]",
  INTERMEDIARY: "bg-violet-600/13 text-violet-700",
  GOVERNMENT: "bg-amber-700/13 text-amber-800",
};

export function RoleTaskHeader({
  role,
  round,
  phase,
}: {
  role: Role;
  round: number;
  phase: string | null;
}) {
  const Icon = ROLE_ICONS[role];
  const phaseLabel = phase ? PHASE_LABELS[phase] ?? phase : "";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex gap-3">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-[14.5px] sm:size-8",
            ROLE_THEME[role],
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Nhiệm vụ — {ROLE_LABELS[role]}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Vòng {round}
            {phaseLabel ? ` · ${phaseLabel}` : ""}
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-1 rounded-[10.5px] border border-border bg-surface p-1"
        role="tablist"
        aria-label="Vai trò trong phiên"
      >
        {ROLE_TABS.map((tab) => (
          <span
            key={tab.role}
            role="tab"
            aria-selected={tab.role === role}
            aria-current={tab.role === role ? "true" : undefined}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-center text-[11px] font-semibold sm:px-3 sm:text-xs",
              tab.role === role
                ? "bg-secondary text-primary"
                : "text-muted-foreground",
            )}
          >
            {tab.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RoleActionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-[14px] border border-border bg-surface p-[18px] shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        {Icon ? <Icon className="size-[15px] text-primary" aria-hidden /> : null}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {children}
    </div>
  );
}

export function RoleTaskScreen({
  sessionId,
  activeZone,
  role,
  round,
  phase,
  insight,
  children,
}: {
  sessionId: string;
  activeZone: GameScreen;
  role: Role;
  round: number;
  phase: string | null;
  insight: ReactNode;
  children: ReactNode;
}) {
  return (
    <GameSessionLayout
      variant="focused"
      sessionId={sessionId}
      activeZone={activeZone}
      rightPanel={insight}
    >
      <RoleTaskHeader role={role} round={round} phase={phase} />
      <RoleGoalCard role={role} />
      <div className="flex flex-col gap-4">{children}</div>
    </GameSessionLayout>
  );
}
