import { subscribe, type GameEvent } from "@/lib/events";
import { getSnapshot, setPresence } from "@/lib/session-service";
import { isRealtimeSocketOpen, type RealtimeSocket } from "./realtime-socket";
import { serverFrame } from "./ws-protocol";

const SNAPSHOT_DEBOUNCE_MS = 50;
const IMMEDIATE_SNAPSHOT_EVENTS = new Set([
  "session:started",
  "round:phase_changed",
  "session:debrief",
  "session:ended",
]);

export interface SessionConnectionOptions {
  userId: string;
  sessionId: string;
  isHost: boolean;
  socket: RealtimeSocket;
}

/** Attach session realtime push (reuses events.ts subscribe bus). */
export function attachSessionConnection(opts: SessionConnectionOptions): () => void {
  const { userId, sessionId, isHost, socket } = opts;
  let closed = false;
  let lastDeliveredVersion = 0;
  let pendingVersion = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const send = (payload: Parameters<typeof serverFrame>[0]) => {
    if (closed || !isRealtimeSocketOpen(socket)) return;
    socket.send(serverFrame(payload));
  };

  const pushSnapshot = async () => {
    if (closed) return;
    const minVersion = pendingVersion;
    pendingVersion = 0;
    try {
      const snapshot = await getSnapshot(userId, sessionId);
      if (closed) return;
      if (snapshot.stateVersion < minVersion && minVersion > lastDeliveredVersion) {
        pendingVersion = Math.max(pendingVersion, minVersion);
        scheduleSnapshot();
        return;
      }
      if (snapshot.stateVersion <= lastDeliveredVersion) return;
      lastDeliveredVersion = snapshot.stateVersion;
      send({ op: "snapshot", stateVersion: snapshot.stateVersion, snapshot });
    } catch (e) {
      console.error("WS snapshot push failed:", (e as Error).message);
    }
  };

  const scheduleSnapshot = (immediate = false) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (immediate) {
      debounceTimer = null;
      void pushSnapshot();
      return;
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void pushSnapshot();
    }, SNAPSHOT_DEBOUNCE_MS);
  };

  const onEvent = (event: GameEvent) => {
    send({ op: "update", event });
    if (event.stateVersion <= lastDeliveredVersion) return;
    pendingVersion = Math.max(pendingVersion, event.stateVersion);
    scheduleSnapshot(IMMEDIATE_SNAPSHOT_EVENTS.has(event.type));
  };

  const unsubscribe = subscribe(sessionId, onEvent);

  if (!isHost) void setPresence(userId, sessionId, "ONLINE").catch(() => {});

  send({ op: "connected" });
  void getSnapshot(userId, sessionId)
    .then((snapshot) => {
      if (closed) return;
      lastDeliveredVersion = snapshot.stateVersion;
      send({ op: "snapshot", stateVersion: snapshot.stateVersion, snapshot });
    })
    .catch((e) => {
      console.error("WS initial snapshot failed:", (e as Error).message);
    });

  const pingTimer = setInterval(() => {
    if (isRealtimeSocketOpen(socket)) socket.ping?.();
  }, 25_000);

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(pingTimer);
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubscribe();
    if (!isHost) void setPresence(userId, sessionId, "OFFLINE").catch(() => {});
  };

  return cleanup;
}
