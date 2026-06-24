import { handle, currentUser, unauthorized } from "@/lib/api";
import { leaveSession } from "@/lib/session-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    await leaveSession(user.id, id);
    return { ok: true };
  });
}
