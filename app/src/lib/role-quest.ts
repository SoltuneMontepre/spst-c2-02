import type { Role } from "@/generated/prisma/enums";
import { zoneLabelForRole } from "@/lib/game-zones";
import type {
  AnyRoleState,
  ConsumerRoundState,
  GovernmentRoundState,
  IntermediaryRoundState,
  ProducerRoundState,
} from "@/lib/role-state";

const ROLE_LABELS: Record<Role, string> = {
  PRODUCER: "Người sản xuất",
  CONSUMER: "Người tiêu dùng",
  INTERMEDIARY: "Trung gian",
  GOVERNMENT: "Nhà nước",
};

export interface RoleQuest {
  role: Role;
  roleLabel: string;
  zoneLabel: string;
  title: string;
  objective: string;
  action: string;
  progress?: { current: number; target: number; unit: string };
  status: "active" | "waiting" | "done";
}

export function getRoleQuest(params: {
  role: Role;
  phase: string | null;
  round: number;
  roleState: unknown;
  marketListingCount?: number;
}): RoleQuest {
  const { role, phase, round, roleState, marketListingCount = 0 } = params;
  const base = {
    role,
    roleLabel: ROLE_LABELS[role],
    zoneLabel: zoneLabelForRole(role),
  };
  const state = roleState as AnyRoleState | null;

  if (role === "CONSUMER") {
    const cs = state?.kind === "CONSUMER" ? (state as ConsumerRoundState) : null;
    const current = cs?.fulfilledUnits ?? 0;
    const target = cs?.needTarget ?? 0;
    const done = target > 0 && current >= target;
    const waitBase = { ...base, zoneLabel: phase === "MARKET_OPEN" ? base.zoneLabel : "Bản đồ" };

    if (phase === "MARKET_OPEN") {
      return {
        ...waitBase,
        title: done ? "Đã đủ nhu cầu vòng này" : "Mua đủ thanh long cho nhu cầu",
        objective: `Cần ${target} thùng để nhận hiệu ích (điểm người tiêu dùng).`,
        action: done
          ? "Bạn có thể mua thêm hoặc chờ chuyển giai đoạn."
          : marketListingCount === 0
            ? "Chờ nhà sản xuất/trung gian niêm yết — quầy sẽ hiện bên dưới khi có hàng."
            : "Chọn quầy bên dưới → «Mua 1 thùng» hoặc gửi đề nghị giá thấp hơn.",
        progress: target > 0 ? { current, target, unit: "thùng" } : undefined,
        status: done ? "done" : "active",
      };
    }
    if (phase === "DECISION") {
      return {
        ...waitBase,
        title: "Chuẩn bị cho chợ",
        objective: `Nhu cầu vòng ${round}: ${target} thùng thanh long.`,
        action:
          "Giai đoạn «Ra quyết định» — bạn chờ nhà sản xuất. Khi «Chợ mở», vào Quầy chợ để mua.",
        progress: target > 0 ? { current, target, unit: "thùng" } : undefined,
        status: "waiting",
      };
    }
    return {
      ...waitBase,
      title: "Theo dõi nhu cầu",
      objective: target > 0 ? `Mục tiêu vòng ${round}: ${target} thùng.` : "Chờ bắt đầu vòng.",
      action: phase === "EVENT" ? "Đọc biến cố vòng — chợ mở sau giai đoạn ra quyết định." : "Chờ giai đoạn tiếp theo.",
      progress: target > 0 ? { current, target, unit: "thùng" } : undefined,
      status: "waiting",
    };
  }

  if (role === "PRODUCER") {
    const ps = state?.kind === "PRODUCER" ? (state as ProducerRoundState) : null;
    const produced = ps?.producedQuantity ?? 0;
    const cap = ps
      ? Math.min(
          Math.floor(ps.availableLaborPoints / ps.individualLaborTime),
          ps.productionCap,
        )
      : 0;

    if (phase === "DECISION") {
      return {
        ...base,
        title: "Sản xuất thanh long",
        objective: `Tối đa ~${cap} thùng vòng này (theo lao động & vốn).`,
        action:
          produced > 0
            ? "Đã sản xuất — có thể sản xuất thêm hoặc đầu tư nâng cấp trước khi hết giờ."
            : "Chọn số thùng sản xuất bên dưới. 15 giây đầu có thể bị khóa nếu Nhà nước ban hành chính sách.",
        progress: cap > 0 ? { current: produced, target: cap, unit: "thùng" } : undefined,
        status: produced >= cap && cap > 0 ? "done" : "active",
      };
    }
    if (phase === "MARKET_OPEN") {
      return {
        ...base,
        title: "Bán hàng trên chợ",
        objective: "Niêm yết giá lẻ hoặc bán buôn cho trung gian.",
        action: "Đăng giá bán lẻ bên dưới, hoặc chấp nhận đề nghị mua từ người mua.",
        progress: produced > 0 ? { current: produced, target: produced, unit: "đã SX" } : undefined,
        status: "active",
      };
    }
    return {
      ...base,
      title: "Nông trại",
      objective: `Vòng ${round} — chờ giai đoạn sản xuất hoặc bán.`,
      action: phase === "EVENT" ? "Đọc biến cố — ảnh hưởng cung & giá trị." : "Chờ «Ra quyết định» hoặc «Chợ mở».",
      status: "waiting",
    };
  }

  if (role === "INTERMEDIARY") {
    if (phase === "MARKET_OPEN") {
      return {
        ...base,
        title: "Mua buôn & bán lẻ",
        objective: "Kết nối sản xuất với người tiêu dùng — kiếm chênh lệch.",
        action: "Chấp nhận/đề nghị mua buôn, rồi niêm yết bán lẻ cho người tiêu dùng.",
        status: "active",
      };
    }
    if (phase === "DECISION") {
      return {
        ...base,
        title: "Chuẩn bị phân phối",
        objective: "Chờ nhà sản xuất hoàn thành sản xuất.",
        action: "Khi chợ mở, vào Trung tâm phân phối để mua buôn và bán lẻ.",
        status: "waiting",
      };
    }
    return {
      ...base,
      title: "Trung gian thị trường",
      objective: "Mua từ sản xuất, bán cho người tiêu dùng.",
      action: "Chờ giai đoạn chợ mở để giao dịch.",
      status: "waiting",
    };
  }

  if (role === "GOVERNMENT") {
    const gs = state?.kind === "GOVERNMENT" ? (state as GovernmentRoundState) : null;
    const used = gs?.policyUsed ?? false;
    if (phase === "DECISION" && round >= 2) {
      return {
        ...base,
        title: used ? "Đã chọn chính sách" : "Chọn chính sách can thiệp",
        objective: "Một chính sách mỗi vòng — ảnh hưởng cung, cầu hoặc thông tin.",
        action: used
          ? "Chờ chợ mở hoặc chuyển giai đoạn."
          : "Chọn chính sách bên dưới (hoặc «Không can thiệp»).",
        status: used ? "done" : "active",
      };
    }
    return {
      ...base,
      title: round < 2 ? "Quan sát vòng 1" : "Nhà nước",
      objective: round < 2 ? "Vòng 1 chưa có chính sách can thiệp." : "Theo dõi thị trường & ngân sách.",
      action: "Xem Tháp quan sát hoặc chờ giai đoạn ra quyết định.",
      status: "waiting",
    };
  }

  return {
    ...base,
    title: "Nhiệm vụ",
    objective: "Theo dõi phiên.",
    action: "Chọn khu trên bản đồ.",
    status: "waiting",
  };
}
