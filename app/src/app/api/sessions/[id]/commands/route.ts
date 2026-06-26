import { z } from "zod";
import { handle, currentUser, unauthorized } from "@/lib/api";
import { dispatchSessionCommand } from "@/lib/realtime/dispatch-command";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  return handle(async () => {
    const body = await request.json();
    return dispatchSessionCommand(user.id, id, body);
  });
}
