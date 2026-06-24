"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useCommand } from "@/hooks/use-command";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GameBentoShell } from "@/components/session/game-bento-shell";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { OffersPanel } from "./offers-panel";
import { formatThousandDong } from "@/lib/money";
import type { ConsumerRoundState } from "@/lib/role-state";

export function ConsumerMarket({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  const command = useCommand(sessionId);
  const [offerPrices, setOfferPrices] = useState<Record<string, number>>({});
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as ConsumerRoundState | null;
  const listings = data.market?.listings ?? [];
  const open = data.phase === "MARKET_OPEN";
  const role = data.self.role;

  const marketContent = !open ? (
    <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
      Danh sách quầy sẽ hiện khi giai đoạn «Chợ mở».
    </p>
  ) : listings.length === 0 ? (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm">
      <p className="font-medium text-foreground">Chưa có quầy niêm yết</p>
      <p className="mt-2 text-muted-foreground">
        Nhà sản xuất và trung gian đang đưa hàng lên chợ — thường mất vài giây sau khi giai đoạn
        mở.
      </p>
    </div>
  ) : (
    <ul className="flex flex-col gap-2">
      {listings.map((l) => {
        const affordable = (data.self?.balanceVnd ?? 0) >= l.askPriceVnd;
        return (
          <li
            key={l.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/10 p-3"
          >
            <div className="min-w-0 flex-col text-sm">
              <span className="font-medium">{formatThousandDong(l.askPriceVnd)}</span>
              <span className="text-xs text-muted-foreground">
                {l.sellerName} · còn {l.availableQuantity}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Button
                size="sm"
                disabled={!affordable || command.isPending}
                onClick={() => command.mutate({ action: "buy", listingId: l.id, quantity: 1 })}
              >
                {affordable ? "Mua 1 thùng" : "Thiếu tiền"}
              </Button>
              {affordable && l.askPriceVnd > 1000 ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={command.isPending}
                  onClick={() =>
                    command.mutate({
                      action: "offer",
                      listingId: l.id,
                      quantity: 1,
                      offerPriceVnd:
                        offerPrices[l.id] ?? Math.max(1000, l.askPriceVnd - 2000),
                    })
                  }
                >
                  Đề nghị{" "}
                  {formatThousandDong(
                    offerPrices[l.id] ?? Math.max(1000, l.askPriceVnd - 2000),
                  )}
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <GameBentoShell
      sessionId={sessionId}
      activeZone="market"
      guidanceContext={{ screen: "consumer", phase: data.phase }}
    >
      <ZonePhaseGate
        sessionId={sessionId}
        activeZone="market"
        role={role}
        phase={data.phase}
        round={data.currentRound}
      >
        {marketContent}
        {open ? (
          <OffersPanel
            sessionId={sessionId}
            incoming={data.self.incomingOffers}
            outgoing={data.self.outgoingOffers}
          />
        ) : null}
      </ZonePhaseGate>
    </GameBentoShell>
  );
}
