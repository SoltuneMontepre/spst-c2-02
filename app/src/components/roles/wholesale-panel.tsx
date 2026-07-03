"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceInput } from "@/components/ui/price-input";
import { Stepper } from "@/components/ui/stepper";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import {
  formatThousandDong,
  MAX_PRICE_VND,
  MIN_PRICE_VND,
  PRICE_STEP_VND,
} from "@/lib/money";
import { PriceStepper } from "./producer-action-card";
import type { InventoryView, WholesaleView } from "@/lib/session-service";

export function WholesalePanel({
  sessionId,
  stateVersion,
  inventory,
  offers,
  role,
  balanceVnd,
}: {
  sessionId: string;
  stateVersion?: number;
  inventory: InventoryView[];
  offers: WholesaleView[];
  role: "PRODUCER" | "INTERMEDIARY";
  balanceVnd?: number | null;
}) {
  const command = useCommand(sessionId, stateVersion);
  const [lotId, setLotId] = useState(inventory[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [minPrice, setMinPrice] = useState(8000);
  const [counterPrices, setCounterPrices] = useState<Record<string, number>>({});
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({});

  const lot = inventory.find((l) => l.id === lotId) ?? inventory[0];
  // Only truly unclaimed offers are actionable here — one already countered by
  // someone else (bot or another intermediary) must not look buyable.
  const openOffers = offers.filter((o) => !o.isOwn && o.status === "OPEN");
  const ownOffers = offers.filter((o) => o.isOwn);
  const commandError =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code)
      : null;

  return (
    <div className="flex flex-col gap-3 text-sm">
        {role === "PRODUCER" && inventory.length > 0 ? (
          <>
            <div className="rounded-[10.5px] border border-border bg-muted/20 p-3">
              <p className="text-sm font-semibold">Đăng bán sỉ cho đại lý</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Chọn số thùng và giá tối thiểu. Đại lý có thể mua ngay hoặc gửi
                giá phản hồi.
              </p>
            </div>
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
              <PriceInput
                value={minPrice}
                onChange={setMinPrice}
                min={MIN_PRICE_VND}
                max={MAX_PRICE_VND}
                step={PRICE_STEP_VND}
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

        {role === "PRODUCER"
          ? ownOffers.map((o) => (
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
            ))
          : null}

        {role === "INTERMEDIARY"
          ? ownOffers
              .filter((o) => o.status === "COUNTERED")
              .map((o) => (
                <div
                  key={o.id}
                  className="rounded-[10.5px] border border-border bg-muted/10 px-3 py-2.5 text-sm text-muted-foreground"
                >
                  Đã gửi giá {formatThousandDong(o.counterPriceVnd ?? o.minimumPriceVnd)} —
                  đang chờ nhà cung cấp phản hồi.
                </div>
              ))
          : null}

        {role === "INTERMEDIARY" ? (
          <>
            <div className="rounded-[10.5px] border border-border bg-muted/20 p-3">
              <p className="text-sm font-semibold">Mục tiêu của khung này</p>
              <div className="mt-2 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
                <span className="font-medium text-foreground">1. Nhập hàng sỉ</span>
                <ArrowRight className="hidden size-3.5 shrink-0 sm:block" aria-hidden />
                <span>2. Hàng vào tồn kho</span>
                <ArrowRight className="hidden size-3.5 shrink-0 sm:block" aria-hidden />
                <span>3. Niêm yết bán lẻ bên phải</span>
              </div>
            </div>

            {openOffers.length === 0 ? (
              <div className="rounded-[10.5px] border border-dashed border-border bg-surface px-3 py-5 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Nguồn hàng đang được chuẩn bị</p>
                <p className="mt-1.5">
                  Nhà cung cấp sẽ dành một đề nghị phù hợp với số vốn hiện có của
                  bạn ngay đầu phiên chợ.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[14px] border border-border">
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 bg-muted/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <span>Nhà cung cấp</span>
                  <span>SL</span>
                  <span>Giá đề nghị</span>
                  <span className="sr-only">Hành động</span>
                </div>
                {openOffers.map((offer) => {
                  const counterPrice = counterPrices[offer.id] ?? offer.minimumPriceVnd;
                  const isFloor = counterPrice === offer.minimumPriceVnd;
                  // Partial quantity only applies to instant buys at the floor
                  // price — a counter offer still negotiates the whole lot.
                  const quantity = isFloor
                    ? Math.min(buyQuantities[offer.id] ?? offer.quantity, offer.quantity)
                    : offer.quantity;
                  const total = counterPrice * quantity;
                  const canAfford = balanceVnd == null || balanceVnd >= total;

                  return (
                    <div
                      key={offer.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-t border-border px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {offer.producerName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {offer.quantity} thùng · sàn {formatThousandDong(offer.minimumPriceVnd)}
                        </span>
                      </span>
                      {isFloor ? (
                        <Stepper
                          size="sm"
                          value={quantity}
                          min={1}
                          max={offer.quantity}
                          onChange={(next) =>
                            setBuyQuantities((p) => ({ ...p, [offer.id]: next }))
                          }
                        />
                      ) : (
                        <span className="text-center text-xs text-muted-foreground">
                          cả lô
                        </span>
                      )}
                      <PriceStepper
                        value={counterPrice}
                        min={MIN_PRICE_VND}
                        max={MAX_PRICE_VND}
                        disabled={command.isPending}
                        onChange={(next) =>
                          setCounterPrices((p) => ({ ...p, [offer.id]: next }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={command.isPending || !canAfford}
                        title={!canAfford ? "Vốn không đủ để nhập lô này." : undefined}
                        onClick={() =>
                          command.mutate(
                            isFloor
                              ? {
                                  action: "respondWholesale",
                                  offerId: offer.id,
                                  decision: "ACCEPT",
                                  quantity,
                                }
                              : {
                                  action: "respondWholesale",
                                  offerId: offer.id,
                                  decision: "COUNTER",
                                  counterPriceVnd: counterPrice,
                                },
                          )
                        }
                      >
                        {isFloor ? "Mua" : "Gửi giá"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] leading-4 text-muted-foreground">
              Mua đúng giá sàn nhập kho ngay. Chỉnh giá thấp hơn rồi «Gửi giá» để
              nhà cung cấp duyệt trước khi giao dịch hoàn tất.
            </p>
          </>
        ) : null}

        {commandError ? (
          <p className="text-sm text-danger" role="alert">
            {commandError}
          </p>
        ) : null}
    </div>
  );
}
