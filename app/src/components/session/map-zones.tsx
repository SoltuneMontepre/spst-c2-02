"use client";

import Image from "next/image";
import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import {
  MAP_ZONE_DISPLAY,
  mapZoneDefForRole,
  type MapZoneTheme,
} from "@/lib/game-zones";
import { cn } from "@/lib/utils";

const THEME_STYLES: Record<
  MapZoneTheme,
  { card: string; icon: string; dot: string }
> = {
  green: {
    card: "border-emerald-200 bg-emerald-50/80",
    icon: "bg-emerald-600/13 text-emerald-700",
    dot: "bg-emerald-600",
  },
  rose: {
    card: "border-rose-200 bg-rose-50/80",
    icon: "bg-[#c94a2d]/13 text-[#c94a2d]",
    dot: "bg-[#c94a2d]",
  },
  violet: {
    card: "border-violet-200 bg-violet-50/80",
    icon: "bg-violet-600/13 text-violet-700",
    dot: "bg-violet-600",
  },
  amber: {
    card: "border-amber-200 bg-amber-50/80",
    icon: "bg-amber-700/13 text-amber-800",
    dot: "bg-amber-700",
  },
  sky: {
    card: "border-sky-200 bg-sky-50/80",
    icon: "bg-blue-700/13 text-blue-700",
    dot: "bg-blue-700",
  },
};

function zoneParticipants(zoneRole: Role | "ALL", participants: ParticipantView[]) {
  if (zoneRole === "ALL") return [];
  return participants.filter((p) => p.role === zoneRole);
}

export { zoneLabelForRole } from "@/lib/game-zones";

function LegendCard() {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-[14px] border border-stone-200/60 bg-white/50 p-4 lg:min-h-[286px]">
      <ul className="space-y-2 text-[11px] text-stone-500">
        <li className="flex items-center gap-2">
          <span className="size-[7px] rounded-full bg-emerald-400" />
          Online
        </li>
        <li className="flex items-center gap-2">
          <span className="size-[7px] rounded-full bg-stone-300" />
          Offline
        </li>
        <li className="flex items-center gap-2">
          <span className="size-[7px] rounded-full bg-amber-400" />
          Bot
        </li>
      </ul>
    </div>
  );
}

export function MapZones({
  sessionId,
  role,
  round,
  participants = [],
  interactive = true,
}: {
  sessionId: string;
  role: Role | null;
  round: number;
  participants?: ParticipantView[];
  interactive?: boolean;
}) {
  return (
    <div className="relative min-h-[480px] overflow-hidden rounded-[14px] border border-stone-200/80 bg-[#eae8e0] lg:min-h-[640px]">
      <Image
        src="/map-texture.png"
        alt=""
        fill
        className="pointer-events-none object-cover opacity-25"
        aria-hidden
        priority
      />
      <div className="pointer-events-none absolute inset-0 bg-[#f5f0e8]/80" aria-hidden />

      <div className="absolute left-3.5 top-3.5 z-10 rounded-[10.5px] bg-stone-900/80 px-2.5 py-1">
        <span className="text-xs font-bold text-[#ffd230]">
          Chợ Thanh Long · Vòng {round}
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-3 p-3 pt-10 lg:grid-cols-3 lg:gap-4 lg:p-4 lg:pt-12">
        {MAP_ZONE_DISPLAY.map((display) => {
          const zone = mapZoneDefForRole(display.role);
          if (!zone) return null;

          const highlight = display.role !== "ALL" && display.role === role;
          const present = zoneParticipants(display.role, participants);
          const theme = THEME_STYLES[display.theme];
          const className = cn(
            "flex min-h-[200px] flex-col rounded-[14px] border-2 p-4 text-left transition-colors lg:min-h-[286px]",
            theme.card,
            highlight && "ring-2 ring-primary/40",
            interactive ? "hover:shadow-md" : "cursor-default opacity-95",
          );

          const inner = (
            <>
              <div className="flex items-start gap-2.5 pb-2.5">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-[14.5px]",
                    theme.icon,
                  )}
                >
                  <zone.icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-stone-900">
                    {display.mapLabel}
                  </p>
                  <p className="text-[10px] font-semibold text-stone-500">
                    {display.mapHint}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex min-h-8 w-full flex-wrap gap-1">
                {present.length > 0 ? (
                  present.slice(0, 4).map((p) => (
                    <span
                      key={p.id}
                      title={p.displayName}
                      className="inline-flex max-w-[6.5rem] items-center gap-1 truncate rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-stone-700"
                    >
                      <span
                        className={cn(
                          "size-[5px] shrink-0 rounded-full",
                          p.isBot
                            ? "bg-amber-400"
                            : p.presence === "ONLINE"
                              ? theme.dot
                              : "bg-stone-300",
                        )}
                      />
                      {p.displayName.split(" ").pop()}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-semibold text-stone-400">
                    Không có người
                  </span>
                )}
              </div>
            </>
          );

          if (interactive) {
            return (
              <Link
                key={display.role}
                href={zone.href(sessionId)}
                className={className}
              >
                {inner}
              </Link>
            );
          }

          return (
            <div key={display.role} className={className} aria-disabled>
              {inner}
            </div>
          );
        })}
        <LegendCard />
      </div>
    </div>
  );
}
