// Base URL of the standalone game backend. Empty string = same origin (production
// behind the ingress, which routes /api and /socket.io to the backend). In dev set
// NEXT_PUBLIC_BACKEND_URL=http://localhost:4000.
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
