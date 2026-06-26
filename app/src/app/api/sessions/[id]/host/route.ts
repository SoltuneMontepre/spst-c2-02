import { handle, currentUser, unauthorized } from "@/lib/api";
import { dispatchHostAction } from "@/lib/realtime/dispatch-host";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    const body = await request.json();
    return dispatchHostAction(user.id, id, body);
  });
}
