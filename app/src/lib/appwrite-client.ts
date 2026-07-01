"use client";

import { Client } from "appwrite";
import { appwriteConfig } from "@/lib/appwrite-config";

let browserClient: Client | null = null;

export function isAppwriteRealtimeEnabled(): boolean {
  return Boolean(appwriteConfig.projectId);
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

export function setAppwriteBrowserSession(secret: string): void {
  getAppwriteBrowserClient().setSession(secret);
}

export function clearAppwriteBrowserSession(): void {
  if (browserClient) browserClient.setSession("");
}
