"use client";

import { useState } from "react";
import { ArrowRight, HandCoins, Send, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { formatThousandDong, MIN_PRICE_VND } from "@/lib/money";
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

  const lot = inventory.find((l) => l.id === lotId) ?? inventory[0];
  const openOffers = offers.filter((o) => !o.isOwn);
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

        {ownOffers.map((o) => (
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
              openOffers.map((offer) => {
                const counterPrice = counterPrices[offer.id] ?? offer.minimumPriceVnd;
                const minimumTotal = offer.minimumPriceVnd * offer.quantity;
                const counterTotal = counterPrice * offer.quantity;
                const canBuyMinimum =
                  balanceVnd == null || balanceVnd >= minimumTotal;
                const canSendCounter =
                  counterPrice >= offer.minimumPriceVnd &&
                  (balanceVnd == null || balanceVnd >= counterTotal);

                return (
                  <div
                    key={offer.id}
                    className="flex flex-col gap-3 rounded-[10.5px] border border-border bg-muted/10 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{offer.producerName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {offer.quantity} thùng đang chờ đại lý nhập kho
                        </p>
                      </div>
                      <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                        Giá sàn {formatThousandDong(offer.minimumPriceVnd)}
                      </div>
                    </div>

                    <dl className="grid gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-[10.5px] bg-muted/25 p-2">
                        <dt className="text-muted-foreground">Số lượng</dt>
                        <dd className="mt-0.5 font-mono font-bold">{offer.quantity} thùng</dd>
                      </div>
                      <div className="rounded-[10.5px] bg-muted/25 p-2">
                        <dt className="text-muted-foreground">Tổng tiền mua</dt>
                        <dd className="mt-0.5 font-mono font-bold">
                          {formatThousandDong(minimumTotal)}
                        </dd>
                      </div>
                      <div className="rounded-[10.5px] bg-muted/25 p-2">
                        <dt className="text-muted-foreground">Sau khi mua</dt>
                        <dd className="mt-0.5 font-semibold text-success">+ tồn kho</dd>
                      </div>
                    </dl>

                    <div className="rounded-[10.5px] bg-primary/5 px-3 py-2 text-xs leading-5 text-muted-foreground">
                      Mua xong, lô này sẽ chuyển sang cột{" "}
                      <span className="font-semibold text-foreground">Niêm yết bán lẻ</span>.
                    </div>

                    <div className="grid gap-2">
                      <Button
                        size="sm"
                        className="h-10 justify-start rounded-[14px] px-3"
                        disabled={command.isPending || !canBuyMinimum}
                        onClick={() =>
                          command.mutate({
                            action: "respondWholesale",
                            offerId: offer.id,
                            decision: "ACCEPT",
                          })
                        }
                      >
                        <ShoppingCart className="size-3.5" aria-hidden />
                        Nhập kho với giá sàn
                      </Button>

                      <div className="rounded-[10.5px] border border-border bg-muted/10 p-2.5">
                        <label
                          htmlFor={`counter-${offer.id}`}
                          className="text-xs font-semibold text-foreground"
                        >
                          Gửi giá khác cho nhà cung cấp
                        </label>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <Input
                            id={`counter-${offer.id}`}
                            type="number"
                            step={1000}
                            min={offer.minimumPriceVnd}
                            className="h-9 sm:w-32"
                            value={counterPrice}
                            onChange={(e) =>
                              setCounterPrices((p) => ({
                                ...p,
                                [offer.id]: Number(e.target.value),
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-9 sm:shrink-0"
                            disabled={command.isPending || !canSendCounter}
                            onClick={() =>
                              command.mutate({
                                action: "respondWholesale",
                                offerId: offer.id,
                                decision: "COUNTER",
                                counterPriceVnd: counterPrice,
                              })
                            }
                          >
                            <Send className="size-3.5" aria-hidden />
                            Gửi giá
                          </Button>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
                          Giá gửi lại không thấp hơn giá sàn. Nhà cung cấp phải chấp
                          nhận thì giao dịch mới hoàn tất.
                        </p>
                      </div>
                    </div>

                    {!canBuyMinimum ? (
                      <p className="flex items-center gap-1.5 text-xs text-danger">
                        <HandCoins className="size-3.5" aria-hidden />
                        Vốn không đủ để nhập lô này.
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
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
