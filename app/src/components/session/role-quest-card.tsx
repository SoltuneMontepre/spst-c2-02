"use client";

import { MapPin } from "lucide-react";
import { getRoleQuest } from "@/lib/role-quest";
import type { SessionSnapshot } from "@/lib/session-service";
import { cn } from "@/lib/utils";

/** Nội dung nhiệm vụ — dùng bên trong tile «Nhiệm vụ», không lồng thêm header/khung. */
export function RoleQuestCard({ data }: { data: SessionSnapshot }) {
  const role = data.self?.role;
  if (!role) return null;

  const quest = getRoleQuest({
    role,
    phase: data.phase,
    round: data.currentRound,
    roleState: data.self?.roleState ?? null,
    marketListingCount: data.market?.listings.length ?? 0,
  });

  const progressPct =
    quest.progress && quest.progress.target > 0
      ? Math.min(100, Math.round((quest.progress.current / quest.progress.target) * 100))
      : null;

  return (
    <div className="flex flex-col gap-3">
      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="size-3 shrink-0" aria-hidden />
        {quest.zoneLabel}
      </p>

      <div>
        <p className="text-sm text-muted-foreground">{quest.objective}</p>
      </div>

      {quest.progress ? (
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span
              className={cn(
                "font-bold tabular-nums",
                quest.status === "done" ? "text-emerald-600" : "text-primary",
              )}
            >
              {quest.progress.current}/{quest.progress.target} {quest.progress.unit}
            </span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={quest.progress.current}
            aria-valuemin={0}
            aria-valuemax={quest.progress.target}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                quest.status === "done" ? "bg-emerald-500" : "bg-primary",
              )}
              style={{ width: `${progressPct ?? 0}%` }}
            />
          </div>
        </div>
      ) : null}

      <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed">
        <span className="font-medium text-foreground">Làm gì: </span>
        {quest.action}
      </p>
    </div>
  );
}
