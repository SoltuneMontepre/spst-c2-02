"use client";

import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import { type GameScreen, zonesForPlayer } from "@/lib/game-zones";
import { getTaskZoneForPhase } from "@/lib/zone-phase";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { cn } from "@/lib/utils";

export function ZoneNav({
  sessionId,
  active,
  role,
  phase,
  round,
}: {
  sessionId: string;
  active: GameScreen;
  role: Role | null;
  phase: string | null;
  round: number;
}) {
  const items = zonesForPlayer(role);
  const taskZone = getTaskZoneForPhase(role, phase, round);

  return (
    <nav className="flex flex-col gap-1.5" aria-label="Khu vực phiên chợ">
      {role ? (
        <p className="mb-1 text-xs text-muted-foreground">
          Vai của bạn: <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span>
        </p>
      ) : null}
      {items.map((zone) => {
        const isRoute = zone.screen === active && (zone.role === "ALL" || zone.role === role);
        const isTaskNow =
          taskZone !== null &&
          zone.screen === taskZone &&
          (zone.role === "ALL" || zone.role === role);
        const isYourZone = zone.role === role;

        return (
          <Link
            key={`${zone.screen}-${zone.label}`}
            href={zone.href(sessionId)}
            className={cn(
              "relative flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
              isRoute
                ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                : isTaskNow
                  ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
                  : isYourZone
                    ? "border-border bg-surface hover:bg-muted"
                    : "border-border bg-surface hover:bg-muted",
            )}
          >
            {isTaskNow && !isRoute ? (
              <span className="absolute right-2 top-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Làm ngay
              </span>
            ) : null}
            <zone.icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                isRoute || isTaskNow ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span className="min-w-0 flex-1 pr-8">
              <span className="block text-sm font-medium leading-snug">{zone.label}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                {zone.hint}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
