import { currentUser, unauthorized } from "@/lib/api";
import { subscribeHome } from "@/lib/events";
import { getHomeDashboard } from "@/lib/session-service";

export const dynamic = "force-dynamic";

const DASHBOARD_DEBOUNCE_MS = 100;

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: string) => controller.enqueue(encoder.encode(payload));
      send(`event: ready\ndata: {}\n\n`);

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let closed = false;

      const pushDashboard = async () => {
        if (closed) return;
        try {
          const dashboard = await getHomeDashboard(user.id);
          if (closed) return;
          send(`event: snapshot\ndata: ${JSON.stringify({ dashboard })}\n\n`);
        } catch (e) {
          console.error("Home SSE snapshot push failed:", (e as Error).message);
        }
      };

      const scheduleDashboard = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          void pushDashboard();
        }, DASHBOARD_DEBOUNCE_MS);
      };

      const unsubscribe = subscribeHome(user.id, scheduleDashboard);

      void pushDashboard();

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
    },
  });
}
