import { handle, currentUser, unauthorized } from "@/lib/api";
import { getSnapshot } from "@/lib/session-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(() => getSnapshot(user.id, id));
}
