import { handle, currentUser, unauthorized } from "@/lib/api";
import { dispatchReady } from "@/lib/realtime/dispatch-ready";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    const body = await request.json();
    return dispatchReady(user.id, id, body);
  });
}
