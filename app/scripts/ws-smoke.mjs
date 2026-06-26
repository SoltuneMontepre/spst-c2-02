import { createConnection } from "node:net";

const port = Number(process.env.PORT ?? 3000);
const path = process.argv[2] ?? "/api/realtime/home";

const req =
  `GET ${path} HTTP/1.1\r\n` +
  `Host: 127.0.0.1:${port}\r\n` +
  "Upgrade: websocket\r\n" +
  "Connection: Upgrade\r\n" +
  "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n" +
  "Sec-WebSocket-Version: 13\r\n" +
  "\r\n";

const socket = createConnection(port, "127.0.0.1");
const timer = setTimeout(() => {
  console.error("timeout waiting for upgrade response");
  socket.destroy();
  process.exit(1);
}, 5000);

socket.on("connect", () => socket.write(req));
socket.on("data", (chunk) => {
  clearTimeout(timer);
  const status = chunk.toString().split("\r\n")[0];
  console.log(status);
  socket.destroy();
  process.exit(0);
});
socket.on("error", (err) => {
  clearTimeout(timer);
  console.error(err.message);
  process.exit(1);
});
