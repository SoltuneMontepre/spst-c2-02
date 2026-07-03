"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Store, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { producerUnitCostVnd, unitValueVnd } from "@/lib/economy";
import { MAX_PRICE_VND, MIN_PRICE_VND, PRICE_STEP_VND } from "@/lib/money";
import { UPGRADE_COSTS } from "@/lib/scenario";
import {
  formatCompactVnd,
  PriceStepper,
  ProducerActionCard,
  ProducerQuantityControl,
} from "./producer-action-card";
import type { InventoryView, ListingView } from "@/lib/session-service";
import type { ProducerRoundState } from "@/lib/role-state";

export function ProducerSalesPanel({
  sessionId,
  state,
  balanceVnd,
  stateVersion,
  currentRound,
  phase,
  inventory,
  listings,
  phaseReady,
}: {
  sessionId: string;
  state: ProducerRoundState;
  balanceVnd: number;
  stateVersion?: number;
  currentRound: number;
  phase: string | null;
  inventory: InventoryView[];
  listings: ListingView[];
  phaseReady: boolean;
}) {
  const command = useCommand(sessionId, stateVersion);
  const [qty, setQty] = useState(0);

  const activeLot = useMemo(
    () =>
      [...inventory]
        .filter((lot) => lot.availableQuantity > 0)
        .sort((a, b) => b.availableQuantity - a.availableQuantity)[0],
    [inventory],
  );
  const maxQty = activeLot?.availableQuantity ?? 0;
  const listedQty = listings.reduce((sum, l) => sum + l.availableQuantity, 0);

  useEffect(() => {
    setQty((current) => Math.min(current, maxQty));
  }, [maxQty]);

  const retailStandardPrice = unitValueVnd(currentRound);
  const unitCost = producerUnitCostVnd(state);
  const wholesaleStandardPrice = Math.max(MIN_PRICE_VND, unitCost);

  const [retailPrice, setRetailPrice] = useState(retailStandardPrice);
  const [wholesalePrice, setWholesalePrice] = useState(wholesaleStandardPrice);

  useEffect(() => {
    setRetailPrice(retailStandardPrice);
  }, [retailStandardPrice]);

  useEffect(() => {
    setWholesalePrice(wholesaleStandardPrice);
  }, [wholesaleStandardPrice]);

  const canSell =
    phase === "MARKET_OPEN" && Boolean(activeLot) && qty > 0 && !phaseReady;

  const upgradeCost =
    state.profile === "TRADITIONAL"
      ? UPGRADE_COSTS.TRADITIONAL_TO_SOCIAL_AVERAGE
      : state.profile === "SOCIAL_AVERAGE"
        ? UPGRADE_COSTS.SOCIAL_AVERAGE_TO_PIONEER
        : null;
  const discountedUpgrade =
    state.techSupportActive && upgradeCost ? Math.ceil(upgradeCost * 0.5) : upgradeCost;
  const canUpgrade =
    phase === "DECISION" &&
    currentRound < 4 &&
    Boolean(discountedUpgrade) &&
    !state.pendingUpgrade &&
    state.profile !== "PIONEER" &&
    balanceVnd >= (discountedUpgrade ?? 0) &&
    !phaseReady;
  const sellDisabledReason =
    phase !== "MARKET_OPEN"
      ? "Chỉ đưa hàng ra chợ ở giai đoạn chợ mở."
      : !activeLot
        ? "Chưa có hàng trong kho. Hãy sản xuất trước."
        : qty <= 0
          ? "Chọn số thùng muốn đưa ra chợ."
          : null;
  const upgradeDisabledReason =
    phase !== "DECISION"
      ? "Chỉ nâng cấp ở giai đoạn ra quyết định."
      : currentRound >= 4 || state.profile === "PIONEER"
        ? "Bạn đang ở mức công nghệ cao nhất của vòng này."
        : state.pendingUpgrade
          ? "Nâng cấp đã được đặt, sẽ áp dụng từ vòng sau."
          : discountedUpgrade && balanceVnd < discountedUpgrade
            ? `Ví cần thêm ${formatCompactVnd(discountedUpgrade - balanceVnd)} để nâng cấp.`
            : null;

  const commandError =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code)
      : null;

  return (
    <ProducerActionCard icon={Store} title="Bán hàng">
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-[14px] border border-success/25 bg-success/10 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-success/80">
            Chưa niêm yết
          </p>
          <p className="mt-0.5 font-mono text-xl font-black text-success">
            {maxQty} <span className="text-xs font-semibold">thùng</span>
          </p>
        </div>
        <div className="rounded-[14px] border border-[#c9b3ff]/40 bg-violet-600/10 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">
            Đang bán
          </p>
          <p className="mt-0.5 font-mono text-xl font-black text-violet-700">
            {listedQty} <span className="text-xs font-semibold">thùng</span>
          </p>
        </div>
        <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Đã sản xuất
          </p>
          <p className="mt-0.5 font-mono text-xl font-black text-foreground">
            {state.producedQuantity} <span className="text-xs font-semibold">thùng</span>
          </p>
        </div>
      </div>

      {phaseReady ? (
        <div className="mt-3 flex flex-col items-center gap-1.5 rounded-[14px] border border-success/25 bg-success/10 px-4 py-6 text-center">
          <CheckCircle2 className="size-6 text-success" aria-hidden />
          <p className="text-sm font-bold text-foreground">Đã giao dịch xong</p>
          <p className="text-xs text-muted-foreground">
            {listedQty > 0
              ? `Còn ${listedQty} thùng đang bán trên chợ, chờ người mua. `
              : ""}
            Đang chờ những người chơi khác hoàn tất giai đoạn chợ mở.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between rounded-[14px] bg-muted/25 px-4 py-3">
            <p className="text-sm font-bold text-foreground">Số lượng đưa ra chợ</p>
            <ProducerQuantityControl
              value={qty}
              max={maxQty}
              disabled={command.isPending || !activeLot || phase !== "MARKET_OPEN"}
              onChange={setQty}
            />
          </div>

          <div className="mt-3 overflow-hidden rounded-[14px] border border-border">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 bg-muted/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <span>Kênh bán</span>
              <span>Giá/thùng</span>
              <span className="sr-only">Hành động</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-border px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Store className="size-4 shrink-0 text-danger" aria-hidden />
                Bán lẻ
              </span>
              <PriceStepper
                value={retailPrice}
                onChange={setRetailPrice}
                disabled={command.isPending}
              />
              <Button
                size="sm"
                className="bg-danger hover:bg-danger/90"
                disabled={!canSell || command.isPending}
                title={sellDisabledReason ?? undefined}
                onClick={() => {
                  if (!activeLot) return;
                  command.mutate({
                    action: "list",
                    inventoryLotId: activeLot.id,
                    quantity: qty,
                    askPriceVnd: retailPrice,
                  });
                }}
              >
                Bán
              </Button>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-border px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Truck className="size-4 shrink-0 text-violet-600" aria-hidden />
                Bán sỉ
              </span>
              <PriceStepper
                value={wholesalePrice}
                onChange={setWholesalePrice}
                disabled={command.isPending}
              />
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700"
                disabled={!canSell || command.isPending}
                title={sellDisabledReason ?? undefined}
                onClick={() => {
                  if (!activeLot) return;
                  command.mutate({
                    action: "wholesale",
                    inventoryLotId: activeLot.id,
                    quantity: qty,
                    minimumPriceVnd: wholesalePrice,
                  });
                }}
              >
                Bán
              </Button>
            </div>
          </div>
        </>
      )}

      <Button
        variant="outline"
        className="mt-3 h-11 w-full gap-2.5 rounded-2xl border-2 border-primary/30 bg-primary/5 text-sm font-bold text-primary hover:bg-primary/10 disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
        disabled={!canUpgrade || command.isPending}
        title={upgradeDisabledReason ?? undefined}
        onClick={() => command.mutate({ action: "invest" })}
      >
        <Zap className="size-4" aria-hidden />
        Nâng cấp công nghệ
        {discountedUpgrade ? ` (−${formatCompactVnd(discountedUpgrade)})` : ""}
      </Button>

      {state.pendingUpgrade ? (
        <p className="mt-2 text-xs font-semibold text-primary">
          Nâng cấp chờ áp dụng từ vòng sau.
        </p>
      ) : null}
      {commandError ? (
        <p className="mt-2 text-sm font-semibold text-danger" role="alert">
          {commandError}
        </p>
      ) : null}
    </ProducerActionCard>
  );
}
