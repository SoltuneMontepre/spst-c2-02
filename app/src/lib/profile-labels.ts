import type { Role } from "@/generated/prisma/enums";
import { ROLE_SHORT_LABELS } from "@/lib/display-labels";

export function formatTopRoleShort(role: Role | null): string {
  if (!role) return "—";
  return ROLE_SHORT_LABELS[role];
}
