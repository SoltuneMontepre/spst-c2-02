import type { Role } from "@/generated/prisma/enums";
import type { SessionSnapshot } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { compositionTarget, MIN_PLAYERS, START_MIN_HUMANS } from "@/lib/scenario";

function lobbyMinHumans(autoHost: boolean): number {
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
  roleDistribution: RoleDistribution[];
  onlineCount: number;
  readyCount: number;
  humanCount: number;
}

const ROLE_ORDER: Role[] = ["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"];

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
  const roleCounts = countRoles(snapshot.participants);

  const target =
    humanCount >= MIN_PLAYERS
      ? compositionTarget(humanCount)
      : { PRODUCER: 1, CONSUMER: 1, INTERMEDIARY: 1, GOVERNMENT: 1 };

  const checklist: ChecklistItem[] = [
    {
      id: "min-humans",
      label: `Tối thiểu ${minHumans} người`,
      done: humanCount >= minHumans,
    },
    {
      id: "has-producer",
      label: "Có người sản xuất",
      done: snapshot.autoAssignRoles
        ? humanCount >= MIN_PLAYERS || roleCounts.PRODUCER > 0
        : roleCounts.PRODUCER > 0,
    },
    {
      id: "has-consumer",
      label: "Có người tiêu dùng",
      done: snapshot.autoAssignRoles
        ? humanCount >= MIN_PLAYERS || roleCounts.CONSUMER > 0
        : roleCounts.CONSUMER > 0,
    },
    {
      id: "has-intermediary",
      label: "Có trung gian",
      done: snapshot.autoAssignRoles
        ? humanCount >= MIN_PLAYERS || roleCounts.INTERMEDIARY > 0
        : roleCounts.INTERMEDIARY > 0,
    },
    {
      id: "has-government",
      label: "Có nhà nước",
      done: snapshot.autoAssignRoles
        ? humanCount >= MIN_PLAYERS || roleCounts.GOVERNMENT > 0
        : roleCounts.GOVERNMENT > 0,
    },
    {
      id: "all-ready",
      label: allReady ? "Tất cả đã sẵn sàng" : "Chờ mọi người bấm sẵn sàng",
      done: allReady,
    },
  ];

  const completedCount = checklist.filter((c) => c.done).length;
  const manualMode =
    !snapshot.autoAssignRoles ||
    snapshot.participants.some((p) => p.role) ||
    snapshot.participants.some((p) => p.isBot);
  const manualComplete =
    !manualMode ||
    (humans.every((p) => p.role) &&
      snapshot.participants.filter((p) => p.isBot).every((p) => p.role));

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
    roleDistribution,
    onlineCount,
    readyCount,
    humanCount,
  };
}
