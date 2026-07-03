"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
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
  const commandError =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code)
      : null;

  return (
    <div className="flex flex-col gap-3 text-sm">
      {inventory.length === 0 ? (
        <div className="rounded-[10.5px] border border-dashed border-border bg-surface px-3 py-5 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Chưa có hàng để niêm yết</p>
          <p className="mt-1.5">
            Nhập hàng sỉ ở cột bên trái trước, tồn kho sẽ xuất hiện ở đây.
          </p>
        </div>
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

          <div className="flex items-center justify-between gap-2 rounded-[10.5px] border border-border bg-muted/10 p-3">
            <Stepper
              value={qty}
              min={1}
              max={lot?.availableQuantity ?? 1}
              onChange={setQty}
              size="sm"
            />
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={price}
                step={1000}
                min={MIN_PRICE_VND}
                max={MAX_PRICE_VND}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="h-9 w-24 text-right font-mono"
              />
              <span className="text-xs text-muted-foreground">đ/thùng</span>
            </div>
          </div>

          <Button
            className="h-10 justify-start rounded-[14px] px-3"
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
            <Store className="size-3.5" aria-hidden />
            Niêm yết {qty} thùng · {formatThousandDong(price)}
          </Button>
        </>
      )}

      {listings.length > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <span className="text-xs font-semibold text-muted-foreground">Quầy của bạn</span>
          {listings.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-[10.5px] bg-muted/25 px-3 py-2"
            >
              <span className="font-medium text-foreground">{l.availableQuantity} thùng</span>
              <span className="font-mono font-bold text-price">
                {formatThousandDong(l.askPriceVnd)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {commandError ? (
        <p className="text-sm text-danger" role="alert">
          {commandError}
        </p>
      ) : null}
    </div>
  );
}
