// Central env access for the game backend. Validates the essentials up front so
// the process fails fast instead of throwing deep inside a request/socket.

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: Number(optional("SERVER_PORT", "4000")),
  host: optional("SERVER_HOST", "0.0.0.0"),

  // Same secret the Next app signs Auth.js JWTs with — used to verify sockets/REST.
  authSecret: required("AUTH_SECRET"),

  databaseUrl: required("DATABASE_URL"),
  redisUrl: optional("REDIS_URL"),

  // Comma-separated allowed browser origins for CORS + Socket.IO. In prod this is
  // the frontend origin; in dev it's the Next dev server.
  corsOrigins: optional("CORS_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  get isProd(): boolean {
    return this.nodeEnv === "production";
  },
} as const;

// Auth.js cookie names: __Secure- prefix over HTTPS, plain over HTTP. We try both
// when reading the session token from the request/handshake cookies.
export const AUTHJS_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
] as const;
