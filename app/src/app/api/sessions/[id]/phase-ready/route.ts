import { z } from "zod";
import { handle, currentUser, unauthorized } from "@/lib/api";
import { setPhaseReady } from "@/lib/ai-host";

const schema = z.object({ ready: z.boolean() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    const { ready } = schema.parse(await request.json());
    await setPhaseReady(user.id, id, ready);
    return { ok: true };
  });
}
