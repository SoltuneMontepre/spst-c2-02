/** Navigation targets for session cards and lists. */
import { roomCancelledHomeHref } from "./room-cancelled";

export function hostSessionHref(session: { id: string; status: string }): string {
  return `/host/session/${session.id}`;
}

export function playerSessionHref(session: { id: string; status: string }): string {
  if (session.status === "LOBBY") return `/session/${session.id}/lobby`;
  if (["COMPLETED", "INCOMPLETE", "CANCELLED"].includes(session.status)) {
    return `/session/${session.id}/debrief`;
  }
  return `/session/${session.id}/game`;
}

export function historySessionHref(session: {
  sessionId: string;
  status: string;
}): string {
  if (session.status === "CANCELLED") return roomCancelledHomeHref();
  if (["COMPLETED", "INCOMPLETE"].includes(session.status)) {
    return `/session/${session.sessionId}/debrief`;
  }
  return `/session/${session.sessionId}/game`;
}
