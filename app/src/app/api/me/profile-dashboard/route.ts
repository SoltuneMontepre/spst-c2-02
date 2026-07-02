import { handle, currentUser, unauthorized } from "@/lib/api";
import { getProfileDashboard } from "@/lib/profile-service";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => getProfileDashboard(user.id), { "cache-control": "no-store" });
}
