import { z } from "zod";
import { handle, currentUser, unauthorized } from "@/lib/api";
import { setOwnLobbyRole } from "@/lib/game-service";

const schema = z.object({
  role: z.enum(["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"]).nullable(),
  productivityProfile: z
    .enum(["TRADITIONAL", "SOCIAL_AVERAGE", "PIONEER"])
    .nullable()
    .optional(),
});

/** Any participant sets their own lobby role (null = Ngẫu nhiên). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    const body = schema.parse(await request.json());
    await setOwnLobbyRole(user.id, id, body.role, body.productivityProfile);
    return { ok: true };
  });
}
