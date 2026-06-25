"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { useCommand } from "@/hooks/use-command";
import { formatThousandDong, MIN_PRICE_VND, MAX_PRICE_VND } from "@/lib/money";
import type { InventoryView, ListingView } from "@/lib/session-service";

export function SellPanel({
  sessionId,
  stateVersion,
  inventory,
  listings,
}: {
  sessionId: string;
  stateVersion?: number;
  inventory: InventoryView[];
  listings: ListingView[];
}) {
  const command = useCommand(sessionId, stateVersion);
  const [lotId, setLotId] = useState(inventory[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(10000);

  const lot = inventory.find((l) => l.id === lotId) ?? inventory[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Đưa hàng ra chợ</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {inventory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có hàng khả dụng để niêm yết.</p>
        ) : (
          <>
            {inventory.length > 1 ? (
              <select
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-2 text-sm"
              >
                {inventory.map((l) => (
                  <option key={l.id} value={l.id}>
                    Lô {l.availableQuantity} thùng (vốn {formatThousandDong(l.unitCostVnd)})
                  </option>
                ))}
              </select>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <Stepper value={qty} min={1} max={lot?.availableQuantity ?? 1} onChange={setQty} />
              <div className="flex items-center gap-1 text-sm">
                <Input
                  type="number"
                  value={price}
                  step={1000}
                  min={MIN_PRICE_VND}
                  max={MAX_PRICE_VND}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-muted-foreground">Đồng</span>
              </div>
            </div>
            <Button
              disabled={command.isPending || !lot}
              onClick={() =>
                command.mutate({
                  action: "list",
                  inventoryLotId: lot!.id,
                  quantity: qty,
                  askPriceVnd: price,
                })
              }
            >
              Niêm yết {qty} thùng · {formatThousandDong(price)}
            </Button>
          </>
        )}

        {listings.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Quầy của bạn</span>
            {listings.map((l) => (
              <span key={l.id}>
                {l.availableQuantity} thùng · {formatThousandDong(l.askPriceVnd)}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
