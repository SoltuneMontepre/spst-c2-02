import { Client, TablesDB } from "node-appwrite";
import { appwriteConfig } from "./appwrite-config";

let serverClient: Client | null = null;
let tablesDb: TablesDB | null = null;

/** Server-side Appwrite client (API key). Returns null when not configured. */
export function getAppwriteServerClient(): Client | null {
  const key = process.env.APPWRITE_API_KEY?.trim();
  if (!key || !appwriteConfig.projectId) return null;
  if (!serverClient) {
    serverClient = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
      .setKey(key);
  }
  return serverClient;
}

export function getAppwriteTablesDB(): TablesDB | null {
  const client = getAppwriteServerClient();
  if (!client) return null;
  if (!tablesDb) tablesDb = new TablesDB(client);
  return tablesDb;
}
