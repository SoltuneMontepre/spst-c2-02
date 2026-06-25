"use client";

import { Landmark, Link2, ShoppingCart, Sprout } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { RoleDistribution } from "@/lib/lobby-readiness";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<Role, typeof Sprout> = {
  PRODUCER: Sprout,
  CONSUMER: ShoppingCart,
  INTERMEDIARY: Link2,
  GOVERNMENT: Landmark,
};

export function HostRoleDistribution({ roles }: { roles: RoleDistribution[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Phân bổ vai trò</h3>
      <ul className="mt-4 space-y-3">
        {roles.map((r) => {
          const Icon = ROLE_ICONS[r.role];
          return (
            <li key={r.role} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                <span>{r.label}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: r.target }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "size-2.5 rounded-full",
                      i < r.filled ? "bg-success" : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
