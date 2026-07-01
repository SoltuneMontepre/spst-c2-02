"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Channel, Realtime } from "appwrite";
import { apiFetch } from "./use-api";
import { useAppwriteSession } from "./use-appwrite-session";
import type { SessionSnapshot } from "@/lib/session-service";
import type { GameEvent, StreamSnapshotPayload } from "@/lib/events";
import { appwriteConfig } from "@/lib/appwrite-config";
import {
  getAppwriteBrowserClient,
  isAppwriteRealtimeEnabled,
} from "@/lib/appwrite-client";
import {
  applySessionGameEvent,
  applySessionSnapshot,
  parseSessionSignalRow,
} from "@/lib/session-stream-utils";

export type SessionStreamState = "connecting" | "connected" | "disconnected";

/** Appwrite Realtime or SSE fallback + heartbeat for presence (FR-GAME-03). */
export function useSessionStream(
  sessionId: string,
  options?: { enabled?: boolean; onEvent?: (event: GameEvent) => void },
): SessionStreamState {
  const enabled = options?.enabled ?? true;
  const useAppwrite = isAppwriteRealtimeEnabled();
  const appwriteReady = useAppwriteSession();
  const queryClient = useQueryClient();
  const [streamState, setStreamState] = useState<SessionStreamState>("connecting");
  const wasDisconnected = useRef(false);
  const onEventRef = useRef(options?.onEvent);
  onEventRef.current = options?.onEvent;

  useEffect(() => {
    if (!enabled) return;
    if (useAppwrite && !appwriteReady) return;

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

    const heartbeat = () => {
      void apiFetch(`/api/sessions/${sessionId}/heartbeat`, { method: "POST" }).catch(
        () => {},
      );
    };
    heartbeat();
    const hb = setInterval(heartbeat, 10_000);

    if (useAppwrite) {
      let closed = false;
      const client = getAppwriteBrowserClient();
      const realtime = new Realtime(client);
      let subscription: { unsubscribe: () => Promise<void> } | null = null;

      const channel = Channel.tablesdb(appwriteConfig.databaseId)
        .table(appwriteConfig.sessionSignalsTableId)
        .row(sessionId)
        .update();

      void realtime
        .subscribe(channel, (response) => {
          if (closed) return;
          if (!response.events.some((e) => e.includes(".update"))) return;

          const event = parseSessionSignalRow(
            response.payload as Record<string, unknown>,
          );
          if (!event || event.sessionId !== sessionId) return;

          onEventRef.current?.(event);
          applySessionGameEvent(queryClient, queryKey, event);
        })
        .then((sub) => {
          if (closed) {
            void sub.unsubscribe();
            return;
          }
          subscription = sub;
          if (wasDisconnected.current) {
            void queryClient.refetchQueries({ queryKey });
          }
          wasDisconnected.current = false;
          setStreamState("connected");
        })
        .catch(() => {
          wasDisconnected.current = true;
          setStreamState("disconnected");
        });

      return () => {
        closed = true;
        clearInterval(hb);
        void subscription?.unsubscribe();
        setStreamState("connecting");
      };
    }

    const source = new EventSource(`/api/sessions/${sessionId}/stream`);

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
        onEventRef.current?.(event);
        applySessionGameEvent(queryClient, queryKey, event);
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

    return () => {
      clearInterval(hb);
      source.close();
      setStreamState("connecting");
    };
  }, [sessionId, queryClient, enabled, useAppwrite, appwriteReady]);

  return streamState;
}
