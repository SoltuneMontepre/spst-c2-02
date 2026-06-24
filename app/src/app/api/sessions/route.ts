import { handle, currentUser, unauthorized } from "@/lib/api";
import { createSession } from "@/lib/session-service";

export async function POST() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(() => createSession(user.id));
}
