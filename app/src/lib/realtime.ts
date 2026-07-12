"use client";

// Single shared Socket.IO connection to the game backend. The session and home
// streams both ride this connection (a user is on one page at a time, but events
// carry sessionId so overlapping subscriptions filter cleanly).

import { io, type Socket } from "socket.io-client";
import { BACKEND_URL } from "./backend";

let socket: Socket | null = null;

/** Lazily create (and reuse) the shared backend socket. Same-origin when
 *  BACKEND_URL is empty (production behind the ingress); cross-origin (same-site)
 *  in dev so the Auth.js cookie still flows via withCredentials. */
export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(BACKEND_URL || undefined, {
    path: "/socket.io",
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  return socket;
}
