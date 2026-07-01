import { AppwriteException, Permission, Role } from "node-appwrite";
import { db } from "./db";
import { appwriteConfig } from "./appwrite-config";
import { getAppwriteTablesDB } from "./appwrite-server";
import type { GameEvent } from "./events";

function isServerAppwriteEnabled(): boolean {
  return Boolean(process.env.APPWRITE_API_KEY?.trim() && appwriteConfig.projectId);
}

async function sessionReaderUserIds(sessionId: string): Promise<string[]> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    select: {
      hostUserId: true,
      participants: { where: { isBot: false }, select: { userId: true } },
    },
  });
  if (!session) return [];
  const ids = new Set<string>([session.hostUserId]);
  for (const p of session.participants) {
    if (p.userId) ids.add(p.userId);
  }
  return [...ids];
}

function userReadPermissions(userIds: string[]): string[] {
  return userIds.map((id) => Permission.read(Role.user(id)));
}

/** Upsert session_signals row so Appwrite Realtime notifies room members. */
export async function publishSessionSignal(event: GameEvent): Promise<void> {
  if (!isServerAppwriteEnabled()) return;
  const tables = getAppwriteTablesDB();
  if (!tables) return;

  try {
    const readerIds = await sessionReaderUserIds(event.sessionId);
    const permissions = userReadPermissions(readerIds);
    const data =
      event.data === undefined
        ? null
        : typeof event.data === "string"
          ? event.data
          : JSON.stringify(event.data);

    await tables.upsertRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.sessionSignalsTableId,
      rowId: event.sessionId,
      data: {
        stateVersion: event.stateVersion,
        type: event.type,
        data,
      },
      permissions,
    });
  } catch (e) {
    console.error(
      "Appwrite session signal publish failed:",
      (e as AppwriteException).message ?? (e as Error).message,
    );
  }
}

/** Bump home_signals for one user (dashboard invalidation). */
export async function publishHomeUserSignal(userId: string): Promise<void> {
  if (!isServerAppwriteEnabled()) return;
  const tables = getAppwriteTablesDB();
  if (!tables) return;

  try {
    let tick = 1;
    try {
      const existing = await tables.getRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.homeSignalsTableId,
        rowId: userId,
      });
      const current = (existing as { tick?: number }).tick ?? 0;
      tick = current + 1;
    } catch {
      /* first write */
    }

    await tables.upsertRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.homeSignalsTableId,
      rowId: userId,
      data: { tick },
      permissions: [Permission.read(Role.user(userId))],
    });
  } catch (e) {
    console.error(
      "Appwrite home user signal failed:",
      (e as AppwriteException).message ?? (e as Error).message,
    );
  }
}

/** Bump public home_signals row (lobby list invalidation). */
export async function publishHomePublicSignal(): Promise<void> {
  if (!isServerAppwriteEnabled()) return;
  const tables = getAppwriteTablesDB();
  if (!tables) return;

  const rowId = "public";
  try {
    let tick = 1;
    try {
      const existing = await tables.getRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.homeSignalsTableId,
        rowId,
      });
      const current = (existing as { tick?: number }).tick ?? 0;
      tick = current + 1;
    } catch {
      /* first write */
    }

    await tables.upsertRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.homeSignalsTableId,
      rowId,
      data: { tick },
      permissions: [Permission.read(Role.users())],
    });
  } catch (e) {
    console.error(
      "Appwrite home public signal failed:",
      (e as AppwriteException).message ?? (e as Error).message,
    );
  }
}
