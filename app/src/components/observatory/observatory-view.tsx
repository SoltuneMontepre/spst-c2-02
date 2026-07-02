"use client";

import { GameSessionLayout } from "@/components/session/game-session-layout";

export function ObservatoryView({ sessionId }: { sessionId: string }) {
  return (
    <GameSessionLayout sessionId={sessionId} activeZone="observatory">
      {null}
    </GameSessionLayout>
  );
}
