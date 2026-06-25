import type { Role } from "@/generated/prisma/enums";
import { PHASE_LABELS } from "@/lib/labels";
import { getMapPhaseHint } from "@/lib/zone-phase";
import { getRoleQuest, type RoleQuest } from "@/lib/role-quest";
import type { ParticipantView, SessionSnapshot } from "@/lib/session-service";

export const ROUND_PHASES = [
  "EVENT",
  "DECISION",
  "MARKET_OPEN",
  "SETTLEMENT",
  "RECAP",
] as const;

export type RoundPhaseKey = (typeof ROUND_PHASES)[number];
export type PhaseStepState = "done" | "current" | "upcoming";
export type DutyStatus = RoleQuest["status"];

const ROLE_ORDER: Role[] = [
  "PRODUCER",
  "CONSUMER",
  "INTERMEDIARY",
  "GOVERNMENT",
];

export function canFastForwardPhase(
  status: string,
  phase: string | null,
): boolean {
  if (status === "INTRO" || status === "DEBRIEF") return false;
  return phase === "DECISION" || phase === "MARKET_OPEN" || phase === "RECAP";
}

export function isInGameTimelineStatus(status: string): boolean {
  return status === "INTRO" || /^ROUND_\d+$/.test(status);
}

export interface PhaseStep {
  key: RoundPhaseKey;
  label: string;
  state: PhaseStepState;
}

export function getPhaseSteps(currentPhase: string | null): PhaseStep[] {
  const idx =
    currentPhase != null
      ? ROUND_PHASES.indexOf(currentPhase as RoundPhaseKey)
      : -1;

  return ROUND_PHASES.map((key, i) => ({
    key,
    label: PHASE_LABELS[key] ?? key,
    state:
      idx < 0
        ? ("upcoming" as const)
        : i < idx
          ? ("done" as const)
          : i === idx
            ? ("current" as const)
            : ("upcoming" as const),
  }));
}

export interface RoleSummary {
  role: Role;
  count: number;
  title: string;
  action: string;
  status: DutyStatus;
}

export interface PlayerTimelineEntry {
  participant: ParticipantView;
  title: string;
  action: string;
  status: DutyStatus;
  showPhaseReady: boolean;
}

function questForParticipant(
  snapshot: Pick<
    SessionSnapshot,
    "phase" | "currentRound" | "self" | "market" | "autoHost" | "status"
  >,
  participant: ParticipantView,
): RoleQuest {
  const isSelf = participant.isSelf;
  return getRoleQuest({
    role: participant.role!,
    phase: snapshot.phase,
    round: snapshot.currentRound,
    roleState: isSelf ? (snapshot.self?.roleState ?? null) : null,
    marketListingCount: snapshot.market?.listings.length ?? 0,
  });
}

function resolvePlayerStatus(
  snapshot: Pick<SessionSnapshot, "phase" | "autoHost" | "status">,
  participant: ParticipantView,
  quest: RoleQuest,
): DutyStatus {
  if (
    snapshot.autoHost &&
    !participant.isBot &&
    canFastForwardPhase(snapshot.status, snapshot.phase) &&
    participant.phaseReady
  ) {
    return "done";
  }
  return quest.status;
}

function aggregateRoleStatus(statuses: DutyStatus[]): DutyStatus {
  if (statuses.some((s) => s === "active")) return "active";
  if (statuses.length > 0 && statuses.every((s) => s === "done")) return "done";
  return "waiting";
}

export function buildPlayerEntries(
  snapshot: Pick<
    SessionSnapshot,
    | "phase"
    | "currentRound"
    | "self"
    | "market"
    | "autoHost"
    | "status"
    | "participants"
  >,
): PlayerTimelineEntry[] {
  const withRole = snapshot.participants.filter(
    (p): p is ParticipantView & { role: Role } => p.role != null,
  );

  const roleRank = (role: Role) => ROLE_ORDER.indexOf(role);

  return withRole
    .slice()
    .sort((a, b) => {
      if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
      const dr = roleRank(a.role) - roleRank(b.role);
      if (dr !== 0) return dr;
      return a.displayName.localeCompare(b.displayName, "vi");
    })
    .map((participant) => {
      const quest = questForParticipant(snapshot, participant);
      const status = resolvePlayerStatus(snapshot, participant, quest);
      const showPhaseReady =
        snapshot.autoHost &&
        !participant.isBot &&
        canFastForwardPhase(snapshot.status, snapshot.phase);

      return {
        participant,
        title: quest.title,
        action: quest.action,
        status,
        showPhaseReady,
      };
    });
}

export function buildRoleSummaries(
  snapshot: Pick<
    SessionSnapshot,
    | "phase"
    | "currentRound"
    | "self"
    | "market"
    | "autoHost"
    | "status"
    | "participants"
  >,
): RoleSummary[] {
  const players = buildPlayerEntries(snapshot);
  const byRole = new Map<Role, PlayerTimelineEntry[]>();

  for (const entry of players) {
    const role = entry.participant.role!;
    const list = byRole.get(role) ?? [];
    list.push(entry);
    byRole.set(role, list);
  }

  return ROLE_ORDER.filter((role) => byRole.has(role)).map((role) => {
    const entries = byRole.get(role)!;
    const template = getRoleQuest({
      role,
      phase: snapshot.phase,
      round: snapshot.currentRound,
      roleState: null,
      marketListingCount: snapshot.market?.listings.length ?? 0,
    });

    return {
      role,
      count: entries.length,
      title: template.title,
      action: template.action,
      status: aggregateRoleStatus(entries.map((e) => e.status)),
    };
  });
}

export function getIntroTimelineHint(
  snapshot: Pick<SessionSnapshot, "status" | "phase" | "currentRound" | "self">,
): { title: string; body: string } {
  const hint = getMapPhaseHint({
    status: snapshot.status,
    phase: snapshot.phase,
    role: snapshot.self?.role ?? null,
    round: snapshot.currentRound,
  });
  return (
    hint ?? {
      title: "Giới thiệu phiên",
      body: "Làm quen bản đồ và vai trò — chờ bắt đầu vòng 1.",
    }
  );
}
