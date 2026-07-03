"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommand } from "@/hooks/use-command";
import { formatThousandDong, MIN_PRICE_VND } from "@/lib/money";
import type { OfferView } from "@/lib/session-service";

export function OffersPanel({
  sessionId,
  stateVersion,
  incoming,
  outgoing,
  canCounter = true,
}: {
  sessionId: string;
  stateVersion?: number;
  incoming: OfferView[];
  outgoing: OfferView[];
  /** Only sellers (PRODUCER/INTERMEDIARY) can counter-offer; consumers can only accept/reject. */
  canCounter?: boolean;
}) {
  const command = useCommand(sessionId, stateVersion);
  const [counterPrices, setCounterPrices] = useState<Record<string, number>>({});

  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Đề nghị giá</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {incoming.map((o) => (
          <div key={o.id} className="flex flex-col gap-2 rounded-lg border p-3">
            <span>
              <b>{o.fromName}</b> đề nghị {o.quantity} thùng ·{" "}
              {formatThousandDong(o.offerPriceVnd)}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={command.isPending}
                onClick={() =>
                  command.mutate({
                    action: "respondOffer",
                    offerId: o.id,
                    decision: "ACCEPT",
                  })
                }
              >
                Chấp nhận
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={command.isPending}
                onClick={() =>
                  command.mutate({
                    action: "respondOffer",
                    offerId: o.id,
                    decision: "REJECT",
                  })
                }
              >
                Từ chối
              </Button>
              {canCounter ? (
                <>
                  <Input
                    type="number"
                    step={1000}
                    min={MIN_PRICE_VND}
                    className="h-9 w-24"
                    value={counterPrices[o.id] ?? o.offerPriceVnd + 1000}
                    onChange={(e) =>
                      setCounterPrices((p) => ({ ...p, [o.id]: Number(e.target.value) }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={command.isPending}
                    onClick={() =>
                      command.mutate({
                        action: "respondOffer",
                        offerId: o.id,
                        decision: "COUNTER",
                        counterPriceVnd: counterPrices[o.id] ?? o.offerPriceVnd + 1000,
                      })
                    }
                  >
                    Phản đề nghị
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ))}
        {outgoing
          .filter((o) => o.isIncoming)
          .map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-muted-foreground">
                Phản đề nghị từ <b>{o.fromName}</b>: {formatThousandDong(o.offerPriceVnd)}
              </span>
              <Button
                size="sm"
                disabled={command.isPending}
                onClick={() =>
                  command.mutate({
                    action: "respondOffer",
                    offerId: o.id,
                    decision: "ACCEPT",
                  })
                }
              >
                Chấp nhận
              </Button>
            </div>
          ))}
        {outgoing
          .filter((o) => !o.isIncoming)
          .map((o) => (
            <div key={o.id} className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
              Đang chờ <b>{o.toName}</b>: {o.quantity} thùng ·{" "}
              {formatThousandDong(o.offerPriceVnd)}
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
