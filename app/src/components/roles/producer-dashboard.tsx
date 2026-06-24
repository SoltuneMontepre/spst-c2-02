"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { GamePhaseHud } from "@/components/session/game-phase-hud";
import { PlayerStatusBar } from "@/components/session/player-status-bar";
import { LaborValueCard } from "./labor-value-card";
import { ProducePanel } from "./produce-panel";
import { SellPanel } from "./sell-panel";
import { OffersPanel } from "./offers-panel";
import { WholesalePanel } from "./wholesale-panel";
import type { ProducerRoundState } from "@/lib/role-state";
import { CommodityCard } from "@/components/learning/commodity-card";
import { BackToMap } from "@/components/session/back-to-map";
import { GameGuidance } from "@/components/learning/game-guidance";

export function ProducerDashboard({ sessionId }: { sessionId: string }) {
  useSessionStream(sessionId);
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as ProducerRoundState | null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <BackToMap sessionId={sessionId} />
      <GameGuidance
        context={{ screen: "producer", phase: data.phase, round: data.currentRound }}
      />
      <GamePhaseHud sessionId={sessionId} data={data} />
      <PlayerStatusBar self={data.self} />
      <CommodityCard listedUnits={data.self.listings.reduce((s, l) => s + l.availableQuantity, 0)} />
      {state?.kind === "PRODUCER" ? (
        <>
          <LaborValueCard state={state} round={data.currentRound} />
          {data.phase === "DECISION" ? (
            <ProducePanel
              sessionId={sessionId}
              state={state}
              balanceVnd={data.self.balanceVnd ?? 0}
              stateVersion={data.stateVersion}
              currentRound={data.currentRound}
            />
          ) : null}
          {data.phase === "MARKET_OPEN" ? (
            <>
              <WholesalePanel
                sessionId={sessionId}
                inventory={data.self.inventory}
                offers={data.market?.wholesaleOffers ?? []}
                role="PRODUCER"
              />
              <SellPanel
                sessionId={sessionId}
                inventory={data.self.inventory}
                listings={data.self.listings}
              />
              <OffersPanel
                sessionId={sessionId}
                incoming={data.self.incomingOffers}
                outgoing={data.self.outgoingOffers}
              />
            </>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Vai trò sẽ sẵn sàng khi vào vòng chơi.
        </p>
      )}
    </main>
  );
}
