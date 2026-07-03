"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { EVENT_COPY, PHASE_LABELS, ROUND_NAMES } from "@/lib/labels";
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
  const quest =
    role != null
      ? getRoleQuest({
          role,
          phase,
          round,
          roleState,
          marketListingCount,
        })
      : null;
  const missionTitle = quest?.title ?? null;
  const missionBody = quest?.objective ?? quest?.action ?? null;
  const href =
    taskZone === "market"
      ? `/session/${sessionId}/market`
      : taskZone === "task"
        ? `/session/${sessionId}/task`
        : `/session/${sessionId}/game`;
  const showTaskLink = variant !== "map" && taskZone != null;
  const phaseTitle =
    phase === "DECISION"
      ? `Giai đoạn Ra quyết định — Vòng ${round}`
      : `Giai đoạn Giao dịch — Vòng ${round}${ROUND_NAMES[round] ? `: ${ROUND_NAMES[round]}` : ""}`;

  if (variant === "map") {
    const phaseBadge = phase ? PHASE_LABELS[phase] ?? phase : null;
    return (
      <div className="flex w-full items-start gap-3.5 rounded-[18px] bg-gradient-to-r from-[#c94a2d] to-[#e06040] px-5 py-4 shadow-md sm:items-center sm:py-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Zap className="size-6 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
              Nhiệm vụ của bạn
            </p>
            {phaseBadge ? (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                {phaseBadge}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-lg font-extrabold leading-tight text-white sm:text-xl">
            {missionTitle ?? phaseTitle}
          </p>
          {missionBody ? (
            <p className="mt-1 line-clamp-2 text-sm font-medium text-white/85">
              {missionBody}
            </p>
          ) : null}
        </div>
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
      {showTaskLink ? (
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
