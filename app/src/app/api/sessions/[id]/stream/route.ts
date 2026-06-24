import { currentUser } from "@/lib/api";
import { db } from "@/lib/db";
import { subscribe, type GameEvent } from "@/lib/events";
import { setPresence } from "@/lib/session-service";

export const dynamic = "force-dynamic";

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

  // The live connection is the presence signal for players (FR-ROOM-07).
  if (!isHost) void setPresence(user.id, id, "ONLINE").catch(() => {});

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: string) => controller.enqueue(encoder.encode(payload));
      send(`event: ready\ndata: {}\n\n`);

      const onEvent = (event: GameEvent) =>
        send(`event: update\ndata: ${JSON.stringify(event)}\n\n`);
      const unsubscribe = subscribe(id, onEvent);

      const heartbeat = setInterval(() => send(`: ping\n\n`), 25_000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        if (!isHost) void setPresence(user.id, id, "OFFLINE").catch(() => {});
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
    },
  });
}
