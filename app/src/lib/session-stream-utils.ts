import type { QueryClient } from "@tanstack/react-query";
import type { SessionSnapshot } from "./session-service";
import type { GameEvent, StreamSnapshotPayload } from "./events";
import type { ControlMode, Presence, Role } from "@/generated/prisma/enums";

export const SESSION_LIFECYCLE_EVENTS = new Set([
  "session:started",
  "session:ended",
  "session:debrief",
]);

export const SESSION_SNAPSHOT_REFETCH_EVENTS = new Set([
  "participant:joined",
  "participant:left",
  "participant:bot_added",
  "participant:bot_removed",
  "participant:role_set",
  "round:phase_changed",
]);

const SESSION_DELTA_PATCH_EVENTS = new Set([
  "participant:ready",
  "participant:presence",
  "participant:phase_ready",
  "bot:control_changed",
  "session:paused",
  "session:resumed",
  "session:extended",
  "session:auto_host",
  "session:lobby_solo",
]);

function parseEventData(row: Record<string, unknown>): unknown {
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

  return data;
}

function parseSessionEventRowBase(
  row: Record<string, unknown>,
  sessionId: string,
): GameEvent | null {
  const type = String(row.type ?? "");
  const stateVersion = Number(row.stateVersion ?? 0);
  if (!sessionId || !type || !Number.isFinite(stateVersion)) return null;

  const data = parseEventData(row);
  return { sessionId, type, stateVersion, data };
}

export function parseSessionSignalRow(row: Record<string, unknown>): GameEvent | null {
  return parseSessionEventRowBase(row, String(row.$id ?? ""));
}

export function parseSessionEventRow(row: Record<string, unknown>): GameEvent | null {
  return parseSessionEventRowBase(row, String(row.sessionId ?? ""));
}

export function patchSessionSnapshot(
  old: SessionSnapshot | undefined,
  event: GameEvent,
): SessionSnapshot | undefined {
  if (!old) return undefined;
  if (event.stateVersion < old.stateVersion) return old;

  if (event.type === "participant:ready" && event.data) {
    const { participantId, ready } = event.data as {
      participantId?: string;
      ready: boolean;
    };
    if (!participantId) return undefined;
    return {
      ...old,
      participants: old.participants.map((p) =>
        p.id === participantId ? { ...p, ready } : p,
      ),
    };
  }

  if (event.type === "participant:presence" && event.data) {
    const { participantId, presence, controlMode, lastSeenAt } = event.data as {
      participantId?: string;
      presence: Presence;
      controlMode?: ControlMode;
      lastSeenAt?: string | null;
    };
    if (!participantId) return undefined;
    return {
      ...old,
      participants: old.participants.map((p) =>
        p.id === participantId
          ? {
              ...p,
              presence,
              controlMode: controlMode ?? p.controlMode,
              lastSeenAt:
                lastSeenAt === undefined ? p.lastSeenAt : lastSeenAt,
            }
          : p,
      ),
    };
  }

  if (event.type === "participant:phase_ready" && event.data) {
    const { participantId, phaseReady } = event.data as {
      participantId?: string;
      phaseReady: boolean;
    };
    if (!participantId) return undefined;
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

  if (event.type === "bot:control_changed" && event.data) {
    const { participantId, controlMode } = event.data as {
      participantId?: string;
      controlMode?: ControlMode;
    };
    if (!participantId || !controlMode) return undefined;
    return {
      ...old,
      participants: old.participants.map((p) =>
        p.id === participantId ? { ...p, controlMode } : p,
      ),
    };
  }

  if (event.type === "round:phase_changed" && event.data) {
    const { phase, phaseEndsAt, paused, phaseExtensions } = event.data as {
      phase?: string | null;
      phaseEndsAt?: string | null;
      paused?: boolean;
      phaseExtensions?: number;
    };
    if (phase === undefined) return undefined;
    return {
      ...old,
      phase,
      phaseEndsAt: phaseEndsAt === undefined ? old.phaseEndsAt : phaseEndsAt,
      paused: paused ?? old.paused,
      phaseExtensions: phaseExtensions ?? old.phaseExtensions,
    };
  }

  if (
    (event.type === "session:paused" ||
      event.type === "session:resumed" ||
      event.type === "session:extended") &&
    event.data
  ) {
    const { paused, phaseEndsAt, phaseExtensions } = event.data as {
      paused?: boolean;
      phaseEndsAt?: string | null;
      phaseExtensions?: number;
    };
    return {
      ...old,
      paused: paused ?? old.paused,
      phaseEndsAt: phaseEndsAt === undefined ? old.phaseEndsAt : phaseEndsAt,
      phaseExtensions: phaseExtensions ?? old.phaseExtensions,
    };
  }

  if (event.type === "session:auto_host" && event.data) {
    const { autoHost } = event.data as { autoHost?: boolean };
    if (autoHost === undefined) return undefined;
    return { ...old, autoHost };
  }

  if (event.type === "session:lobby_solo" && event.data) {
    const { lobbySoloSince, lobbySoloExtendUsed } = event.data as {
      lobbySoloSince?: string | null;
      lobbySoloExtendUsed?: boolean;
    };
    return {
      ...old,
      lobbySoloSince:
        lobbySoloSince === undefined ? old.lobbySoloSince : lobbySoloSince,
      lobbySoloExtendUsed:
        lobbySoloExtendUsed === undefined
          ? old.lobbySoloExtendUsed
          : lobbySoloExtendUsed,
    };
  }

  return undefined;
}

export function applySessionSnapshot(
  queryClient: QueryClient,
  queryKey: readonly ["session", string],
  payload: StreamSnapshotPayload,
): void {
  const cached = queryClient.getQueryData<SessionSnapshot>(queryKey);
  // Equal versions still apply: delta patches (e.g. phase_ready) bump
  // stateVersion without refreshing lastSeenAt/presence, and the follow-up
  // SSE snapshot carries the same version with fresh derived fields.
  if (cached && payload.stateVersion < cached.stateVersion) return;
  queryClient.setQueryData(queryKey, payload.snapshot);
}

export function applySessionGameEvent(
  queryClient: QueryClient,
  queryKey: readonly ["session", string],
  event: GameEvent,
): void {
  // Lifecycle events may navigate the client (lobby → game → debrief).
  if (SESSION_LIFECYCLE_EVENTS.has(event.type)) {
    void queryClient.refetchQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: [...queryKey, "result"] });
    return;
  }

  // Prefer live-room SSE snapshots over per-client HTTP refetches (TFT-style).
  // Delta events patch optimistically; everything else waits for the stream
  // snapshot that was pre-calculated into Redis/memory on the server.
  if (SESSION_DELTA_PATCH_EVENTS.has(event.type)) {
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
}
