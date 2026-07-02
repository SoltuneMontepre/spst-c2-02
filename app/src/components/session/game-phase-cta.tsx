"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { EVENT_COPY, ROUND_NAMES } from "@/lib/labels";
import { getRoleQuest } from "@/lib/role-quest";
import { getTaskZoneForPhase } from "@/lib/zone-phase";
import { zoneLabelForRole } from "@/lib/game-zones";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GamePhaseCta({
  sessionId,
  phase,
  round,
  role,
  roleState = null,
  marketListingCount = 0,
  variant = "default",
}: {
  sessionId: string;
  phase: string | null;
  round: number;
  role: Role | null;
  roleState?: unknown;
  marketListingCount?: number;
  variant?: "default" | "map";
}) {
  if (phase !== "DECISION" && phase !== "MARKET_OPEN") return null;

  const event = EVENT_COPY[round];
  const taskZone = getTaskZoneForPhase(role, phase, round);
  const missionTitle =
    role != null
      ? getRoleQuest({
          role,
          phase,
          round,
          roleState,
          marketListingCount,
        }).title
      : null;
  const href =
    taskZone === "market"
      ? `/session/${sessionId}/market`
      : taskZone === "task"
        ? `/session/${sessionId}/task`
        : `/session/${sessionId}/map`;

  const phaseTitle =
    phase === "DECISION"
      ? `Giai đoạn Ra quyết định — Vòng ${round}`
      : `Giai đoạn Giao dịch — Vòng ${round}${ROUND_NAMES[round] ? `: ${ROUND_NAMES[round]}` : ""}`;

  if (variant === "map") {
    return (
      <div className="flex w-full flex-col gap-3 rounded-[14.5px] bg-gradient-to-r from-[#c94a2d] to-[#e06040] px-[17.5px] py-[10.5px] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <Zap className="size-[15px] shrink-0 text-white" aria-hidden />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-white">{phaseTitle}</p>
            {missionTitle ? (
              <p className="mt-0.5 truncate text-[11px] font-medium text-white/80">
                {missionTitle}
              </p>
            ) : null}
          </div>
        </div>
        {taskZone ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[10.5px] border border-white/20 bg-white/15 px-[15px] py-[6.25px] text-[12px] font-bold text-white transition-colors hover:bg-white/25"
          >
            Đi tới nhiệm vụ
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
          <Zap className="size-5 text-primary" aria-hidden />
        </div>
        <div>
          <p className="font-semibold text-foreground">{phaseTitle}</p>
          {event ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{event.title}</p>
          ) : null}
          {role && taskZone ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Vào {zoneLabelForRole(role)} để tiếp tục.
            </p>
          ) : null}
        </div>
      </div>
      {taskZone ? (
        <Link
          href={href}
          className={cn(buttonVariants({ size: "lg" }), "shrink-0")}
        >
          Đi tới nhiệm vụ →
        </Link>
      ) : null}
    </div>
  );
}
