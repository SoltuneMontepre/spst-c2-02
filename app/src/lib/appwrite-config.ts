/** Appwrite IDs for realtime signal tables (game_realtime database). */
export const appwriteConfig = {
  endpoint:
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ??
    process.env.APPWRITE_ENDPOINT ??
    "https://sgp.cloud.appwrite.io/v1",
  projectId:
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ??
    process.env.APPWRITE_PROJECT_ID ??
    "6a448c0b000409129d63",
  databaseId:
    process.env.APPWRITE_DATABASE_ID ?? "6a448e96001f1f8cd381",
  sessionSignalsTableId:
    process.env.APPWRITE_SESSION_SIGNALS_TABLE_ID ?? "session_signals",
  homeSignalsTableId:
    process.env.APPWRITE_HOME_SIGNALS_TABLE_ID ?? "home_signals",
} as const;

export function isAppwriteConfigured(): boolean {
  return Boolean(
    appwriteConfig.projectId &&
      (process.env.APPWRITE_API_KEY?.trim() ||
        process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID),
  );
}
