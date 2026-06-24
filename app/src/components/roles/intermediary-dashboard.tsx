"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { GamePhaseHud } from "@/components/session/game-phase-hud";
import { PlayerStatusBar } from "@/components/session/player-status-bar";
import { BackToMap } from "@/components/session/back-to-map";
import { GameGuidance } from "@/components/learning/game-guidance";
import { SellPanel } from "./sell-panel";
import { OffersPanel } from "./offers-panel";
import { WholesalePanel } from "./wholesale-panel";

export function IntermediaryDashboard({ sessionId }: { sessionId: string }) {
  useSessionStream(sessionId);
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const open = data.phase === "MARKET_OPEN";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <BackToMap sessionId={sessionId} />
      <GameGuidance context={{ screen: "intermediary", phase: data.phase }} />
      <GamePhaseHud sessionId={sessionId} data={data} />
      <PlayerStatusBar self={data.self} />

      {open ? (
        <>
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
        </>
      ) : (
        <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          Chờ giai đoạn chợ mở để mua buôn và bán lẻ.
        </p>
      )}
    </main>
  );
}
