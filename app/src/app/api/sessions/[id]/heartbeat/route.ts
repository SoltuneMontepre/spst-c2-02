import { handle, currentUser, unauthorized } from "@/lib/api";
import { heartbeat } from "@/lib/presence-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(async () => heartbeat(user.id, id));
}
