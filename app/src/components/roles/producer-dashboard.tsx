"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { GameBentoShell } from "@/components/session/game-bento-shell";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { LaborValueCard } from "./labor-value-card";
import { ProducePanel } from "./produce-panel";
import { SellPanel } from "./sell-panel";
import { OffersPanel } from "./offers-panel";
import { WholesalePanel } from "./wholesale-panel";
import type { ProducerRoundState } from "@/lib/role-state";

export function ProducerDashboard({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as ProducerRoundState | null;

  return (
    <GameBentoShell
      sessionId={sessionId}
      activeZone="task"
      guidanceContext={{
        screen: "producer",
        phase: data.phase,
        round: data.currentRound,
      }}
    >
      <ZonePhaseGate
        sessionId={sessionId}
        activeZone="task"
        role={data.self.role}
        phase={data.phase}
        round={data.currentRound}
      >
        {state?.kind === "PRODUCER" ? (
          <div className="flex flex-col gap-4">
            {data.phase === "DECISION" ? (
              <>
                <LaborValueCard state={state} round={data.currentRound} />
                <ProducePanel
                  sessionId={sessionId}
                  state={state}
                  balanceVnd={data.self.balanceVnd ?? 0}
                  stateVersion={data.stateVersion}
                  currentRound={data.currentRound}
                />
              </>
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
            {data.phase !== "DECISION" && data.phase !== "MARKET_OPEN" ? (
              <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                Chờ giai đoạn ra quyết định hoặc chợ mở.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Vai trò sẽ sẵn sàng khi vào vòng chơi.
          </p>
        )}
      </ZonePhaseGate>
    </GameBentoShell>
  );
}
