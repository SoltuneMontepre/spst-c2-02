import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/display-labels";
import { zoneLabelForRole } from "@/lib/game-zones";
import { producerProductionCapacity } from "@/lib/economy";
import type {
  AnyRoleState,
  ConsumerRoundState,
  GovernmentRoundState,
  IntermediaryRoundState,
  ProducerRoundState,
} from "@/lib/role-state";

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
        objective: `Cần ${target} thùng để nhận hiệu ích (điểm khách hàng).`,
        action: done
          ? "Bạn có thể mua thêm hoặc chờ chuyển giai đoạn."
          : marketListingCount === 0
            ? "Chờ nhà cung cấp/đại lý niêm yết — quầy sẽ hiện bên dưới khi có hàng."
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
          "Giai đoạn «Ra quyết định» — bạn chờ nhà cung cấp. Khi «Chợ mở», vào Quầy chợ để mua.",
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
    const cap = ps ? producerProductionCapacity(ps) : 0;

    if (phase === "DECISION") {
      return {
        ...base,
        title: "Sản xuất thanh long",
        objective: `Sức sản xuất vòng này: ${cap} thùng. Ví quyết định bạn có làm đủ mức đó không.`,
        action:
          produced > 0
            ? "Đã sản xuất — có thể làm thêm nếu còn sức sản xuất và còn tiền."
            : "Chọn số thùng sản xuất bên dưới. 15 giây đầu có thể bị khóa nếu cơ quan quản lý ban hành chính sách.",
        progress: cap > 0 ? { current: produced, target: cap, unit: "thùng" } : undefined,
        status: produced >= cap && cap > 0 ? "done" : "active",
      };
    }
    if (phase === "MARKET_OPEN") {
      return {
        ...base,
        title: "Đưa hàng ra chợ",
        objective: "Bán lẻ cho khách hàng hoặc bán sỉ cho đại lý.",
        action: "Chọn số thùng trong kho, rồi đưa ra chợ bán lẻ hoặc tạo đề nghị bán sỉ.",
        progress: produced > 0 ? { current: produced, target: produced, unit: "đã làm" } : undefined,
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
        title: "Mua sỉ rồi bán lẻ",
        objective: "Mua từ nhà cung cấp, bán lại cho khách hàng và giữ chênh lệch.",
        action: "Nhận đề nghị bán sỉ, thương lượng nếu cần, rồi niêm yết bán lẻ.",
        status: "active",
      };
    }
    if (phase === "DECISION") {
      return {
        ...base,
        title: "Chuẩn bị phân phối",
        objective: "Chờ nhà cung cấp hoàn thành sản xuất.",
        action: "Khi chợ mở, vào Trung tâm phân phối để mua buôn và bán lẻ.",
        status: "waiting",
      };
    }
    return {
      ...base,
        title: "Đại lý thị trường",
        objective: "Mua từ nhà cung cấp, bán cho khách hàng.",
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
        title: used ? "Đã chọn chính sách" : "Chọn công cụ quản lý",
        objective: "Xem vấn đề thị trường, chọn công cụ, rồi theo dõi tác động.",
        action: used
          ? "Chờ chợ mở hoặc chuyển giai đoạn."
          : "Chọn chính sách bên dưới (hoặc «Không can thiệp»).",
        status: used ? "done" : "active",
      };
    }
    if (phase === "MARKET_OPEN" && round >= 2 && !used) {
      return {
        ...base,
        title: "Xúc tiến xuất khẩu",
        objective: "15 giây đầu chợ mở — mua ~25% cung bán lẻ.",
        action: "Kích hoạt xuất khẩu tại bảng điều khiển hoặc chờ hết cửa sổ.",
        status: "active",
      };
    }
    if (phase === "MARKET_OPEN" && used) {
      return {
        ...base,
        title: "Đã dùng chính sách vòng này",
        objective: "Theo dõi thị trường & ngân sách.",
        action: "Xem Tháp quan sát hoặc chờ chuyển giai đoạn.",
        status: "done",
      };
    }
    return {
      ...base,
      title: round < 2 ? "Quan sát vòng 1" : "Quản lý thị trường",
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
