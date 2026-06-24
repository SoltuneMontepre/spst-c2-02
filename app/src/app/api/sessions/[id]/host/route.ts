import { z } from "zod";
import { handle, currentUser, unauthorized } from "@/lib/api";
import {
  startSession,
  hostNext,
  hostPause,
  hostResume,
  hostExtend,
  hostEnd,
  hostCancel,
} from "@/lib/game-service";

const schema = z.object({
  action: z.enum(["start", "next", "pause", "resume", "extend", "end", "cancel"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    const { action } = schema.parse(await request.json());
    const fns = {
      start: startSession,
      next: hostNext,
      pause: hostPause,
      resume: hostResume,
      extend: hostExtend,
      end: hostEnd,
      cancel: hostCancel,
    };
    await fns[action](user.id, id);
    return { ok: true };
  });
}
