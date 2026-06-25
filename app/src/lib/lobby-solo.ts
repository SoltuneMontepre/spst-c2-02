import { SOLO_LOBBY_CANCEL_MS } from "./scenario";

export function soloLobbyCancelAtMs(soloSinceIso: string): number {
  return new Date(soloSinceIso).getTime() + SOLO_LOBBY_CANCEL_MS;
}

export function soloLobbyRemainingMs(soloSinceIso: string, now = Date.now()): number {
  return Math.max(0, soloLobbyCancelAtMs(soloSinceIso) - now);
}

export function formatSoloLobbyCountdown(remainingMs: number): string {
  const totalSec = Math.ceil(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
