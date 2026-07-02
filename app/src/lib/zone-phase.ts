import type { Role } from "@/generated/prisma/enums";
import { PHASE_LABELS } from "@/lib/labels";
import { type GameScreen, GAME_ZONES, zoneLabelForRole } from "@/lib/game-zones";

/** Khu người chơi nên vào trong giai đoạn hiện tại (null = chờ / xem bản đồ). */
export function getTaskZoneForPhase(
  role: Role | null,
  phase: string | null,
  round: number,
): GameScreen | null {
  if (!role || !phase) return null;
  if (phase === "MARKET_OPEN") {
    if (role === "CONSUMER") return "market";
    if (role === "PRODUCER" || role === "INTERMEDIARY" || role === "GOVERNMENT") return "task";
    return "map";
  }
  if (phase === "DECISION") {
    if (role === "PRODUCER") return "task";
    if (role === "GOVERNMENT" && round >= 2) return "task";
    return null;
  }
  if (phase === "EVENT" || phase === "RECAP") return "map";
  return null;
}

export function zoneScreenForRole(role: Role): GameScreen {
  if (role === "CONSUMER") return "market";
  if (role === "PRODUCER" || role === "INTERMEDIARY" || role === "GOVERNMENT") return "task";
  return "map";
}

export function isOnTaskZone(
  activeZone: GameScreen,
  role: Role | null,
  phase: string | null,
  round: number,
): boolean {
  const task = getTaskZoneForPhase(role, phase, round);
  if (!task) return activeZone === "map";
  return activeZone === task;
}

export interface ZonePanelCopy {
  title: string;
  description: string;
}

/** Tiêu đề cột giữa — luôn khớp giai đoạn + khu đang xem. */
export function getZonePanelCopy(params: {
  activeZone: GameScreen;
  role: Role | null;
  phase: string | null;
  round: number;
}): ZonePanelCopy {
  const { activeZone, role, phase, round } = params;
  const phaseLabel = phase ? PHASE_LABELS[phase] : "Đang chờ";
  const zoneDef = GAME_ZONES.find(
    (z) =>
      z.screen === activeZone &&
      (activeZone === "map" || activeZone === "observatory"
        ? z.role === "ALL"
        : z.role === role),
  );
  const zoneName =
    zoneDef?.label ??
    (activeZone === "market" ? "Quầy chợ" : activeZone === "task" ? zoneLabelForRole(role!) : "Bản đồ");

  if (activeZone === "market" && role === "CONSUMER") {
    if (phase === "MARKET_OPEN") {
      return {
        title: zoneName,
        description: `${phaseLabel} · Mua hàng hoặc gửi đề nghị giá`,
      };
    }
    return {
      title: zoneName,
      description: `${phaseLabel} · Chợ chưa mở — khách hàng chờ nhà cung cấp`,
    };
  }

  if (activeZone === "task" && role) {
    if (phase === "DECISION") {
      const hasWork =
        role === "PRODUCER" ||
        (role === "GOVERNMENT" && round >= 2);
      return {
        title: zoneLabelForRole(role),
        description: hasWork
          ? `${phaseLabel} · Hoàn thành nhiệm vụ của bạn`
          : `${phaseLabel} · Chưa có việc tại khu này`,
      };
    }
    if (phase === "MARKET_OPEN") {
      return {
        title: zoneLabelForRole(role),
        description: `${phaseLabel} · Niêm yết & giao dịch`,
      };
    }
    return {
      title: zoneLabelForRole(role),
      description: phase ? `${phaseLabel} · Chờ giai đoạn tiếp theo` : "Chờ giai đoạn tiếp theo",
    };
  }

  if (activeZone === "map") {
    return {
      title: "Bản đồ phiên chợ",
      description: phase ? `${phaseLabel} · Toàn cảnh & điều hướng` : "Toàn cảnh phiên chợ",
    };
  }

  if (activeZone === "observatory") {
    return {
      title: "Tháp quan sát",
      description: phase ? `${phaseLabel} · Giá trị vs giá cả` : "Biểu đồ giá trị vs giá",
    };
  }

  return { title: zoneName, description: phaseLabel };
}

export function getMapPhaseHint(params: {
  status: string;
  phase: string | null;
  role: Role | null;
  round: number;
}): { title: string; body: string } | null {
  const { status, phase, role, round } = params;

  if (status === "INTRO") {
    return {
      title: "Làm quen bản đồ",
      body: role
        ? `Khu nhiệm vụ của bạn là ${zoneLabelForRole(role)}. Chờ giai đoạn phù hợp rồi chọn khu ở cột trái.`
        : "Chọn khu ở cột trái khi đến lúc.",
    };
  }

  if (phase === "EVENT") {
    return {
      title: "Đang công bố biến cố",
      body: "Đọc timer & hướng dẫn bên phải — chờ «Ra quyết định».",
    };
  }

  if (phase === "DECISION" && role) {
    const task = getTaskZoneForPhase(role, phase, round);
    if (!task) {
      return {
        title: "Ra quyết định — bạn chờ",
        body: "Nhà cung cấp và cơ quan quản lý đang hành động. Khi «Chợ mở», vào Quầy chợ để mua đủ nhu cầu.",
      };
    }
    return {
      title: "Ra quyết định",
      body: `Vào ${zoneLabelForRole(role)} ở cột trái để hoàn thành nhiệm vụ.`,
    };
  }

  if (phase === "MARKET_OPEN" && role) {
    const dest = role === "CONSUMER" ? "Quầy chợ" : zoneLabelForRole(role);
    return {
      title: "Chợ đã mở",
      body: `Vào ${dest} để mua bán.`,
    };
  }

  return null;
}
