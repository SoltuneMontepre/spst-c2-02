import { handle, currentUser, unauthorized } from "@/lib/api";
import { createSession } from "@/lib/session-service";
import { createSessionSchema } from "@/lib/create-session-schema";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => {
    const raw = await request.json().catch(() => ({}));
    const config = createSessionSchema.parse(raw);
    return createSession(user.id, config);
  });
}
