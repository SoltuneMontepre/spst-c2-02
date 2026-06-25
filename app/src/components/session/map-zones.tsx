"use client";

import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { GAME_ZONES } from "@/lib/game-zones";
import { cn } from "@/lib/utils";

const MAP_ZONES = GAME_ZONES.filter((z) => z.screen !== "map");

const ZONE_THEME: Partial<Record<Role | "ALL", string>> = {
  PRODUCER: "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20",
  CONSUMER: "border-rose-200/80 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20",
  INTERMEDIARY:
    "border-violet-200/80 bg-violet-50/50 dark:border-violet-900/40 dark:bg-violet-950/20",
  GOVERNMENT:
    "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20",
  ALL: "border-sky-200/80 bg-sky-50/50 dark:border-sky-900/40 dark:bg-sky-950/20",
};

function zoneParticipants(zoneRole: Role | "ALL", participants: ParticipantView[]) {
  if (zoneRole === "ALL") return participants;
  return participants.filter((p) => p.role === zoneRole);
}

export { zoneLabelForRole } from "@/lib/game-zones";

function LegendCard() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/20 p-4 text-left">
      <span className="text-sm font-medium">Chú giải</span>
      <ul className="space-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" /> Online
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-muted-foreground/40" /> Offline
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-500" /> Bot
        </li>
      </ul>
    </div>
  );
}

export function MapZones({
  sessionId,
  role,
  participants = [],
  interactive = true,
}: {
  sessionId: string;
  role: Role | null;
  participants?: ParticipantView[];
  interactive?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {MAP_ZONES.map((zone) => {
        const highlight = zone.role === role;
        const present = zoneParticipants(zone.role, participants);
        const theme = ZONE_THEME[zone.role] ?? "border-border bg-surface";
        const className = cn(
          "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors sm:p-5",
          theme,
          highlight && "ring-2 ring-primary/30",
          interactive ? "hover:shadow-sm" : "cursor-default opacity-95",
        );

        const inner = (
          <>
            <zone.icon
              className={cn(
                "size-7",
                highlight ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span className="text-sm font-semibold">{zone.label}</span>
            <p className="text-xs leading-snug text-muted-foreground">{zone.hint}</p>
            <div className="flex min-h-8 w-full flex-wrap gap-1">
              {present.length > 0 ? (
                present.slice(0, 4).map((p) => (
                  <span
                    key={p.id}
                    title={p.displayName}
                    className={cn(
                      "inline-flex max-w-[6rem] items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px]",
                      p.isBot
                        ? "bg-amber-100 text-amber-900"
                        : p.presence === "ONLINE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        p.isBot
                          ? "bg-amber-500"
                          : p.presence === "ONLINE"
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/40",
                      )}
                    />
                    {p.displayName.split(" ").pop()}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Không có người</span>
              )}
            </div>
            {highlight ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                {interactive ? "Khu của bạn" : "Khu của bạn"}
              </span>
            ) : null}
          </>
        );

        if (interactive) {
          return (
            <Link key={zone.label} href={zone.href(sessionId)} className={className}>
              {inner}
            </Link>
          );
        }

        return (
          <div key={zone.label} className={className} aria-disabled>
            {inner}
          </div>
        );
      })}
      <LegendCard />
    </div>
  );
}
