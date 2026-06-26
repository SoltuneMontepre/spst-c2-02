import type { ServerWebSocket } from "bun";
import type { NextRequestHandler } from "./next-fetch-bridge";
import { db } from "@/lib/db";
import { resolveUserFromRequest } from "./ws-auth";
import { attachSessionConnection } from "./session-connection";
import { attachHomeConnection } from "./home-connection";
import { fromBunSocket } from "./realtime-socket";
import { fetchViaNextHandler } from "./next-fetch-bridge";
import {
  parseClientInbound,
  serverFrame,
  type ClientInbound,
} from "./ws-protocol";
import { dispatchError } from "./dispatch-errors";
import { dispatchSessionCommand } from "./dispatch-command";
import { dispatchHostAction } from "./dispatch-host";
import { dispatchReady } from "./dispatch-ready";
import { dispatchPhaseReady } from "./dispatch-phase-ready";
import { heartbeat } from "@/lib/presence-service";

const SESSION_PATH = /^\/api\/realtime\/session\/([^/]+)\/?$/;
const HOME_PATH = /^\/api\/realtime\/home\/?$/;

type BunWsData =
  | {
      kind: "session";
      userId: string;
      sessionId: string;
      isHost: boolean;
      cleanup?: () => void;
    }
  | { kind: "home"; userId: string; cleanup?: () => void };

async function handleClientMessage(
  userId: string,
  sessionId: string,
  ws: ServerWebSocket<BunWsData>,
  msg: ClientInbound,
): Promise<void> {
  try {
    if (msg.op === "command") {
      await dispatchSessionCommand(userId, sessionId, msg);
      return;
    }
    if (msg.op === "host") {
      await dispatchHostAction(userId, sessionId, msg);
      return;
    }
    if (msg.op === "ready") {
      await dispatchReady(userId, sessionId, { ready: msg.ready });
      return;
    }
    if (msg.op === "phaseReady") {
      await dispatchPhaseReady(userId, sessionId, { ready: msg.ready });
      return;
    }
    if (msg.op === "heartbeat") {
      await heartbeat(userId, sessionId);
    }
  } catch (err) {
    ws.send(serverFrame(dispatchError(err)));
  }
}

/** Start Bun.serve with native WebSocket upgrade (production Docker runtime). */
export function startBunServer(opts: {
  hostname: string;
  port: number;
  handle: NextRequestHandler;
}): void {
  const { hostname, port, handle } = opts;

  Bun.serve<BunWsData>({
    hostname,
    port,
    async fetch(req, server) {
      const pathname = new URL(req.url).pathname;
      const homeMatch = HOME_PATH.exec(pathname);
      const sessionMatch = SESSION_PATH.exec(pathname);

      if (homeMatch || sessionMatch) {
        const user = await resolveUserFromRequest(req);
        if (!user) {
          return new Response(null, { status: 401, statusText: "Unauthorized" });
        }

        if (homeMatch) {
          const upgraded = server.upgrade(req, {
            data: { kind: "home", userId: user.id },
          });
          return upgraded
            ? undefined
            : new Response("Upgrade failed", { status: 400 });
        }

        const sessionId = sessionMatch![1]!;
        const session = await db.gameSession.findUnique({
          where: { id: sessionId },
          select: {
            hostUserId: true,
            participants: { select: { userId: true } },
          },
        });
        if (!session) {
          return new Response(null, { status: 404, statusText: "Not Found" });
        }
        const isHost = session.hostUserId === user.id;
        const isMember =
          isHost || session.participants.some((p) => p.userId === user.id);
        if (!isMember) {
          return new Response(null, { status: 403, statusText: "Forbidden" });
        }

        const upgraded = server.upgrade(req, {
          data: { kind: "session", userId: user.id, sessionId, isHost },
        });
        return upgraded
          ? undefined
          : new Response("Upgrade failed", { status: 400 });
      }

      return fetchViaNextHandler(req, handle);
    },
    websocket: {
      open(ws) {
        const data = ws.data;
        if (data.kind === "home") {
          data.cleanup = attachHomeConnection(data.userId, fromBunSocket(ws));
          return;
        }
        data.cleanup = attachSessionConnection({
          userId: data.userId,
          sessionId: data.sessionId,
          isHost: data.isHost,
          socket: fromBunSocket(ws),
        });
      },
      message(ws, message) {
        if (ws.data.kind !== "session") return;
        const raw =
          typeof message === "string" ? message : new TextDecoder().decode(message);
        const parsed = parseClientInbound(raw);
        if (!parsed) {
          ws.send(
            serverFrame({
              op: "error",
              code: "INVALID_MESSAGE",
              message: "Không đọc được tin nhắn",
            }),
          );
          return;
        }
        void handleClientMessage(
          ws.data.userId,
          ws.data.sessionId,
          ws,
          parsed,
        );
      },
      close(ws) {
        ws.data.cleanup?.();
      },
    },
  });
}
