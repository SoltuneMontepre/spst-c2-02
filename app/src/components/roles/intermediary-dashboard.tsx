"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { GameBentoShell } from "@/components/session/game-bento-shell";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { SellPanel } from "./sell-panel";
import { OffersPanel } from "./offers-panel";
import { WholesalePanel } from "./wholesale-panel";

export function IntermediaryDashboard({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const open = data.phase === "MARKET_OPEN";

  return (
    <GameBentoShell
      sessionId={sessionId}
      activeZone="task"
      guidanceContext={{ screen: "intermediary", phase: data.phase }}
    >
      <ZonePhaseGate
        sessionId={sessionId}
        activeZone="task"
        role={data.self.role}
        phase={data.phase}
        round={data.currentRound}
      >
        {open ? (
          <div className="flex flex-col gap-4">
            <WholesalePanel
              sessionId={sessionId}
              inventory={data.self.inventory}
              offers={data.market?.wholesaleOffers ?? []}
              role="INTERMEDIARY"
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
          </div>
        ) : (
          <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            Chờ giai đoạn chợ mở để mua buôn và bán lẻ.
          </p>
        )}
      </ZonePhaseGate>
    </GameBentoShell>
  );
}
