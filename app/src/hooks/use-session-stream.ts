"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./use-api";
import type { SessionSnapshot } from "@/lib/session-service";
import type { GameEvent, StreamSnapshotPayload } from "@/lib/events";
import type { Presence, Role } from "@/generated/prisma/enums";

export type SessionStreamState = "connecting" | "connected" | "disconnected";

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

function patchSnapshot(
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

function applySnapshot(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly ["session", string],
  payload: StreamSnapshotPayload,
): void {
  const cached = queryClient.getQueryData<SessionSnapshot>(queryKey);
  if (cached && payload.stateVersion <= cached.stateVersion) return;
  queryClient.setQueryData(queryKey, payload.snapshot);
}

/** SSE stream + heartbeat for presence / bot takeover (FR-GAME-03). */
export function useSessionStream(
  sessionId: string,
  options?: { enabled?: boolean; onEvent?: (event: GameEvent) => void },
): SessionStreamState {
  const enabled = options?.enabled ?? true;
  const queryClient = useQueryClient();
  const [streamState, setStreamState] = useState<SessionStreamState>("connecting");
  const wasDisconnected = useRef(false);
  const onEventRef = useRef(options?.onEvent);
  onEventRef.current = options?.onEvent;

  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource(`/api/sessions/${sessionId}/stream`);
    const queryKey = ["session", sessionId] as const;

    const onSnapshot = (e: Event) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data) as StreamSnapshotPayload;
        applySnapshot(queryClient, queryKey, payload);
      } catch {
        /* malformed payload */
      }
    };

    const onUpdate = (e: Event) => {
      try {
        const event = JSON.parse((e as MessageEvent).data) as GameEvent;
        onEventRef.current?.(event);
        if (LIFECYCLE_EVENTS.has(event.type) || ROSTER_REFETCH_EVENTS.has(event.type)) {
          void queryClient.refetchQueries({ queryKey });
          return;
        }
        if (event.type === "participant:role_set") {
          const patched = patchSnapshot(
            queryClient.getQueryData<SessionSnapshot>(queryKey),
            event,
          );
          if (patched) {
            queryClient.setQueryData(queryKey, patched);
          }
          void queryClient.refetchQueries({ queryKey });
          return;
        }
        const patched = patchSnapshot(
          queryClient.getQueryData<SessionSnapshot>(queryKey),
          event,
        );
        if (patched) {
          queryClient.setQueryData(queryKey, patched);
        }
      } catch {
        /* malformed payload */
      }
    };

    source.addEventListener("snapshot", onSnapshot);
    source.addEventListener("update", onUpdate);
    source.addEventListener("open", () => {
      if (wasDisconnected.current) {
        void queryClient.refetchQueries({ queryKey });
      }
      wasDisconnected.current = false;
      setStreamState("connected");
    });
    source.addEventListener("error", () => {
      wasDisconnected.current = true;
      setStreamState("disconnected");
    });

    const heartbeat = () => {
      void apiFetch(`/api/sessions/${sessionId}/heartbeat`, { method: "POST" }).catch(
        () => {},
      );
    };
    heartbeat();
    const hb = setInterval(heartbeat, 10_000);

    return () => {
      clearInterval(hb);
      source.close();
      setStreamState("connecting");
    };
  }, [sessionId, queryClient, enabled]);

  return streamState;
}
