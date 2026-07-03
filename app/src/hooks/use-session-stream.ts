"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./use-api";
import type { SessionSnapshot } from "@/lib/session-service";
import type { GameEvent, StreamSnapshotPayload } from "@/lib/events";
import {
  applySessionGameEvent,
  applySessionSnapshot,
} from "@/lib/session-stream-utils";
import { HEARTBEAT_INTERVAL_SEC } from "@/lib/scenario";

export type SessionStreamState = "connecting" | "connected" | "disconnected";

const HEARTBEAT_MS = HEARTBEAT_INTERVAL_SEC * 1000;

/** SSE for game events + heartbeat for presence (lastSeenAt). */
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

    const queryKey = ["session", sessionId] as const;

    const loadInitialSnapshot = () => {
      void apiFetch<SessionSnapshot>(`/api/sessions/${sessionId}`)
        .then((snapshot) => {
          applySessionSnapshot(queryClient, queryKey, {
            stateVersion: snapshot.stateVersion,
            snapshot,
          });
        })
        .catch(() => {});
    };

    loadInitialSnapshot();

    // Presence = heartbeat only (not SSE connect/abort). Keep self's cached
    // lastSeenAt/presence fresh so UI never ages a frozen snapshot timestamp.
    const sendHeartbeat = () => {
      void apiFetch(`/api/sessions/${sessionId}/heartbeat`, { method: "POST" })
        .then(() => {
          const now = new Date().toISOString();
          queryClient.setQueryData<SessionSnapshot>(queryKey, (old) => {
            if (!old) return old;
            return {
              ...old,
              participants: old.participants.map((p) =>
                p.isSelf
                  ? { ...p, lastSeenAt: now, presence: "ONLINE" }
                  : p,
              ),
            };
          });
        })
        .catch(() => {});
    };
    sendHeartbeat();
    const hb = setInterval(sendHeartbeat, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", onVisible);

    let closed = false;
    let source: EventSource | null = null;
    let lastEventVersion =
      queryClient.getQueryData<SessionSnapshot>(queryKey)?.stateVersion ?? 0;

    const applyEvent = (event: GameEvent) => {
      const cached = queryClient.getQueryData<SessionSnapshot>(queryKey);
      const seenVersion = Math.max(lastEventVersion, cached?.stateVersion ?? 0);
      if (event.stateVersion <= seenVersion) return;

      lastEventVersion = event.stateVersion;
      onEventRef.current?.(event);
      applySessionGameEvent(queryClient, queryKey, event);
    };

    const onSnapshot = (e: Event) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data) as StreamSnapshotPayload;
        applySessionSnapshot(queryClient, queryKey, payload);
      } catch {
        /* malformed payload */
      }
    };

    const onUpdate = (e: Event) => {
      try {
        const event = JSON.parse((e as MessageEvent).data) as GameEvent;
        applyEvent(event);
      } catch {
        /* malformed payload */
      }
    };

    const source_ = new EventSource(`/api/sessions/${sessionId}/stream`);
    source_.addEventListener("snapshot", onSnapshot);
    source_.addEventListener("update", onUpdate);
    source_.addEventListener("open", () => {
      if (closed) return;
      if (wasDisconnected.current) {
        sendHeartbeat();
        void queryClient.refetchQueries({ queryKey });
      }
      wasDisconnected.current = false;
      setStreamState("connected");
    });
    source_.addEventListener("error", () => {
      if (!closed) {
        wasDisconnected.current = true;
        setStreamState("disconnected");
      }
    });
    source = source_;

    return () => {
      closed = true;
      clearInterval(hb);
      document.removeEventListener("visibilitychange", onVisible);
      if (source) {
        source.close();
        source = null;
      }
      setStreamState("connecting");
    };
  }, [sessionId, queryClient, enabled]);

  return streamState;
}
