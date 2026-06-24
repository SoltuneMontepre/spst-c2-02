"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { useCommand } from "@/hooks/use-command";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GamePhaseHud } from "@/components/session/game-phase-hud";
import { BackToMap } from "@/components/session/back-to-map";
import { GameGuidance } from "@/components/learning/game-guidance";
import { HelpHint } from "@/components/learning/help-hint";
import { OffersPanel } from "./offers-panel";
import { formatThousandDong } from "@/lib/money";
import type { ConsumerRoundState } from "@/lib/role-state";

export function ConsumerMarket({ sessionId }: { sessionId: string }) {
  useSessionStream(sessionId);
  const { data } = useSessionSnapshot(sessionId);
  const command = useCommand(sessionId);
  const [offerPrices, setOfferPrices] = useState<Record<string, number>>({});
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as ConsumerRoundState | null;
  const listings = data.market?.listings ?? [];
  const open = data.phase === "MARKET_OPEN";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <BackToMap sessionId={sessionId} />
      <GameGuidance context={{ screen: "consumer", phase: data.phase }} />
      <GamePhaseHud sessionId={sessionId} data={data} />
      <Card>
        <CardContent className="flex items-center justify-between p-4 text-sm">
          <span>
            Nhu cầu: <b>{state?.fulfilledUnits ?? 0}/{state?.needTarget ?? 0}</b> thùng
            <HelpHint text="Đủ số thùng nhu cầu vòng này để nhận hiệu ích (điểm người tiêu dùng)." />
          </span>
          <span className="font-semibold text-primary">
            {formatThousandDong(data.self.balanceVnd ?? 0)}
          </span>
        </CardContent>
      </Card>

      {!open ? (
        <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          Chợ chưa mở. Hãy chờ giai đoạn mua bán.
        </p>
      ) : listings.length === 0 ? (
        <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          Chưa có quầy nào niêm yết hàng.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {listings.map((l) => {
            const affordable = (data.self?.balanceVnd ?? 0) >= l.askPriceVnd;
            return (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
              >
                <div className="flex flex-col text-sm">
                  <span className="font-medium">{formatThousandDong(l.askPriceVnd)}</span>
                  <span className="text-xs text-muted-foreground">
                    {l.sellerName} · còn {l.availableQuantity}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
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
      )}

      <OffersPanel
        sessionId={sessionId}
        incoming={data.self.incomingOffers}
        outgoing={data.self.outgoingOffers}
      />
    </main>
  );
}
