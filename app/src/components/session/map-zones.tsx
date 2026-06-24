import Link from "next/link";
import { Sprout, ShoppingCart, Link2, Landmark, Telescope, type LucideIcon } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";

interface Zone {
  key: string;
  label: string;
  icon: LucideIcon;
  role: Role | "ALL";
  href: (id: string) => string;
}

const ZONES: Zone[] = [
  { key: "tower", label: "Tháp quan sát", icon: Telescope, role: "ALL", href: (id) => `/session/${id}/observatory` },
  { key: "farm", label: "Nông trại", icon: Sprout, role: "PRODUCER", href: (id) => `/session/${id}/task` },
  { key: "state", label: "Nhà nước", icon: Landmark, role: "GOVERNMENT", href: (id) => `/session/${id}/task` },
  { key: "market", label: "Quầy chợ", icon: ShoppingCart, role: "CONSUMER", href: (id) => `/session/${id}/market` },
  { key: "dist", label: "Trung tâm phân phối", icon: Link2, role: "INTERMEDIARY", href: (id) => `/session/${id}/task` },
];

function zoneParticipants(zoneRole: Role | "ALL", participants: ParticipantView[]) {
  if (zoneRole === "ALL") return participants;
  return participants.filter((p) => p.role === zoneRole);
}

export function MapZones({
  sessionId,
  role,
  participants = [],
}: {
  sessionId: string;
  role: Role | null;
  participants?: ParticipantView[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ZONES.map((zone) => {
        const highlight = zone.role === role;
        const present = zoneParticipants(zone.role, participants);
        return (
          <Link
            key={zone.key}
            href={zone.href(sessionId)}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-colors ${
              highlight
                ? "border-primary bg-primary/5"
                : "border-border bg-surface hover:bg-muted"
            }`}
          >
            <zone.icon className={highlight ? "size-7 text-primary" : "size-7 text-muted-foreground"} />
            <span className="text-sm font-medium">{zone.label}</span>
            {present.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-1">
                {present.slice(0, 4).map((p) => (
                  <span
                    key={p.id}
                    title={`${p.displayName} · ${p.role ? ROLE_LABELS[p.role] : ""}`}
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      p.presence === "ONLINE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.displayName.split(" ").pop()}
                    {p.isBot ? " 🤖" : p.presence === "OFFLINE" ? " ○" : ""}
                  </span>
                ))}
              </div>
            ) : null}
            {highlight ? (
              <span className="text-xs text-primary">Khu của bạn</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
