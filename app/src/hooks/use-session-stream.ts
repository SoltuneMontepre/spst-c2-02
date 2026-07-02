"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Channel, Query } from "appwrite";
import { apiFetch } from "./use-api";
import { useAppwriteSession } from "./use-appwrite-session";
import type { SessionSnapshot } from "@/lib/session-service";
import type { GameEvent, StreamSnapshotPayload } from "@/lib/events";
import { appwriteConfig } from "@/lib/appwrite-config";
import {
  getAppwriteRealtimeClient,
  isAppwriteRealtimeEnabled,
} from "@/lib/appwrite-client";
import {
  applySessionGameEvent,
  applySessionSnapshot,
  parseSessionEventRow,
} from "@/lib/session-stream-utils";

export type SessionStreamState = "connecting" | "connected" | "disconnected";

const APPWRITE_SUBSCRIBE_TIMEOUT_MS = 3_000;

type RealtimeSubscription = { unsubscribe: () => Promise<void> };

function subscribeWithTimeout<T extends RealtimeSubscription>(
  subscribePromise: Promise<T>,
  shouldKeep: () => boolean,
): Promise<T> {
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  subscribePromise
    .then((sub) => {
      if (timedOut || !shouldKeep()) void sub.unsubscribe();
    })
    .catch(() => {});

  return new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(new Error("Appwrite realtime subscribe timed out"));
    }, APPWRITE_SUBSCRIBE_TIMEOUT_MS);

    subscribePromise.then(
      (sub) => {
        if (timedOut) return;
        if (timer) clearTimeout(timer);
        resolve(sub);
      },
      (error) => {
        if (timedOut) return;
        if (timer) clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Appwrite Realtime with SSE fallback + heartbeat for presence (FR-GAME-03). */
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

    let closed = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let source: EventSource | null = null;
    let appwriteSub: { unsubscribe: () => Promise<void> } | null = null;
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

    const setupSSE = () => {
      if (closed || source) return;
      const newSource = new EventSource(`/api/sessions/${sessionId}/stream`);
      newSource.addEventListener("snapshot", onSnapshot);
      newSource.addEventListener("update", onUpdate);
      newSource.addEventListener("open", () => {
        if (closed) return;
        if (wasDisconnected.current) {
          void queryClient.refetchQueries({ queryKey });
        }
        wasDisconnected.current = false;
        setStreamState("connected");
      });
      newSource.addEventListener("error", () => {
        if (!closed) {
          wasDisconnected.current = true;
          setStreamState("disconnected");
        }
      });
      source = newSource;
    };

    const teardownSSE = () => {
      if (source) {
        source.close();
        source = null;
      }
    };

    const setupAppwrite = async () => {
      if (closed || appwriteSub || !useAppwrite || !appwriteReady) return;
      try {
        const realtime = getAppwriteRealtimeClient();
        const channel = Channel.tablesdb(appwriteConfig.databaseId)
          .table(appwriteConfig.sessionEventsTableId)
          .row()
          .create();

        const sub = await subscribeWithTimeout(
          realtime.subscribe(channel, (response) => {
            if (closed) return;
            if (!response.events.some((e) => e.includes(".create"))) return;

            const event = parseSessionEventRow(
              response.payload as Record<string, unknown>,
            );
            if (!event || event.sessionId !== sessionId) return;

            applyEvent(event);
          }, [Query.equal("sessionId", sessionId)]),
          () => !closed && !source,
        );

        if (closed) {
          void sub.unsubscribe();
          return;
        }

        appwriteSub = sub;
        if (wasDisconnected.current) {
          void queryClient.refetchQueries({ queryKey });
        }
        wasDisconnected.current = false;
        setStreamState("connected");

        // Appwrite is active — drop SSE to avoid duplicate updates
        teardownSSE();
      } catch {
        if (!closed) {
          wasDisconnected.current = true;
          setStreamState("disconnected");
          setupSSE();
        }
      }
    };

    if (useAppwrite && appwriteReady) {
      void setupAppwrite();
    } else if (useAppwrite) {
      fallbackTimer = setTimeout(setupSSE, 3000);
    } else {
      setupSSE();
    }

    return () => {
      closed = true;
      clearInterval(hb);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      teardownSSE();
      if (appwriteSub) void appwriteSub.unsubscribe();
      setStreamState("connecting");
    };
  }, [sessionId, queryClient, enabled, useAppwrite, appwriteReady]);

  return streamState;
}
