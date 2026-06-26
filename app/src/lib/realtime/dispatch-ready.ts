import { z } from "zod";
import { setReady } from "@/lib/session-service";

const schema = z.object({ ready: z.boolean() });

export async function dispatchReady(
  userId: string,
  sessionId: string,
  body: unknown,
): Promise<{ ok: true }> {
  const { ready } = schema.parse(body);
  await setReady(userId, sessionId, ready);
  return { ok: true };
}
