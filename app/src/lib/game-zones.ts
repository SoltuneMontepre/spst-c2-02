import {
  Sprout,
  ShoppingCart,
  Link2,
  Landmark,
  Telescope,
  Map,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/generated/prisma/enums";

export type GameScreen = "map" | "observatory" | "market" | "task";

export interface GameZoneDef {
  screen: GameScreen;
  label: string;
  hint: string;
  icon: LucideIcon;
  role: Role | "ALL";
  href: (sessionId: string) => string;
}

export const GAME_ZONES: GameZoneDef[] = [
  {
    screen: "map",
    label: "Bản đồ tổng",
    hint: "Xem toàn cảnh & chọn khu",
    icon: Map,
    role: "ALL",
    href: (id) => `/session/${id}/map`,
  },
  {
    screen: "observatory",
    label: "Tháp quan sát",
    hint: "Biểu đồ giá trị vs giá",
    icon: Telescope,
    role: "ALL",
    href: (id) => `/session/${id}/observatory`,
  },
  {
    screen: "task",
    label: "Nông trại",
    hint: "Sản xuất & nâng cấp",
    icon: Sprout,
    role: "PRODUCER",
    href: (id) => `/session/${id}/task`,
  },
  {
    screen: "task",
    label: "Nhà nước",
    hint: "Chính sách can thiệp",
    icon: Landmark,
    role: "GOVERNMENT",
    href: (id) => `/session/${id}/task`,
  },
  {
    screen: "task",
    label: "Trung tâm phân phối",
    hint: "Mua buôn & bán lẻ",
    icon: Link2,
    role: "INTERMEDIARY",
    href: (id) => `/session/${id}/task`,
  },
  {
    screen: "market",
    label: "Quầy chợ",
    hint: "Mua hàng & đề nghị giá",
    icon: ShoppingCart,
    role: "CONSUMER",
    href: (id) => `/session/${id}/market`,
  },
];

export function zoneLabelForRole(role: Role): string {
  return GAME_ZONES.find((z) => z.role === role)?.label ?? "Bản đồ";
}

/** Nav items visible for a player role (map + tower + own task zone). */
export function zonesForPlayer(role: Role | null): GameZoneDef[] {
  return GAME_ZONES.filter(
    (z) => z.role === "ALL" || z.role === role,
  );
}
