import Link from "next/link";
import { Sprout, ShoppingCart, Link2, Landmark, Telescope, type LucideIcon } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";

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

export function MapZones({ sessionId, role }: { sessionId: string; role: Role | null }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ZONES.map((zone) => {
        const highlight = zone.role === role;
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
            {highlight ? (
              <span className="text-xs text-primary">Khu của bạn</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
