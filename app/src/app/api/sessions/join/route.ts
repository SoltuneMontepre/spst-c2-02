import { handle, currentUser, unauthorized } from "@/lib/api";
import { joinSession } from "@/lib/session-service";
import { joinSessionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => {
    const { code } = joinSessionSchema.parse(await request.json());
    return joinSession(user.id, code);
  });
}
