import { handle, currentUser, unauthorized } from "@/lib/api";
import {
  getActiveHostedSession,
  getActiveJoinedSession,
} from "@/lib/session-service";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => {
    const [hosted, joined] = await Promise.all([
      getActiveHostedSession(user.id),
      getActiveJoinedSession(user.id),
    ]);
    return { session: hosted, joined };
  });
}
