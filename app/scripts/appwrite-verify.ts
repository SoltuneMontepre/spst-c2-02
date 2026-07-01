import { Client, TablesDB, Permission, Role } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT ?? "https://sgp.cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID ?? "6a448c0b000409129d63";
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID ?? "6a448e96001f1f8cd381";
const sessionTableId = process.env.APPWRITE_SESSION_SIGNALS_TABLE_ID ?? "session_signals";
const homeTableId = process.env.APPWRITE_HOME_SIGNALS_TABLE_ID ?? "home_signals";

if (!apiKey) {
  console.error("Missing APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tables = new TablesDB(client);

const row = await tables.upsertRow({
  databaseId,
  tableId: sessionTableId,
  rowId: "setup-test",
  data: { stateVersion: 1, type: "setup:ping", data: "{}" },
  permissions: [Permission.read(Role.any())],
});

console.log("session_signals upsert ok:", row.$id, row.stateVersion);

await tables.upsertRow({
  databaseId,
  tableId: homeTableId,
  rowId: "setup-test-user",
  data: { tick: 1 },
  permissions: [Permission.read(Role.any())],
});

console.log("home_signals upsert ok");
console.log("Appwrite realtime database is ready.");
