/** Navigation targets for session cards and lists. */
export function hostSessionHref(session: { id: string; status: string }): string {
  if (session.status === "LOBBY") return `/session/${session.id}/lobby`;
  return `/host/session/${session.id}`;
}

export function playerSessionHref(session: { id: string; status: string }): string {
  if (session.status === "LOBBY") return `/session/${session.id}/lobby`;
  if (["COMPLETED", "INCOMPLETE", "CANCELLED"].includes(session.status)) {
    return `/session/${session.id}/debrief`;
  }
  return `/session/${session.id}/map`;
}

export function historySessionHref(session: {
  sessionId: string;
  status: string;
}): string {
  if (["COMPLETED", "INCOMPLETE", "CANCELLED"].includes(session.status)) {
    return `/session/${session.sessionId}/debrief`;
  }
  return `/session/${session.sessionId}/map`;
}
