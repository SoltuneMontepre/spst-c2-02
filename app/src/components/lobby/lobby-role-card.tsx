"use client";

import type { Role } from "@/generated/prisma/enums";
import { BookOpen } from "lucide-react";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { Button } from "@/components/ui/button";
import {
  getRoleGoalSummary,
  getRoleTutorialContent,
  roleTutorialIcon,
} from "@/lib/role-tutorial";
import { cn } from "@/lib/utils";

const ROLE_TINT: Record<Role, { icon: string; badge: string; box: string; text: string }> = {
  PRODUCER: {
    icon: "bg-success/15 text-success border-success/30",
    badge: "bg-success/10 text-success",
    box: "bg-success/5 border-success/20",
    text: "text-success",
  },
  CONSUMER: {
    icon: "bg-blue-500/10 text-blue-600 border-blue-200",
    badge: "bg-blue-500/10 text-blue-600",
    box: "bg-blue-500/5 border-blue-200",
    text: "text-blue-700",
  },
  INTERMEDIARY: {
    icon: "bg-violet-500/10 text-violet-600 border-violet-200",
    badge: "bg-violet-500/10 text-violet-600",
    box: "bg-violet-500/5 border-violet-200",
    text: "text-violet-700",
  },
  GOVERNMENT: {
    icon: "bg-amber-500/10 text-amber-700 border-amber-200",
    badge: "bg-amber-500/10 text-amber-700",
    box: "bg-amber-500/5 border-amber-200",
    text: "text-amber-800",
  },
};

export function LobbyRoleCard({
  role,
  onOpenTutorial,
}: {
  role: Role | null;
  onOpenTutorial: () => void;
}) {
  if (!role) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-base font-bold">Chưa phân vai</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Host sẽ gán vai trước khi bắt đầu.
          </p>
        </div>
      </div>
    );
  }

  const content = getRoleTutorialContent(role);
  const goal = getRoleGoalSummary(role);
  const Icon = roleTutorialIcon(role);
  const tint = ROLE_TINT[role];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl border",
            tint.icon,
          )}
        >
          <Icon className="size-6" aria-hidden />
        </div>
        <h2 className="mt-3.5 text-base font-bold">{ROLE_LABELS[role]}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{content.zoneSubtitle}</p>
        <span
          className={cn(
            "mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
            tint.badge,
          )}
        >
          Vai trò của bạn
        </span>
        <div
          className={cn(
            "mt-3.5 w-full rounded-xl border p-3.5 text-left text-xs leading-relaxed",
            tint.box,
            tint.text,
          )}
        >
          {content.roleBlurb}
        </div>
      </div>
      <div className="mt-3.5 rounded-xl border border-border bg-muted/20 p-3.5 text-left">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Cách thắng
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            {goal.metricLabel}:
          </span>{" "}
          {goal.shortWinText}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full rounded-xl"
        onClick={onOpenTutorial}
      >
        <BookOpen className="size-3.5" aria-hidden />
        Xem hướng dẫn vai trò
      </Button>
    </div>
  );
}
