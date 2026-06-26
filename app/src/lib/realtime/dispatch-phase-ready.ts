import { z } from "zod";
import { setPhaseReady } from "@/lib/ai-host";

const schema = z.object({ ready: z.boolean() });

export async function dispatchPhaseReady(
  userId: string,
  sessionId: string,
  body: unknown,
): Promise<{ ok: true }> {
  const { ready } = schema.parse(body);
  await setPhaseReady(userId, sessionId, ready);
  return { ok: true };
}
