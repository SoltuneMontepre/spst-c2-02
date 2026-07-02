import type { Role } from "@/generated/prisma/enums";

export const ROLE_LABELS: Record<Role, string> = {
  PRODUCER: "Nhà cung cấp",
  CONSUMER: "Khách hàng",
  INTERMEDIARY: "Đại lý phân phối",
  GOVERNMENT: "Cơ quan quản lý thị trường",
};

export const ROLE_SHORT_LABELS: Record<Role, string> = {
  PRODUCER: "Nhà cung cấp",
  CONSUMER: "Khách hàng",
  INTERMEDIARY: "Đại lý",
  GOVERNMENT: "Quản lý",
};

export const ROLE_BOT_LABELS: Record<Role, string> = {
  PRODUCER: "Bot Nhà cung cấp",
  CONSUMER: "Bot Khách hàng",
  INTERMEDIARY: "Bot Đại lý",
  GOVERNMENT: "Bot Quản lý",
};

export const ECONOMY_LABELS = {
  privateUnitCost: "Chi phí riêng/thùng",
  standardValue: "Giá trị chuẩn",
  productionCost: "Chi phí sản xuất",
  privateCost: "Chi phí riêng",
  valueBenchmark: "Mốc so sánh giá",
  roundCapacity: "Năng lực vòng",
} as const;
