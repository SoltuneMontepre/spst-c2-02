"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { PlayerDutyChip } from "@/components/session/player-duty-chip";
import {
  MAP_ZONE_DISPLAY,
  mapZoneDefForRole,
  type MapZoneDisplay,
  type MapZoneTheme,
} from "@/lib/game-zones";
import { buildPlayerEntries, type PlayerTimelineEntry } from "@/lib/phase-timeline";
import type {
  MarketView,
  ParticipantView,
  SelfState,
  SessionSnapshot,
} from "@/lib/session-service";
import { cn } from "@/lib/utils";

const THEME_STYLES: Record<
  MapZoneTheme,
  { card: string; icon: string; dot: string; highlight: string; active: string }
> = {
  green: {
    card: "border-emerald-200 bg-emerald-50/80",
    icon: "bg-emerald-600/13 text-emerald-700",
    dot: "bg-emerald-600",
    highlight: "ring-2 ring-emerald-400/45",
    active: "ring-1 ring-emerald-500/35",
  },
  rose: {
    card: "border-rose-200 bg-rose-50/80",
    icon: "bg-[#c94a2d]/13 text-[#c94a2d]",
    dot: "bg-[#c94a2d]",
    highlight: "ring-2 ring-rose-400/45",
    active: "ring-1 ring-rose-500/35",
  },
  violet: {
    card: "border-violet-200 bg-violet-50/80",
    icon: "bg-violet-600/13 text-violet-700",
    dot: "bg-violet-600",
    highlight: "ring-2 ring-violet-400/45",
    active: "ring-1 ring-violet-500/35",
  },
  amber: {
    card: "border-amber-200 bg-amber-50/80",
    icon: "bg-amber-700/13 text-amber-800",
    dot: "bg-amber-700",
    highlight: "ring-2 ring-amber-500/45",
    active: "ring-1 ring-amber-600/35",
  },
  sky: {
    card: "border-sky-200 bg-sky-50/80",
    icon: "bg-blue-700/13 text-blue-700",
    dot: "bg-blue-700",
    highlight: "ring-2 ring-sky-400/45",
    active: "ring-1 ring-sky-500/35",
  },
};

const MAP_ROLE_ZONES = MAP_ZONE_DISPLAY.filter((z) => z.role !== "ALL");
const MAP_OBSERVATORY_ZONE = MAP_ZONE_DISPLAY.find((z) => z.role === "ALL");

type MapZonesSnapshot = Pick<
  SessionSnapshot,
  | "phase"
  | "status"
  | "currentRound"
  | "self"
  | "market"
  | "autoHost"
  | "participants"
>;

export type MapZonesProps = {
  sessionId: string;
  role: Role | null;
  round: number;
  phase: string | null;
  status: string;
  self: SelfState | null;
  market: MarketView | null;
  autoHost: boolean;
  participants?: ParticipantView[];
  interactive?: boolean;
};

function zonePlayerEntries(
  zoneRole: Role | "ALL",
  entries: PlayerTimelineEntry[],
): PlayerTimelineEntry[] {
  if (zoneRole === "ALL") return entries;
  return entries.filter((entry) => entry.participant.role === zoneRole);
}

function zoneAriaLabel(
  mapLabel: string,
  entries: PlayerTimelineEntry[],
): string {
  if (entries.length === 0) return `${mapLabel}. Không có người.`;
  const players = entries
    .map((e) => `${e.participant.displayName}, ${e.title}`)
    .join("; ");
  return `${mapLabel}. ${players}.`;
}

function useMapPlayerEntries(snapshot: MapZonesSnapshot) {
  return useMemo(
    () => buildPlayerEntries(snapshot),
    [
      snapshot.phase,
      snapshot.status,
      snapshot.currentRound,
      snapshot.self,
      snapshot.market,
      snapshot.autoHost,
      snapshot.participants,
    ],
  );
}

export { zoneLabelForRole } from "@/lib/game-zones";

export function MapPresenceLegend() {
  return (
    <div className="rounded-[14px] border border-stone-200/60 bg-white/50 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        Chú giải
      </p>
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

function MapZoneCard({
  sessionId,
  display,
  zoneEntries,
  playerRole,
  inGame,
  interactive,
  layout = "grid",
}: {
  sessionId: string;
  display: MapZoneDisplay;
  zoneEntries: PlayerTimelineEntry[];
  playerRole: Role | null;
  inGame: boolean;
  interactive: boolean;
  layout?: "grid" | "standalone";
}) {
  const zone = mapZoneDefForRole(display.role);
  if (!zone) return null;

  const highlight = display.role !== "ALL" && display.role === playerRole;
  const hasActive = zoneEntries.some((e) => e.status === "active");
  const theme = THEME_STYLES[display.theme];
  const className = cn(
    "flex flex-col rounded-[14px] border-2 p-4 text-left transition-colors",
    layout === "grid" && "min-h-[200px] lg:min-h-[286px]",
    layout === "standalone" && "min-h-0",
    theme.card,
    highlight && theme.highlight,
    hasActive && theme.active,
    interactive ? "hover:shadow-md" : "cursor-default opacity-95",
  );

  const inner = (
    <>
      <div className="flex shrink-0 items-start gap-2.5 pb-2">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-[14.5px]",
            theme.icon,
          )}
        >
          <zone.icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-stone-900">{display.mapLabel}</p>
          <p className="text-[10px] font-semibold text-stone-500">{display.mapHint}</p>
        </div>
      </div>

      <div
        className={cn(
          "mt-2 flex min-h-0 flex-col gap-2",
          layout === "standalone"
            ? "max-h-[min(50vh,28rem)] overflow-y-auto"
            : "flex-1 overflow-y-auto",
        )}
      >
        {zoneEntries.length > 0 ? (
          layout === "standalone" ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {zoneEntries.map((entry) => (
                <PlayerDutyChip
                  key={entry.participant.id}
                  entry={entry}
                  inGame={inGame}
                  variant="map"
                  compact
                  className="w-full"
                />
              ))}
            </div>
          ) : (
            zoneEntries.map((entry) => (
              <PlayerDutyChip
                key={entry.participant.id}
                entry={entry}
                inGame={inGame}
                variant="map"
                compact
                className="w-full"
              />
            ))
          )
        ) : (
          <span className="text-[10px] font-semibold text-stone-400">
            Không có người
          </span>
        )}
      </div>
    </>
  );

  const ariaLabel = zoneAriaLabel(display.mapLabel, zoneEntries);

  if (interactive) {
    return (
      <Link href={zone.href(sessionId)} className={className} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} aria-label={ariaLabel} aria-disabled>
      {inner}
    </div>
  );
}

function MapObservatoryCollapsible({
  sessionId,
  display,
  zoneEntries,
  inGame,
  interactive,
}: {
  sessionId: string;
  display: MapZoneDisplay;
  zoneEntries: PlayerTimelineEntry[];
  inGame: boolean;
  interactive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const zone = mapZoneDefForRole(display.role);
  if (!zone) return null;

  const hasActive = zoneEntries.some((e) => e.status === "active");
  const theme = THEME_STYLES[display.theme];
  const panelId = "map-observatory-panel";
  const ZoneIcon = zone.icon;

  return (
    <div
      className={cn(
        "rounded-[14px] border-2 p-4 transition-colors",
        theme.card,
        hasActive && theme.active,
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-[14.5px]",
              theme.icon,
            )}
          >
            <ZoneIcon className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-bold text-stone-900">
                {display.mapLabel}
              </span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                {zoneEntries.length} người chơi
              </span>
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold text-stone-500">
              {display.mapHint}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "mt-0.5 size-4 shrink-0 text-stone-500 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {interactive ? (
          <Link
            href={zone.href(sessionId)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-sky-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-sky-800 transition-colors hover:bg-white"
            aria-label="Vào Tháp quan sát"
          >
            Mở tháp
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        ) : null}
      </div>

      {open ? (
        <div
          id={panelId}
          className="mt-3 max-h-[min(50vh,28rem)] overflow-y-auto"
        >
          {zoneEntries.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {zoneEntries.map((entry) => (
              <PlayerDutyChip
                key={entry.participant.id}
                entry={entry}
                inGame={inGame}
                variant="map"
                compact
                className="w-full"
              />
            ))}
          </div>
        ) : (
          <span className="text-[10px] font-semibold text-stone-400">
            Không có người
          </span>
        )}
      </div>
      ) : null}
    </div>
  );
}

export function MapZones({
  sessionId,
  role,
  round,
  phase,
  status,
  self,
  market,
  autoHost,
  participants = [],
  interactive = true,
}: MapZonesProps) {
  const snapshot: MapZonesSnapshot = {
    phase,
    status,
    currentRound: round,
    self,
    market,
    autoHost,
    participants,
  };

  const playerEntries = useMapPlayerEntries(snapshot);
  const inGame = status !== "LOBBY" && status !== "INTRO";

  return (
    <div className="relative min-h-[480px] overflow-hidden rounded-[14px] border border-stone-200/80 bg-[#eae8e0] lg:min-h-[640px]">
      <Image
        src="/map-texture.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 70vw, 100vw"
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

      <div className="relative z-10 grid grid-cols-2 gap-3 p-3 pt-10 lg:grid-cols-2 lg:gap-4 lg:p-4 lg:pt-12">
        {MAP_ROLE_ZONES.map((display) => (
          <MapZoneCard
            key={display.role}
            sessionId={sessionId}
            display={display}
            zoneEntries={zonePlayerEntries(display.role, playerEntries)}
            playerRole={role}
            inGame={inGame}
            interactive={interactive}
            layout="grid"
          />
        ))}
        {MAP_OBSERVATORY_ZONE ? (
          <div className="col-span-2">
            <MapObservatoryCollapsible
              sessionId={sessionId}
              display={MAP_OBSERVATORY_ZONE}
              zoneEntries={zonePlayerEntries("ALL", playerEntries)}
              inGame={inGame}
              interactive={interactive}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
