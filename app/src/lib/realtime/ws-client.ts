export type RealtimeState = "connecting" | "connected" | "disconnected";

export interface ReconnectingWs {
  send: (data: string) => boolean;
  close: () => void;
  getState: () => RealtimeState;
}

export function realtimeWsUrl(path: string): string {
  const proto = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== "undefined" ? window.location.host : "localhost:3000";
  return `${proto}//${host}${path}`;
}

/** WebSocket with auto-reconnect and exponential backoff. */
export function createReconnectingWs(
  url: string,
  handlers: {
    onOpen?: () => void;
    onMessage: (data: string) => void;
    onStateChange?: (state: RealtimeState) => void;
  },
): ReconnectingWs {
  let ws: WebSocket | null = null;
  let closed = false;
  let retries = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let state: RealtimeState = "connecting";

  const setState = (next: RealtimeState) => {
    state = next;
    handlers.onStateChange?.(next);
  };

  const connect = () => {
    if (closed) return;
    setState("connecting");
    ws = new WebSocket(url);

    ws.onopen = () => {
      retries = 0;
      setState("connected");
      handlers.onOpen?.();
    };

    ws.onmessage = (ev) => {
      handlers.onMessage(String(ev.data));
    };

    ws.onclose = () => {
      if (closed) return;
      setState("disconnected");
      const delay = Math.min(1000 * 2 ** retries, 15_000);
      retries += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws?.close();
    };
  };

  connect();

  return {
    send(data: string) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(data);
      return true;
    },
    close() {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      setState("connecting");
    },
    getState() {
      return state;
    },
  };
}
