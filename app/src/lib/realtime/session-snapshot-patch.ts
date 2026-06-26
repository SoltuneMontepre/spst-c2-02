import type { SessionSnapshot } from "@/lib/session-service";
import type { GameEvent } from "@/lib/events";
import type { Presence, Role } from "@/generated/prisma/enums";

const LIFECYCLE_EVENTS = new Set([
  "session:started",
  "session:ended",
  "session:debrief",
]);

const ROSTER_REFETCH_EVENTS = new Set([
  "participant:joined",
  "participant:left",
  "participant:bot_added",
  "participant:bot_removed",
]);

export function patchSessionSnapshot(
  old: SessionSnapshot | undefined,
  event: GameEvent,
): SessionSnapshot | undefined {
  if (!old) return old;
  if (event.stateVersion < old.stateVersion) return old;

  if (event.type === "participant:ready" && event.data) {
    const { participantId, ready } = event.data as {
      participantId?: string;
      ready: boolean;
    };
    if (!participantId) return old;
    return {
      ...old,
      participants: old.participants.map((p) =>
        p.id === participantId ? { ...p, ready } : p,
      ),
    };
  }

  if (event.type === "participant:presence" && event.data) {
    const { participantId, presence } = event.data as {
      participantId?: string;
      presence: Presence;
    };
    if (!participantId) return old;
    return {
      ...old,
      participants: old.participants.map((p) =>
        p.id === participantId ? { ...p, presence } : p,
      ),
    };
  }

  if (event.type === "participant:phase_ready" && event.data) {
    const { participantId, phaseReady } = event.data as {
      participantId?: string;
      phaseReady: boolean;
    };
    if (!participantId) return old;
    return {
      ...old,
      participants: old.participants.map((p) =>
        p.id === participantId ? { ...p, phaseReady } : p,
      ),
    };
  }

  if (event.type === "participant:role_set" && event.data) {
    const { participantId, role, participantAId, participantBId } = event.data as {
      participantId?: string;
      role?: Role | null;
      participantAId?: string;
      participantBId?: string;
    };
    if (participantId) {
      return {
        ...old,
        participants: old.participants.map((p) =>
          p.id === participantId ? { ...p, role: role ?? null } : p,
        ),
      };
    }
    if (participantAId && participantBId) {
      const a = old.participants.find((p) => p.id === participantAId);
      const b = old.participants.find((p) => p.id === participantBId);
      if (a && b && a.role && b.role) {
        return {
          ...old,
          participants: old.participants.map((p) => {
            if (p.id === participantAId) return { ...p, role: b.role };
            if (p.id === participantBId) return { ...p, role: a.role };
            return p;
          }),
        };
      }
    }
  }

  return old;
}

export function applySessionSnapshot(
  old: SessionSnapshot | undefined,
  snapshot: SessionSnapshot,
  stateVersion: number,
): SessionSnapshot | null {
  if (old && stateVersion <= old.stateVersion) return null;
  return snapshot;
}

export function shouldRefetchOnEvent(event: GameEvent): boolean {
  return LIFECYCLE_EVENTS.has(event.type) || ROSTER_REFETCH_EVENTS.has(event.type);
}

export function isRoleSetEvent(event: GameEvent): boolean {
  return event.type === "participant:role_set";
}
