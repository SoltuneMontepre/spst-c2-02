import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { parse } from "node:url";
import next from "next";
import { loadEnvConfig } from "@next/env";

async function main() {
  const dev = process.env.NODE_ENV !== "production";
  loadEnvConfig(process.cwd(), dev);

  const hostname = process.env.HOSTNAME ?? "0.0.0.0";
  const port = Number(process.env.PORT ?? 3000);

  const app = next({ dev, hostname, port, dir: process.cwd() });
  const handle = app.getRequestHandler();

  await app.prepare();

  const isBunRuntime =
    typeof process.versions.bun === "string" &&
    process.versions.bun.length > 0;

  if (isBunRuntime) {
    const { startBunServer } = await import("@/lib/realtime/ws-gateway-bun");
    startBunServer({ hostname, port, handle });
    console.log(`> Ready on http://${hostname}:${port} (realtime WS enabled, Bun)`);
    return;
  }

  const { attachRealtimeGateway } = await import("@/lib/realtime/ws-gateway");

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url ?? "/", true);
    void handle(req, res, parsedUrl);
  });

  attachRealtimeGateway(server);

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (realtime WS enabled)`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
