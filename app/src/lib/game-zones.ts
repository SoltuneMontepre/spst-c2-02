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
    href: (id) => `/session/${id}/game`,
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
    label: "Cơ quan quản lý",
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

export type MapZoneTheme = "green" | "rose" | "violet" | "amber" | "sky";

export interface MapZoneDisplay {
  role: Role | "ALL";
  mapLabel: string;
  mapHint: string;
  theme: MapZoneTheme;
}

/** Map grid order and copy — Figma `17:777` game play frame. */
export const MAP_ZONE_DISPLAY: MapZoneDisplay[] = [
  {
    role: "PRODUCER",
    mapLabel: "Nông trại",
    mapHint: "Sản xuất & dự trữ",
    theme: "green",
  },
  {
    role: "CONSUMER",
    mapLabel: "Quầy bán lẻ",
    mapHint: "Bán trực tiếp khách hàng",
    theme: "rose",
  },
  {
    role: "INTERMEDIARY",
    mapLabel: "Phân phối",
    mapHint: "Giao dịch bán sỉ",
    theme: "violet",
  },
  {
    role: "GOVERNMENT",
    mapLabel: "Văn phòng quản lý",
    mapHint: "Chính sách & điều tiết",
    theme: "amber",
  },
  {
    role: "ALL",
    mapLabel: "Tháp quan sát",
    mapHint: "Giám sát thị trường",
    theme: "sky",
  },
];

export function mapZoneDefForRole(role: Role | "ALL"): GameZoneDef | undefined {
  if (role === "ALL") {
    return GAME_ZONES.find((z) => z.screen === "observatory");
  }
  return GAME_ZONES.find((z) => z.role === role);
}

/** Nav items visible for a player role (map + tower + own task zone). */
export function zonesForPlayer(role: Role | null): GameZoneDef[] {
  return GAME_ZONES.filter(
    (z) => z.role === "ALL" || z.role === role,
  );
}
