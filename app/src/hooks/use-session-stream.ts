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
  onAppwriteRealtimeConnectionChange,
} from "@/lib/appwrite-client";
import {
  applySessionGameEvent,
  applySessionSnapshot,
  parseSessionEventRow,
  parseSessionSignalRow,
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
    let appwriteSubs: RealtimeSubscription[] = [];
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

    const stopConnectionWatch = onAppwriteRealtimeConnectionChange((state) => {
      if (closed || appwriteSubs.length === 0) return;

      if (state === "open") {
        void queryClient.refetchQueries({ queryKey });
        wasDisconnected.current = false;
        setStreamState("connected");
        teardownSSE();
        return;
      }

      wasDisconnected.current = true;
      setStreamState("disconnected");
      setupSSE();
    });

    const setupAppwrite = async () => {
      if (
        closed ||
        appwriteSubs.length > 0 ||
        !useAppwrite ||
        !appwriteReady
      ) {
        return;
      }
      const pendingSubs: RealtimeSubscription[] = [];
      try {
        const realtime = getAppwriteRealtimeClient();
        const eventsChannel = Channel.tablesdb(appwriteConfig.databaseId)
          .table(appwriteConfig.sessionEventsTableId)
          .row()
          .create();
        const signalChannel = Channel.tablesdb(appwriteConfig.databaseId)
          .table(appwriteConfig.sessionSignalsTableId)
          .row();

        const shouldKeep = () => !closed && !source;

        const track = async (
          promise: Promise<RealtimeSubscription>,
        ): Promise<RealtimeSubscription> => {
          const sub = await promise;
          pendingSubs.push(sub);
          return sub;
        };

        const eventSubPromise = track(
          subscribeWithTimeout(
            realtime.subscribe(eventsChannel, (response) => {
              if (closed) return;

              const event = parseSessionEventRow(
                response.payload as Record<string, unknown>,
              );
              if (!event || event.sessionId !== sessionId) return;

              applyEvent(event);
            }, [Query.equal("sessionId", sessionId)]),
            shouldKeep,
          ),
        );

        // The per-session signal is a second delivery path. It covers the first
        // upsert as well as later updates; stateVersion de-duplicates it against
        // the durable session_events row.
        const signalSubPromise = track(
          subscribeWithTimeout(
            realtime.subscribe(signalChannel, (response) => {
              if (closed) return;

              const event = parseSessionSignalRow(
                response.payload as Record<string, unknown>,
              );
              if (!event || event.sessionId !== sessionId) return;

              applyEvent(event);
            }, [Query.equal("$id", sessionId)]),
            shouldKeep,
          ),
        );

        const subs = await Promise.all([eventSubPromise, signalSubPromise]);

        if (closed) {
          subs.forEach((sub) => void sub.unsubscribe());
          return;
        }

        appwriteSubs = subs;

        // Close the snapshot-before-subscribe race and recover anything missed
        // while Appwrite was reconnecting.
        await queryClient.refetchQueries({ queryKey });
        if (closed) {
          subs.forEach((sub) => void sub.unsubscribe());
          appwriteSubs = [];
          return;
        }
        wasDisconnected.current = false;
        setStreamState("connected");

        // Appwrite is active — drop SSE to avoid duplicate updates
        teardownSSE();
      } catch {
        pendingSubs.forEach((sub) => void sub.unsubscribe());
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
      stopConnectionWatch();
      teardownSSE();
      appwriteSubs.forEach((sub) => void sub.unsubscribe());
      appwriteSubs = [];
      setStreamState("connecting");
    };
  }, [sessionId, queryClient, enabled, useAppwrite, appwriteReady]);

  return streamState;
}
