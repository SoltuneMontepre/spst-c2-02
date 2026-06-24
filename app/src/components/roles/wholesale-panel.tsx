"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { useCommand } from "@/hooks/use-command";
import { formatThousandDong, MIN_PRICE_VND } from "@/lib/money";
import type { InventoryView, WholesaleView } from "@/lib/session-service";

export function WholesalePanel({
  sessionId,
  inventory,
  offers,
  role,
}: {
  sessionId: string;
  inventory: InventoryView[];
  offers: WholesaleView[];
  role: "PRODUCER" | "INTERMEDIARY";
}) {
  const command = useCommand(sessionId);
  const [lotId, setLotId] = useState(inventory[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [minPrice, setMinPrice] = useState(8000);
  const [counterPrices, setCounterPrices] = useState<Record<string, number>>({});

  const lot = inventory.find((l) => l.id === lotId) ?? inventory[0];
  const openOffers = offers.filter((o) => !o.isOwn);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kênh bán buôn</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {role === "PRODUCER" && inventory.length > 0 ? (
          <>
            {inventory.length > 1 ? (
              <select
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-2 text-sm"
              >
                {inventory.map((l) => (
                  <option key={l.id} value={l.id}>
                    Lô {l.availableQuantity} thùng
                  </option>
                ))}
              </select>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <Stepper value={qty} min={1} max={lot?.availableQuantity ?? 1} onChange={setQty} />
              <Input
                type="number"
                step={1000}
                min={MIN_PRICE_VND}
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Button
              disabled={command.isPending || !lot}
              onClick={() =>
                command.mutate({
                  action: "wholesale",
                  inventoryLotId: lot!.id,
                  quantity: qty,
                  minimumPriceVnd: minPrice,
                })
              }
            >
              Đăng bán buôn · tối thiểu {formatThousandDong(minPrice)}
            </Button>
          </>
        ) : null}

        {offers.filter((o) => o.isOwn).map((o) => (
          <div key={o.id} className="rounded-lg border p-3">
            <span>
              Lô của bạn: {o.quantity} thùng · tối thiểu {formatThousandDong(o.minimumPriceVnd)}
            </span>
            {o.status === "COUNTERED" && o.counterPriceVnd ? (
              <div className="mt-2 flex gap-2">
                <span>Phản giá: {formatThousandDong(o.counterPriceVnd)}</span>
                <Button
                  size="sm"
                  disabled={command.isPending}
                  onClick={() =>
                    command.mutate({
                      action: "respondWholesale",
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
                      action: "respondWholesale",
                      offerId: o.id,
                      decision: "REJECT",
                    })
                  }
                >
                  Từ chối
                </Button>
              </div>
            ) : null}
          </div>
        ))}

        {role === "INTERMEDIARY"
          ? openOffers.map((o) => (
              <div key={o.id} className="flex flex-col gap-2 rounded-lg border p-3">
                <span>
                  <b>{o.producerName}</b> · {o.quantity} thùng · tối thiểu{" "}
                  {formatThousandDong(o.minimumPriceVnd)}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={command.isPending}
                    onClick={() =>
                      command.mutate({
                        action: "respondWholesale",
                        offerId: o.id,
                        decision: "ACCEPT",
                      })
                    }
                  >
                    Mua theo giá tối thiểu
                  </Button>
                  <Input
                    type="number"
                    step={1000}
                    className="h-9 w-24"
                    value={counterPrices[o.id] ?? o.minimumPriceVnd}
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
                        action: "respondWholesale",
                        offerId: o.id,
                        decision: "COUNTER",
                        counterPriceVnd: counterPrices[o.id] ?? o.minimumPriceVnd,
                      })
                    }
                  >
                    Phản giá
                  </Button>
                </div>
              </div>
            ))
          : null}
      </CardContent>
    </Card>
  );
}
