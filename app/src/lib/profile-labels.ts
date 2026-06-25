import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/components/lobby/role-badge";

export function formatTopRoleShort(role: Role | null): string {
  if (!role) return "—";
  switch (role) {
    case "PRODUCER":
      return "Người SX";
    case "CONSUMER":
      return "Người TD";
    case "INTERMEDIARY":
      return "Trung gian";
    case "GOVERNMENT":
      return "Nhà nước";
    default:
      return ROLE_LABELS[role];
  }
}
