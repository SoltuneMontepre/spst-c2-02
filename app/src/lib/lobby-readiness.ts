import type { Role } from "@/generated/prisma/enums";
import type { SessionSnapshot } from "@/lib/session-service";
import { ROLE_LABELS } from "@/lib/display-labels";
import { compositionTarget, START_MIN_HUMANS } from "@/lib/scenario";

export function lobbyMinHumans(autoHost: boolean): number {
  return autoHost ? 1 : START_MIN_HUMANS;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  warning?: boolean;
}

export interface RoleDistribution {
  role: Role;
  label: string;
  filled: number;
  target: number;
}

export interface LobbyReadiness {
  checklist: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  canStart: boolean;
  allReady: boolean;
  manualComplete: boolean;
  roleDistribution: RoleDistribution[];
  onlineCount: number;
  readyCount: number;
  humanCount: number;
}

const ROLE_ORDER: Role[] = ["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"];

const ROLE_CHECKLIST_LABEL: Record<Role, string> = {
  PRODUCER: "Có nhà cung cấp",
  CONSUMER: "Có khách hàng",
  INTERMEDIARY: "Có đại lý",
  GOVERNMENT: "Có cơ quan quản lý",
};

function countRoles(participants: SessionSnapshot["participants"]) {
  const counts: Record<Role, number> = {
    PRODUCER: 0,
    CONSUMER: 0,
    INTERMEDIARY: 0,
    GOVERNMENT: 0,
  };
  for (const p of participants) {
    if (p.role) counts[p.role]++;
  }
  return counts;
}

/** Pre-start lobby readiness for host dashboard checklist. */
export function computeLobbyReadiness(snapshot: SessionSnapshot): LobbyReadiness {
  const humans = snapshot.participants.filter((p) => !p.isBot);
  const humanCount = humans.length;
  const onlineCount = humans.filter((p) => p.presence === "ONLINE").length;
  const readyCount = humans.filter((p) => p.ready).length;
  const allReady = humanCount > 0 && humans.every((p) => p.ready);
  const minHumans = lobbyMinHumans(snapshot.autoHost);
  const roleCounts = countRoles(humans);
  const target = compositionTarget(snapshot.maxPlayers);
  const auto = snapshot.autoAssignRoles;
  const overTarget = ROLE_ORDER.some((role) => roleCounts[role] > target[role]);
  // null = Ngẫu nhiên; bots fill remaining seats. "Have role" is ok unless over cap.
  const compositionOk = humanCount >= minHumans && !overTarget;

  const checklist: ChecklistItem[] = [
    {
      id: "min-humans",
      label: `Tối thiểu ${minHumans} người`,
      done: humanCount >= minHumans,
    },
  ];

  for (const role of ROLE_ORDER) {
    if (target[role] === 0) continue;
    checklist.push({
      id: `has-${role.toLowerCase()}`,
      label: ROLE_CHECKLIST_LABEL[role],
      done: compositionOk,
    });
  }

  checklist.push({
    id: "all-ready",
    label: allReady ? "Tất cả đã sẵn sàng" : "Chờ mọi người bấm sẵn sàng",
    done: allReady,
  });

  const completedCount = checklist.filter((c) => c.done).length;
  const manualComplete = auto || !overTarget;

  const canStart =
    allReady &&
    manualComplete &&
    humanCount >= minHumans &&
    checklist.filter((c) => c.id !== "all-ready").every((c) => c.done);

  const roleDistribution: RoleDistribution[] = ROLE_ORDER.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    filled: roleCounts[role],
    target: target[role],
  }));

  return {
    checklist,
    completedCount,
    totalCount: checklist.length,
    canStart,
    allReady,
    manualComplete,
    roleDistribution,
    onlineCount,
    readyCount,
    humanCount,
  };
}
