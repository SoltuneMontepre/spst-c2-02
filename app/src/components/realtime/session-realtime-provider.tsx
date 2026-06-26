"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import type { GameEvent } from "@/lib/events";
import type { ClientInbound } from "@/lib/realtime/ws-protocol";
import {
  applySessionSnapshot,
  isRoleSetEvent,
  patchSessionSnapshot,
  shouldRefetchOnEvent,
} from "@/lib/realtime/session-snapshot-patch";
import {
  createReconnectingWs,
  realtimeWsUrl,
  type RealtimeState,
} from "@/lib/realtime/ws-client";
import type { SessionSnapshot } from "@/lib/session-service";

export type SessionStreamState = RealtimeState;

interface SessionRealtimeContextValue {
  streamState: SessionStreamState;
  send: (msg: ClientInbound) => boolean;
  sendRaw: (msg: Record<string, unknown>) => boolean;
}

const SessionRealtimeContext = createContext<SessionRealtimeContextValue | null>(
  null,
);

export function SessionRealtimeProvider({
  sessionId,
  enabled = true,
  children,
}: {
  sessionId: string;
  enabled?: boolean;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const { status: authStatus } = useSession();
  const [streamState, setStreamState] = useState<SessionStreamState>("connecting");
  const wsRef = useRef<ReturnType<typeof createReconnectingWs> | null>(null);
  const onEventRef = useRef<((event: GameEvent) => void) | undefined>(undefined);
  const wasDisconnected = useRef(false);
  const wsEnabled = enabled && authStatus === "authenticated";

  const send = useCallback((msg: ClientInbound) => {
    return wsRef.current?.send(JSON.stringify(msg)) ?? false;
  }, []);

  const sendRaw = useCallback((msg: Record<string, unknown>) => {
    return wsRef.current?.send(JSON.stringify(msg)) ?? false;
  }, []);

  useEffect(() => {
    if (!wsEnabled) {
      wsRef.current?.close();
      wsRef.current = null;
      setStreamState("disconnected");
      return;
    }

    const queryKey = ["session", sessionId] as const;
    const url = realtimeWsUrl(`/api/realtime/session/${sessionId}`);

    const ws = createReconnectingWs(url, {
      onStateChange: setStreamState,
      onOpen: () => {
        if (wasDisconnected.current) {
          void queryClient.refetchQueries({ queryKey });
        }
        wasDisconnected.current = false;
      },
      onMessage: (raw) => {
        try {
          const frame = JSON.parse(raw) as {
            op: string;
            event?: GameEvent;
            stateVersion?: number;
            snapshot?: SessionSnapshot;
          };

          if (frame.op === "snapshot" && frame.snapshot && frame.stateVersion != null) {
            const next = applySessionSnapshot(
              queryClient.getQueryData<SessionSnapshot>(queryKey),
              frame.snapshot,
              frame.stateVersion,
            );
            if (next) queryClient.setQueryData(queryKey, next);
            return;
          }

          if (frame.op === "update" && frame.event) {
            const event = frame.event;
            onEventRef.current?.(event);

            if (shouldRefetchOnEvent(event)) {
              void queryClient.refetchQueries({ queryKey });
              return;
            }

            if (isRoleSetEvent(event)) {
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
        } catch {
          /* malformed */
        }
      },
    });

    wsRef.current = ws;

    const hb = setInterval(() => {
      ws.send(JSON.stringify({ op: "heartbeat" }));
    }, 10_000);

    return () => {
      clearInterval(hb);
      ws.close();
      wsRef.current = null;
      setStreamState("connecting");
    };
  }, [sessionId, queryClient, wsEnabled]);

  useEffect(() => {
    if (streamState === "disconnected") wasDisconnected.current = true;
  }, [streamState]);

  const value = useMemo(
    () => ({ streamState, send, sendRaw }),
    [streamState, send, sendRaw],
  );

  return (
    <SessionRealtimeContext.Provider value={value}>
      <SessionEventBridge onEventRef={onEventRef}>{children}</SessionEventBridge>
    </SessionRealtimeContext.Provider>
  );
}

function SessionEventBridge({
  onEventRef,
  children,
}: {
  onEventRef: React.MutableRefObject<((event: GameEvent) => void) | undefined>;
  children: ReactNode;
}) {
  return (
    <SessionEventBridgeContext.Provider value={onEventRef}>
      {children}
    </SessionEventBridgeContext.Provider>
  );
}

const SessionEventBridgeContext =
  createContext<React.MutableRefObject<((event: GameEvent) => void) | undefined> | null>(
    null,
  );

export function useSessionRealtime(): SessionRealtimeContextValue {
  const ctx = useContext(SessionRealtimeContext);
  if (!ctx) {
    throw new Error("useSessionRealtime must be used within SessionRealtimeProvider");
  }
  return ctx;
}

export function useSessionRealtimeOptional(): SessionRealtimeContextValue | null {
  return useContext(SessionRealtimeContext);
}

/** Subscribe to raw GameEvent updates (e.g. lobby role-change toasts). */
export function useSessionRealtimeEvent(handler: ((event: GameEvent) => void) | undefined) {
  const onEventRef = useContext(SessionEventBridgeContext);
  useEffect(() => {
    if (!onEventRef) return;
    onEventRef.current = handler;
    return () => {
      if (onEventRef.current === handler) onEventRef.current = undefined;
    };
  }, [handler, onEventRef]);
}

/** Stream connection state (compat with former useSessionStream). */
export function useSessionStream(
  _sessionId?: string,
  options?: { enabled?: boolean; onEvent?: (event: GameEvent) => void },
): SessionStreamState {
  const ctx = useSessionRealtimeOptional();
  useSessionRealtimeEvent(options?.enabled === false ? undefined : options?.onEvent);
  if (!ctx || options?.enabled === false) return "disconnected";
  return ctx.streamState;
}
