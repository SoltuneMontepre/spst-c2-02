import type { QueryClient } from "@tanstack/react-query";
import type { SessionSnapshot } from "./session-service";
import type { GameEvent, StreamSnapshotPayload } from "./events";
import type { Presence, Role } from "@/generated/prisma/enums";

export const SESSION_LIFECYCLE_EVENTS = new Set([
  "session:started",
  "session:ended",
  "session:debrief",
]);

export const SESSION_ROSTER_REFETCH_EVENTS = new Set([
  "participant:joined",
  "participant:left",
  "participant:bot_added",
  "participant:bot_removed",
]);

const SESSION_DELTA_PATCH_EVENTS = new Set([
  "participant:ready",
  "participant:presence",
  "participant:phase_ready",
]);

export function parseSessionSignalRow(row: Record<string, unknown>): GameEvent | null {
  const sessionId = String(row.$id ?? "");
  const type = String(row.type ?? "");
  const stateVersion = Number(row.stateVersion ?? 0);
  if (!sessionId || !type || !Number.isFinite(stateVersion)) return null;

  let data: unknown;
  const raw = row.data;
  if (raw == null || raw === "") {
    data = undefined;
  } else if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  } else {
    data = raw;
  }

  return { sessionId, type, stateVersion, data };
}

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
  queryClient: QueryClient,
  queryKey: readonly ["session", string],
  payload: StreamSnapshotPayload,
): void {
  const cached = queryClient.getQueryData<SessionSnapshot>(queryKey);
  if (cached && payload.stateVersion <= cached.stateVersion) return;
  queryClient.setQueryData(queryKey, payload.snapshot);
}

export function applySessionGameEvent(
  queryClient: QueryClient,
  queryKey: readonly ["session", string],
  event: GameEvent,
): void {
  if (SESSION_LIFECYCLE_EVENTS.has(event.type) || SESSION_ROSTER_REFETCH_EVENTS.has(event.type)) {
    void queryClient.refetchQueries({ queryKey });
    return;
  }

  if (event.type === "participant:role_set") {
    const patched = patchSessionSnapshot(
      queryClient.getQueryData<SessionSnapshot>(queryKey),
      event,
    );
    if (patched) {
      queryClient.setQueryData(queryKey, {
        ...patched,
        stateVersion: Math.max(patched.stateVersion, event.stateVersion),
      });
    }
    void queryClient.refetchQueries({ queryKey });
    return;
  }

  if (!SESSION_DELTA_PATCH_EVENTS.has(event.type)) {
    void queryClient.refetchQueries({ queryKey });
    return;
  }

  const patched = patchSessionSnapshot(
    queryClient.getQueryData<SessionSnapshot>(queryKey),
    event,
  );
  if (patched) {
    queryClient.setQueryData(queryKey, {
      ...patched,
      stateVersion: Math.max(patched.stateVersion, event.stateVersion),
    });
  }
}
