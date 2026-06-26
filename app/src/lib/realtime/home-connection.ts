import { subscribeHome } from "@/lib/events";
import { getHomeDashboard } from "@/lib/session-service";
import { isRealtimeSocketOpen, type RealtimeSocket } from "./realtime-socket";
import { serverFrame } from "./ws-protocol";

const DASHBOARD_DEBOUNCE_MS = 100;

export function attachHomeConnection(
  userId: string,
  socket: RealtimeSocket,
): () => void {
  let closed = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const send = (payload: Parameters<typeof serverFrame>[0]) => {
    if (closed || !isRealtimeSocketOpen(socket)) return;
    socket.send(serverFrame(payload));
  };

  const pushDashboard = async () => {
    if (closed) return;
    try {
      const dashboard = await getHomeDashboard(userId);
      if (closed) return;
      send({ op: "dashboard", dashboard });
    } catch (e) {
      console.error("WS home dashboard push failed:", (e as Error).message);
    }
  };

  const scheduleDashboard = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void pushDashboard();
    }, DASHBOARD_DEBOUNCE_MS);
  };

  const unsubscribe = subscribeHome(userId, scheduleDashboard);

  send({ op: "connected" });
  void pushDashboard();

  const pingTimer = setInterval(() => {
    if (isRealtimeSocketOpen(socket)) socket.ping?.();
  }, 25_000);

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(pingTimer);
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubscribe();
  };

  return cleanup;
}
