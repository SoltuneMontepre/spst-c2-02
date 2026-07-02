"use client";

import { Client, Realtime } from "appwrite";
import { appwriteConfig } from "@/lib/appwrite-config";

let browserClient: Client | null = null;
let browserRealtime: Realtime | null = null;

export function isAppwriteRealtimeEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim());
}

export function getAppwriteBrowserClient(): Client {
  if (!appwriteConfig.projectId) {
    throw new Error("NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set");
  }
  if (!browserClient) {
    browserClient = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);
  }
  return browserClient;
}

export function getAppwriteRealtimeClient(): Realtime {
  if (!browserRealtime) {
    browserRealtime = new Realtime(getAppwriteBrowserClient());
  }
  return browserRealtime;
}

function resetAppwriteRealtime(): void {
  if (!browserRealtime) return;
  void browserRealtime.disconnect().catch(() => {});
  browserRealtime = null;
}

export function setAppwriteBrowserSession(secret: string): void {
  getAppwriteBrowserClient().setSession(secret);
  resetAppwriteRealtime();
}

export function clearAppwriteBrowserSession(): void {
  if (browserClient) {
    browserClient.setSession("");
    resetAppwriteRealtime();
  }
}
