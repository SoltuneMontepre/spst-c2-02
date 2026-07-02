import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/display-labels";
import { cn } from "@/lib/utils";

export { ROLE_LABELS };

export function RoleBadge({ role }: { role: Role | null }) {
  return (
    <span
      className={cn(
        "inline-block max-w-full truncate rounded-full px-2 py-0.5 text-xs font-medium",
        role ? "bg-accent/15 text-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {role ? ROLE_LABELS[role] : "Chưa phân vai"}
    </span>
  );
}
