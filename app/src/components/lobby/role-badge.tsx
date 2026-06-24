import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const ROLE_LABELS: Record<Role, string> = {
  PRODUCER: "Người sản xuất",
  CONSUMER: "Người tiêu dùng",
  INTERMEDIARY: "Trung gian",
  GOVERNMENT: "Nhà nước",
};

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
