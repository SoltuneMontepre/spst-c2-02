"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionCancelledRedirect } from "@/hooks/use-session-cancelled-redirect";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { GamePhaseCta } from "@/components/session/game-phase-cta";
import { GameInsightPanel } from "@/components/session/game-insight-panel";
import { MapZones } from "./map-zones";
import { RoundRecapCard } from "@/components/observatory/round-recap-card";

const ENDED = ["COMPLETED", "INCOMPLETE"];

export function MapShell({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, isLoading } = useSessionSnapshot(sessionId);

  useSessionCancelledRedirect(data?.status, "solo_timeout");

  useEffect(() => {
    if (!data) return;
    if (data.status === "LOBBY") router.replace(`/session/${sessionId}/lobby`);
    else if (ENDED.includes(data.status) || data.status === "DEBRIEF")
      router.replace(`/session/${sessionId}/debrief`);
  }, [data, router, sessionId]);

  if (isLoading || !data) {
    return <p className="p-6 text-muted-foreground">Đang tải phiên…</p>;
  }

  const recapRound = data.analytics.find((r) => r.number === data.currentRound);
  const role = data.self?.role ?? null;
  const mapInteractive =
    data.status !== "INTRO" &&
    (data.phase === "DECISION" || data.phase === "MARKET_OPEN");

  return (
    <GameSessionLayout
      variant="map"
      sessionId={sessionId}
      activeZone="map"
      rightPanel={
        <GameInsightPanel round={data.currentRound} stats={data.liveRoundStats} />
      }
    >
      <GamePhaseCta
        variant="map"
        sessionId={sessionId}
        phase={data.phase}
        round={data.currentRound}
        role={role}
      />
      {data.phase === "RECAP" && recapRound ? (
        <RoundRecapCard sessionId={sessionId} round={recapRound} />
      ) : (
        <MapZones
          sessionId={sessionId}
          role={role}
          round={data.currentRound}
          participants={data.participants}
          interactive={mapInteractive}
        />
      )}
    </GameSessionLayout>
  );
}
