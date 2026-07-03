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

/** The view the host last chose for this room (§ host doesn't want to re-pick every visit). */
export function getRememberedProjectorView(
  sessionId: string,
): ProjectorViewMode | null {
  try {
    const value = sessionStorage.getItem(storageKey(sessionId));
    return value === "player" || value === "projector" ? value : null;
  } catch {
    return null;
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
