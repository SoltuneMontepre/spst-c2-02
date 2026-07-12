"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./use-api";
import { getSocket } from "@/lib/realtime";
import type { SessionSnapshot } from "@/lib/session-service";
import type { GameEvent, StreamSnapshotPayload } from "@/lib/events";
import {
  applySessionGameEvent,
  applySessionSnapshot,
} from "@/lib/session-stream-utils";
import { HEARTBEAT_INTERVAL_SEC } from "@/lib/scenario";

export type SessionStreamState = "connecting" | "connected" | "disconnected";

const HEARTBEAT_MS = HEARTBEAT_INTERVAL_SEC * 1000;

interface SnapshotEvent extends StreamSnapshotPayload {
  sessionId: string;
}

/** Socket.IO stream for game events + snapshots, with a periodic presence heartbeat. */
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

    const socket = getSocket();
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

    // Presence = heartbeat only. Emit over the socket and optimistically keep
    // self's cached lastSeenAt/presence fresh so the UI never ages a stale value.
    const sendHeartbeat = () => {
      socket.emit("heartbeat", { sessionId });
      const now = new Date().toISOString();
      queryClient.setQueryData<SessionSnapshot>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          participants: old.participants.map((p) =>
            p.isSelf ? { ...p, lastSeenAt: now, presence: "ONLINE" } : p,
          ),
        };
      });
    };

    const hb = setInterval(sendHeartbeat, HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", onVisible);

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

    const onSnapshot = (payload: SnapshotEvent) => {
      if (payload.sessionId !== sessionId) return;
      applySessionSnapshot(queryClient, queryKey, {
        stateVersion: payload.stateVersion,
        snapshot: payload.snapshot,
      });
    };

    const onUpdate = (event: GameEvent) => {
      if (event.sessionId !== sessionId) return;
      applyEvent(event);
    };

    // Re-subscribe on every (re)connect — a reconnect is a fresh server-side
    // socket that has no memory of the prior subscription.
    const subscribe = () => socket.emit("session:subscribe", { sessionId });
    const onConnect = () => {
      subscribe();
      sendHeartbeat();
      if (wasDisconnected.current) {
        void queryClient.refetchQueries({ queryKey });
      }
      wasDisconnected.current = false;
      setStreamState("connected");
    };
    const onDisconnect = () => {
      wasDisconnected.current = true;
      setStreamState("disconnected");
    };

    socket.on("snapshot", onSnapshot);
    socket.on("update", onUpdate);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_failed", onDisconnect);

    if (socket.connected) onConnect();
    else setStreamState("connecting");

    sendHeartbeat();

    return () => {
      clearInterval(hb);
      document.removeEventListener("visibilitychange", onVisible);
      socket.emit("session:unsubscribe", { sessionId });
      socket.off("snapshot", onSnapshot);
      socket.off("update", onUpdate);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_failed", onDisconnect);
      setStreamState("connecting");
    };
  }, [sessionId, queryClient, enabled]);

  return streamState;
}
