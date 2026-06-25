"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { EVENT_COPY, ROUND_NAMES } from "@/lib/labels";
import { getTaskZoneForPhase } from "@/lib/zone-phase";
import { zoneLabelForRole } from "@/lib/game-zones";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GamePhaseCta({
  sessionId,
  phase,
  round,
  role,
}: {
  sessionId: string;
  phase: string | null;
  round: number;
  role: Role | null;
}) {
  if (phase !== "DECISION" && phase !== "MARKET_OPEN") return null;

  const event = EVENT_COPY[round];
  const taskZone = getTaskZoneForPhase(role, phase, round);
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

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
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
