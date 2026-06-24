import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { GAME_ZONES } from "@/lib/game-zones";
import { cn } from "@/lib/utils";

const MAP_ZONES = GAME_ZONES.filter((z) => z.screen !== "map");

function zoneParticipants(zoneRole: Role | "ALL", participants: ParticipantView[]) {
  if (zoneRole === "ALL") return participants;
  return participants.filter((p) => p.role === zoneRole);
}

export { zoneLabelForRole } from "@/lib/game-zones";

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
    <div className="grid grid-cols-2 gap-3">
      {MAP_ZONES.map((zone) => {
        const highlight = zone.role === role;
        const present = zoneParticipants(zone.role, participants);
        const className = cn(
          "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors sm:p-5",
          highlight
            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
            : "border-border bg-surface",
          interactive
            ? highlight
              ? "hover:bg-primary/10"
              : "hover:bg-muted"
            : "cursor-default opacity-95",
        );

        const inner = (
          <>
            <zone.icon
              className={cn(
                "size-7",
                highlight ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span className="text-sm font-medium">{zone.label}</span>
            <p className="min-h-8 text-[11px] leading-snug text-muted-foreground">
              {zone.hint}
            </p>
            <div className="flex min-h-10 w-full flex-wrap items-center justify-center gap-1">
              {present.length > 0
                ? present.slice(0, 4).map((p) => (
                    <span
                      key={p.id}
                      title={p.displayName}
                      className={cn(
                        "max-w-[5.5rem] truncate rounded-full px-2 py-0.5 text-[10px]",
                        p.presence === "ONLINE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {p.displayName.split(" ").pop()}
                      {p.isBot ? " 🤖" : p.presence === "OFFLINE" ? " ○" : ""}
                    </span>
                  ))
                : null}
            </div>
            {highlight ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                {interactive ? "Khu của bạn — chạm để vào" : "Khu của bạn"}
              </span>
            ) : null}
            {!interactive ? (
              <span className="text-[10px] text-muted-foreground">Xem trước</span>
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
    </div>
  );
}
