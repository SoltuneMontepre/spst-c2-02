"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionCancelledRedirect } from "@/hooks/use-session-cancelled-redirect";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { GamePhaseCta } from "@/components/session/game-phase-cta";
import { EventPanel } from "@/components/session/event-panel";
import { MarketSnapshotPanel } from "@/components/session/market-snapshot-panel";
import { MapZones } from "./map-zones";
import { RoundRecapCard } from "@/components/observatory/round-recap-card";
import { PHASE_LABELS } from "@/lib/labels";

const ENDED = ["COMPLETED", "INCOMPLETE"];

export function MapShell({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, isLoading } = useSessionSnapshot(sessionId);

  useSessionCancelledRedirect(data?.status, "solo_timeout");

  useEffect(() => {
    if (!data) return;
    if (data.status === "LOBBY") router.replace(`/session/${sessionId}/lobby`);
    else if (data.isHost && !data.autoHost) router.replace(`/host/session/${sessionId}`);
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
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] : "";

  return (
    <GameSessionLayout
      sessionId={sessionId}
      activeZone="map"
      title="Bản đồ chợ"
      subtitle={`Chợ Thanh Long · Vòng ${data.currentRound}${phaseLabel ? ` · ${phaseLabel}` : ""}`}
      rightPanel={
        <>
          <EventPanel round={data.currentRound} />
          <MarketSnapshotPanel stats={data.liveRoundStats} />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <GamePhaseCta
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
            participants={data.participants}
            interactive={mapInteractive}
          />
        )}
      </div>
    </GameSessionLayout>
  );
}
