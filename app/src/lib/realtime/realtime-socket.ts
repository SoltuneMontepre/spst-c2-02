/** Minimal socket surface used by session/home realtime connections. */
export interface RealtimeSocket {
  readonly readyState: number;
  send(data: string): void;
  ping?(): void;
}

export const REALTIME_SOCKET_OPEN = 1;

export function isRealtimeSocketOpen(socket: RealtimeSocket): boolean {
  return socket.readyState === REALTIME_SOCKET_OPEN;
}

export function fromWsSocket(socket: import("ws").WebSocket): RealtimeSocket {
  return {
    get readyState() {
      return socket.readyState;
    },
    send: (data) => socket.send(data),
    ping: () => socket.ping(),
  };
}

export function fromBunSocket(
  socket: import("bun").ServerWebSocket<unknown>,
): RealtimeSocket {
  return {
    get readyState() {
      return socket.readyState;
    },
    send: (data) => socket.send(data),
    ping: () => {
      if ("ping" in socket && typeof socket.ping === "function") {
        socket.ping();
      }
    },
  };
}
