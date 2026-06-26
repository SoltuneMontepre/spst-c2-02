import { handle, currentUser, unauthorized } from "@/lib/api";
import { dispatchPhaseReady } from "@/lib/realtime/dispatch-phase-ready";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    const body = await request.json();
    return dispatchPhaseReady(user.id, id, body);
  });
}
