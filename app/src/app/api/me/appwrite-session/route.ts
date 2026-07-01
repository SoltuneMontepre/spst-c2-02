import { NextResponse } from "next/server";
import { currentUser, jsonError, unauthorized } from "@/lib/api";
import { createAppwriteSessionForUser } from "@/lib/appwrite-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const session = await createAppwriteSessionForUser(user.id);
  if (!session) return jsonError("APPWRITE_NOT_CONFIGURED", 503);

  return NextResponse.json(session);
}
