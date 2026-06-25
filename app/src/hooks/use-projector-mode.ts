"use client";

import { useRouter } from "next/navigation";
import { hostSessionHref, playerSessionHref } from "@/lib/session-routes";

export type ProjectorViewMode = "player" | "projector";

function storageKey(sessionId: string): string {
  return `tlm-view:${sessionId}`;
}

export function projectorHref(sessionId: string): string {
  return hostSessionHref({ id: sessionId, status: "LOBBY" });
}

export function playerHref(sessionId: string, status: string): string {
  return playerSessionHref({ id: sessionId, status });
}

export function rememberProjectorView(
  sessionId: string,
  mode: ProjectorViewMode,
): void {
  try {
    sessionStorage.setItem(storageKey(sessionId), mode);
  } catch {
    // sessionStorage unavailable
  }
}

export function useProjectorNavigation(sessionId: string) {
  const router = useRouter();

  return {
    goToProjector: () => {
      rememberProjectorView(sessionId, "projector");
      router.push(projectorHref(sessionId));
    },
    goToPlayer: (status: string) => {
      rememberProjectorView(sessionId, "player");
      router.push(playerHref(sessionId, status));
    },
  };
}
