import { z } from "zod";
import { handle, currentUser, unauthorized, ApiError } from "@/lib/api";
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
    try {
      await setPhaseReady(user.id, id, ready);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "FORBIDDEN") throw new ApiError("FORBIDDEN", 403);
      if (msg === "INVALID_STATE") throw new ApiError("INVALID_STATE", 409);
      throw e;
    }
    return { ok: true };
  });
}
