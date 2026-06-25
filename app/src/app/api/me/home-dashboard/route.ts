import { handle, currentUser, unauthorized } from "@/lib/api";
import { getHomeDashboard } from "@/lib/session-service";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => getHomeDashboard(user.id));
}
