"use client";

import { useState } from "react";
import { Check, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceInput } from "@/components/ui/price-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { formatThousandDong, MIN_PRICE_VND, PRICE_STEP_VND } from "@/lib/money";
import type { OfferView } from "@/lib/session-service";

function defaultCounterPrice(offer: OfferView): number {
  const ask = offer.askPriceVnd;
  if (ask != null && ask > offer.offerPriceVnd + PRICE_STEP_VND) {
    // Midpoint between buyer offer and ask, snapped to 1.000.
    const mid = Math.floor((offer.offerPriceVnd + ask) / 2 / PRICE_STEP_VND) * PRICE_STEP_VND;
    return Math.min(ask - PRICE_STEP_VND, Math.max(offer.offerPriceVnd + PRICE_STEP_VND, mid));
  }
  return offer.offerPriceVnd + PRICE_STEP_VND;
}

/** Need at least one 1.000 step strictly between buyer offer and ask. */
function hasCounterRoom(offer: OfferView): boolean {
  return (
    offer.askPriceVnd != null &&
    offer.askPriceVnd - offer.offerPriceVnd >= 2 * PRICE_STEP_VND
  );
}

function counterPriceValid(offer: OfferView, price: number): boolean {
  if (!hasCounterRoom(offer)) return false;
  if (!Number.isFinite(price) || price < MIN_PRICE_VND) return false;
  if (price % PRICE_STEP_VND !== 0) return false;
  if (price <= offer.offerPriceVnd) return false;
  if (offer.askPriceVnd != null && price >= offer.askPriceVnd) return false;
  return true;
}

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

  const errorText =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code, command.error.message)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Đề nghị giá</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {errorText ? (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
            {errorText}
          </p>
        ) : null}

        {incoming.map((o) => {
          const price = counterPrices[o.id] ?? defaultCounterPrice(o);
          const canSendCounter = canCounter && counterPriceValid(o, price);
          const askLabel =
            o.askPriceVnd != null ? formatThousandDong(o.askPriceVnd) : null;

          return (
            <div
              key={o.id}
              className="flex flex-col gap-2 rounded-[10.5px] border border-border bg-muted/10 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{o.fromName}</p>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {o.quantity} thùng · {formatThousandDong(o.offerPriceVnd)}
                </span>
              </div>
              {canCounter && askLabel && hasCounterRoom(o) ? (
                <p className="text-xs text-muted-foreground">
                  Phản đề nghị phải cao hơn {formatThousandDong(o.offerPriceVnd)} và thấp
                  hơn giá niêm yết {askLabel}.
                </p>
              ) : null}
              {canCounter && askLabel && !hasCounterRoom(o) ? (
                <p className="text-xs text-muted-foreground">
                  Giá đề nghị đã sát niêm yết ({askLabel}) — chỉ có thể chấp nhận hoặc từ
                  chối.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={command.isPending}
                  onClick={() =>
                    command.mutate({
                      action: "respondOffer",
                      offerId: o.id,
                      decision: "ACCEPT",
                    })
                  }
                >
                  <Check className="size-3.5" aria-hidden />
                  Chấp nhận
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={command.isPending}
                  onClick={() =>
                    command.mutate({
                      action: "respondOffer",
                      offerId: o.id,
                      decision: "REJECT",
                    })
                  }
                >
                  <X className="size-3.5" aria-hidden />
                  Từ chối
                </Button>
                {canCounter && hasCounterRoom(o) ? (
                  <>
                    <PriceInput
                      value={price}
                      step={PRICE_STEP_VND}
                      min={o.offerPriceVnd + PRICE_STEP_VND}
                      max={
                        o.askPriceVnd != null
                          ? o.askPriceVnd - PRICE_STEP_VND
                          : undefined
                      }
                      suffix={null}
                      onChange={(next) =>
                        setCounterPrices((p) => ({ ...p, [o.id]: next }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      disabled={command.isPending || !canSendCounter}
                      onClick={() =>
                        command.mutate({
                          action: "respondOffer",
                          offerId: o.id,
                          decision: "COUNTER",
                          counterPriceVnd: price,
                        })
                      }
                    >
                      <Send className="size-3.5" aria-hidden />
                      Phản đề nghị
                    </Button>
                  </>
                ) : null}
              </div>
              {canCounter && hasCounterRoom(o) && !canSendCounter && Number.isFinite(price) ? (
                <p className="text-[11px] text-danger">
                  {price <= o.offerPriceVnd
                    ? "Giá phải cao hơn đề nghị của người mua (hoặc bấm Chấp nhận)."
                    : o.askPriceVnd != null && price >= o.askPriceVnd
                      ? `Giá phải thấp hơn giá niêm yết (${askLabel}).`
                      : "Giá không hợp lệ."}
                </p>
              ) : null}
            </div>
          );
        })}

        {outgoing.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between gap-2 rounded-[10.5px] bg-muted/25 px-3 py-2"
          >
            <span className="text-xs text-muted-foreground">
              Đang chờ <span className="font-semibold text-foreground">{o.toName}</span>
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              {o.quantity} thùng · {formatThousandDong(o.offerPriceVnd)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
