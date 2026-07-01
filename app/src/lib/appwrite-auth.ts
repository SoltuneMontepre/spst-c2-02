import { AppwriteException, Users } from "node-appwrite";
import { db } from "./db";
import { getAppwriteServerClient } from "./appwrite-server";

export interface AppwriteSessionPayload {
  userId: string;
  secret: string;
  expire: string;
}

/** Ensure an Appwrite user exists for the NextAuth user, then mint a client session. */
export async function createAppwriteSessionForUser(
  userId: string,
): Promise<AppwriteSessionPayload | null> {
  const client = getAppwriteServerClient();
  if (!client) return null;

  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, email: true, displayName: true },
  });
  if (!user) return null;

  const users = new Users(client);

  try {
    await users.create({
      userId: user.id,
      email: user.email,
      name: user.displayName,
    });
  } catch (e) {
    const err = e as AppwriteException;
    if (err.code !== 409) {
      try {
        await users.get({ userId: user.id });
      } catch {
        throw e;
      }
    }
  }

  const session = await users.createSession({ userId: user.id });
  return {
    userId: session.userId,
    secret: session.secret,
    expire: session.expire,
  };
}
