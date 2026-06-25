import { Landmark, Link2, ShoppingCart, Sprout } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import type { RoleDistribution } from "@/lib/lobby-readiness";
import { cn } from "@/lib/utils";

export const ROLE_ICONS: Record<Role, typeof Sprout> = {
  PRODUCER: Sprout,
  CONSUMER: ShoppingCart,
  INTERMEDIARY: Link2,
  GOVERNMENT: Landmark,
};

export function RoleDistributionDots({
  roles,
  compact = false,
}: {
  roles: RoleDistribution[];
  compact?: boolean;
}) {
  return (
    <ul className={cn(compact ? "space-y-2.5" : "space-y-3")}>
      {roles.map((r) => {
        const Icon = ROLE_ICONS[r.role];
        return (
          <li
            key={r.role}
            className={cn(
              "flex items-center",
              compact ? "justify-between gap-2" : "justify-between gap-3",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              {!compact ? (
                <span className="text-sm">{r.label}</span>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1">
              {Array.from({ length: r.target }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-full",
                    compact ? "size-2" : "size-2.5",
                    i < r.filled ? "bg-success" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
