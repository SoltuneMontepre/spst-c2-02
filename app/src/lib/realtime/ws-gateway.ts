import type { Server, IncomingMessage } from "node:http";
import { Socket } from "node:net";
import { WebSocketServer, type WebSocket } from "ws";
import { db } from "@/lib/db";
import { resolveUserFromUpgrade } from "./ws-auth";
import { attachSessionConnection } from "./session-connection";
import { attachHomeConnection } from "./home-connection";
import { fromWsSocket } from "./realtime-socket";
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

function rejectUpgrade(socket: Socket, status: number, message: string): void {
  socket.write(
    `HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
  );
  socket.destroy();
}

async function handleClientMessage(
  userId: string,
  sessionId: string,
  socket: WebSocket,
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
    socket.send(serverFrame(dispatchError(err)));
  }
}

/** Attach WebSocket upgrade handler for session + home realtime. */
export function attachRealtimeGateway(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const pathname = (req.url ?? "/").split("?")[0] ?? "/";

    const homeMatch = HOME_PATH.exec(pathname);
    const sessionMatch = SESSION_PATH.exec(pathname);
    if (!homeMatch && !sessionMatch) return;

    void (async () => {
      const user = await resolveUserFromUpgrade(req);
      if (!user) {
        rejectUpgrade(socket, 401, "Unauthorized");
        return;
      }

      if (homeMatch) {
        wss.handleUpgrade(req, socket, head, (ws) => {
          const cleanup = attachHomeConnection(user.id, fromWsSocket(ws));
          ws.on("close", cleanup);
          ws.on("error", cleanup);
        });
        return;
      }

      const sessionId = sessionMatch![1]!;
      const session = await db.gameSession.findUnique({
        where: { id: sessionId },
        select: { hostUserId: true, participants: { select: { userId: true } } },
      });
      if (!session) {
        rejectUpgrade(socket, 404, "Not Found");
        return;
      }
      const isHost = session.hostUserId === user.id;
      const isMember =
        isHost || session.participants.some((p) => p.userId === user.id);
      if (!isMember) {
        rejectUpgrade(socket, 403, "Forbidden");
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        const cleanup = attachSessionConnection({
          userId: user.id,
          sessionId,
          isHost,
          socket: fromWsSocket(ws),
        });
        ws.on("close", cleanup);
        ws.on("error", cleanup);

        ws.on("message", (data) => {
          const raw = typeof data === "string" ? data : data.toString("utf8");
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
          void handleClientMessage(user.id, sessionId, ws, parsed);
        });
      });
    })().catch((e) => {
      console.error("WS upgrade failed:", (e as Error).message);
      rejectUpgrade(socket, 500, "Internal Server Error");
    });
  });
}
