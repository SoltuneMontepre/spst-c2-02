import { currentUser } from "@/lib/api";
import { db } from "@/lib/db";
import { subscribe, type GameEvent } from "@/lib/events";
import { getSnapshot } from "@/lib/session-service";

export const dynamic = "force-dynamic";

const SNAPSHOT_DEBOUNCE_MS = 50;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  const session = await db.gameSession.findUnique({
    where: { id },
    select: { hostUserId: true, participants: { select: { userId: true } } },
  });
  if (!session) return new Response("Not found", { status: 404 });
  const isHost = session.hostUserId === user.id;
  const isMember =
    isHost || session.participants.some((p) => p.userId === user.id);
  if (!isMember) return new Response("Forbidden", { status: 403 });

  // Presence is heartbeat-only (see use-session-stream) — SSE is events only.

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: string) => controller.enqueue(encoder.encode(payload));
      send(`event: ready\ndata: {}\n\n`);

      let lastDeliveredVersion = 0;
      let pendingVersion = 0;
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let closed = false;

      const pushSnapshot = async () => {
        if (closed) return;
        const minVersion = pendingVersion;
        pendingVersion = 0;
        try {
          const snapshot = await getSnapshot(user.id, id);
          if (closed) return;
          if (snapshot.stateVersion < minVersion && minVersion > lastDeliveredVersion) {
            pendingVersion = Math.max(pendingVersion, minVersion);
            scheduleSnapshot();
            return;
          }
          if (snapshot.stateVersion <= lastDeliveredVersion) return;
          lastDeliveredVersion = snapshot.stateVersion;
          send(
            `event: snapshot\ndata: ${JSON.stringify({
              stateVersion: snapshot.stateVersion,
              snapshot,
            })}\n\n`,
          );
        } catch (e) {
          console.error("SSE snapshot push failed:", (e as Error).message);
        }
      };

      const scheduleSnapshot = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          void pushSnapshot();
        }, SNAPSHOT_DEBOUNCE_MS);
      };

      const onEvent = (event: GameEvent) => {
        send(`event: update\ndata: ${JSON.stringify(event)}\n\n`);
        if (event.stateVersion <= lastDeliveredVersion) return;
        pendingVersion = Math.max(pendingVersion, event.stateVersion);
        scheduleSnapshot();
      };

      const unsubscribe = subscribe(id, onEvent);

      void getSnapshot(user.id, id)
        .then((snapshot) => {
          if (closed) return;
          lastDeliveredVersion = snapshot.stateVersion;
          send(
            `event: snapshot\ndata: ${JSON.stringify({
              stateVersion: snapshot.stateVersion,
              snapshot,
            })}\n\n`,
          );
        })
        .catch((e) => {
          console.error("SSE initial snapshot failed:", (e as Error).message);
        });

      const heartbeat = setInterval(() => send(`: ping\n\n`), 25_000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        if (debounceTimer) clearTimeout(debounceTimer);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Tell nginx-style intermediaries (many tunnels included) not to buffer
      // the response — without this, events sit in a proxy buffer and arrive
      // late/in bursts instead of as they're published.
      "X-Accel-Buffering": "no",
    },
  });
}
